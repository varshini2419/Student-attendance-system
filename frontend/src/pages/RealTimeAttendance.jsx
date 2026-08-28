import { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import {
  Scan,
  StopCircle,
  Play,
  CheckCircle,
  AlertCircle,
  Users,
  Volume2,
  VolumeX,
  UserCheck,
  Download,
  Trash2,
  ScanFace,
  RotateCcw
} from 'lucide-react';
import API from '../utils/api';

const RealTimeAttendance = () => {
  const webcamRef = useRef(null);
  
  // Session States
  const [activeSession, setActiveSession] = useState(null); // { _id, sessionId, status, presentCount, absentCount, excelUrl }
  const [scanning, setScanning] = useState(false);
  
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [cameraError, setCameraError] = useState(null);

  const [detectedStudent, setDetectedStudent] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  
  // Debug mode variables
  const [debugMode, setDebugMode] = useState(true);
  const [debugInfo, setDebugInfo] = useState({
    frameCaptured: 'NO',
    faceDetectorLoaded: 'YES',
    facesFound: 0,
    backendResponse: 'Idle',
    aiResponse: 'Idle'
  });

  const speakText = useCallback((text) => {
    if (!speechEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [speechEnabled]);

  // Handle Start Session
  const handleStartSession = async () => {
    try {
      const res = await API.post('/attendance/session/start');
      if (res.data.success) {
        setActiveSession(res.data.data);
        setAttendanceList([]);
        setDetectedStudent(null);
        setScanning(true);
      }
    } catch (err) {
      console.error('Error starting session:', err);
      alert('Failed to start session');
    }
  };

  // Handle Stop Session
  const handleStopSession = async () => {
    try {
      setScanning(false);
      const res = await API.post('/attendance/session/stop', { sessionId: activeSession._id });
      if (res.data.success) {
        setActiveSession({
          ...activeSession,
          status: 'completed',
          presentCount: res.data.presentCount,
          absentCount: res.data.absentCount,
          excelUrl: res.data.excelUrl
        });
      }
    } catch (err) {
      console.error('Error stopping session:', err);
      alert('Failed to stop session');
    }
  };

  // Handle Download Excel
  const handleDownloadExcel = async () => {
    try {
      if (activeSession && activeSession.excelUrl) {
         // Create the absolute URL for the static report
         const baseUrl = API.defaults.baseURL.replace(/\/api\/?$/, '');
         const downloadUrl = `${baseUrl}${activeSession.excelUrl}`;
         
         const link = document.createElement('a');
         link.href = downloadUrl;
         link.target = '_blank';
         link.setAttribute('download', `${activeSession.sessionId}_Attendance.xlsx`);
         document.body.appendChild(link);
         link.click();
         link.remove();
      } else {
        // Fallback
        const res = await API.get(`/attendance/session/${activeSession._id}/excel`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${activeSession.sessionId}_Report.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error('Error downloading excel:', err);
      alert('Failed to download excel');
    }
  };

  // Handle Clear Session
  const handleClearSession = async () => {
    if (!window.confirm('Are you sure you want to delete this active session and all its data?')) return;
    try {
      const res = await API.delete('/attendance/session/active', { data: { sessionId: activeSession._id } });
      if (res.data.success) {
        setScanning(false);
        setActiveSession(null);
        setAttendanceList([]);
        setDetectedStudent(null);
        alert('Session data cleared');
      }
    } catch (err) {
      console.error('Error clearing session:', err);
      alert('Failed to clear session');
    }
  };

  const scanFrame = useCallback(async () => {
    if (!webcamRef.current || !activeSession || activeSession.status !== 'active') return;

    try {
      const imageSrc = webcamRef.current.getScreenshot({ width: 640, height: 480 });
      if (!imageSrc) {
        setDebugInfo(prev => ({ ...prev, frameCaptured: 'NO' }));
        return;
      }
      
      setDebugInfo(prev => ({ 
        ...prev, 
        frameCaptured: 'YES', 
        backendResponse: 'Sending...',
        aiResponse: 'Waiting...'
      }));

      // Send sessionId to enforce session boundaries
      const response = await API.post('/attendance/recognize', { 
        image: imageSrc,
        sessionId: activeSession._id
      });
      const result = response.data;

      setDebugInfo(prev => ({
        ...prev,
        backendResponse: response.status === 200 ? '200 OK' : 'Error',
        aiResponse: result.message || 'Success',
        facesFound: result.faceDetected ? 1 : 0
      }));

      if (!result.faceDetected) {
        setDetectedStudent(null);
        return;
      }

      if (result.results && Array.isArray(result.results)) {
        let latestMatchedStudent = null;
        const newStudents = [];
        
        result.results.forEach(res => {
          if (res.matched) {
            latestMatchedStudent = {
              name: res.name,
              id: res.studentId,
              confidence: Math.round(res.confidence * 100)
            };
            if (res.message === 'Attendance marked successfully') {
              newStudents.push(latestMatchedStudent);
            }
          }
        });
        
        if (latestMatchedStudent) {
           setDetectedStudent(latestMatchedStudent);
        } else {
           const firstUnmatched = result.results[0] || {};
           setDetectedStudent({
             name: "Unknown",
             id: "-",
             confidence: firstUnmatched.confidence ? Math.round(firstUnmatched.confidence * 100) : 0,
             message: firstUnmatched.message
           });
        }
        
        if (newStudents.length > 0) {
          setAttendanceList(prev => {
            const added = [];
            let updatedList = [...prev];
            newStudents.forEach(newStudent => {
               const exists = updatedList.find(s => s.id === newStudent.id);
               if (!exists) {
                 added.push(newStudent);
                 updatedList = [newStudent, ...updatedList];
               }
            });
            if (added.length > 0) {
              const names = added.map(s => s.name).join(' and ');
              speakText(`Welcome, ${names}`);
            }
            return updatedList;
          });
        }
      } else {
        // Fallback for backward compatibility
        if (result.matched) {
          setDetectedStudent({
            name: result.name,
            id: result.studentId,
            confidence: Math.round(result.confidence * 100)
          });

          if (result.message === 'Attendance marked successfully') {
            setAttendanceList(prev => {
              const exists = prev.find(s => s.id === result.studentId);
              if (exists) return prev;
              
              speakText(`Welcome, ${result.name}`);
              return [{ name: result.name, id: result.studentId }, ...prev];
            });
          }
        } else {
           setDetectedStudent({
              name: "Unknown",
              id: "-",
              confidence: result.confidence ? Math.round(result.confidence * 100) : 0,
              message: result.message
           });
        }
      }

    } catch (err) {
      console.error('Scan API error:', err);
      setDebugInfo(prev => ({ ...prev, backendResponse: 'Failed' }));
    }
  }, [speakText, activeSession]);

  const isScanningRef = useRef(false);

  useEffect(() => {
    let active = true;

    const loop = async () => {
      if (!active || !scanning || !activeSession || activeSession.status !== 'active') {
        return;
      }

      if (!isScanningRef.current) {
        isScanningRef.current = true;
        const t0 = performance.now();
        await scanFrame();
        const t1 = performance.now();
        console.log(`[PERF] Frontend total recognition request duration: ${(t1 - t0).toFixed(2)}ms`);
        isScanningRef.current = false;
      }

      if (active) {
        setTimeout(loop, 1000); // Wait 1 second AFTER previous request finishes
      }
    };

    if (scanning && activeSession && activeSession.status === 'active') {
      loop();
    } else {
      setDetectedStudent(null);
      isScanningRef.current = false;
    }

    return () => {
      active = false;
    };
  }, [scanning, scanFrame, activeSession]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-brand-50 p-1.5 text-brand-600">
              <ScanFace className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">Live AI Engine</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">Real-Time Scanner</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Capture face data streams to automatically mark attendance.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all shadow-sm active:scale-95 ${
              speechEnabled
                ? 'border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100 shadow-brand-500/10'
                : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
            }`}
            title={speechEnabled ? 'Voice Assist On' : 'Voice Assist Muted'}
          >
            {speechEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>

          {!activeSession && (
            <button
              onClick={handleStartSession}
              className="group flex items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all active:scale-95 bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30"
            >
              <Play className="h-5 w-5" />
              <span>INITIALIZE SCANNER</span>
            </button>
          )}

          {activeSession && activeSession.status === 'active' && (
            <>
              <button
                onClick={handleStopSession}
                className="group flex items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all active:scale-95 bg-rose-500 hover:bg-rose-400 shadow-rose-500/30"
              >
                <StopCircle className="h-5 w-5 animate-pulse" />
                <span>TERMINATE SESSION</span>
              </button>
              
              <button
                onClick={handleClearSession}
                className="flex items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-extrabold text-slate-700 shadow-md transition-all active:scale-95 bg-slate-200 hover:bg-slate-300"
                title="Clear current session data"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </>
          )}

          {activeSession && activeSession.status === 'completed' && (
            <>
              <button
                onClick={handleDownloadExcel}
                className="flex items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all active:scale-95 bg-blue-500 hover:bg-blue-400 shadow-blue-500/30"
              >
                <Download className="h-5 w-5" />
                <span>EXPORT SHEET</span>
              </button>
              
              <button
                onClick={() => { setActiveSession(null); setAttendanceList([]); }}
                className="flex items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5 text-sm font-extrabold text-slate-700 shadow-md transition-all active:scale-95 bg-white border border-slate-200 hover:bg-slate-50"
              >
                <RotateCcw className="h-5 w-5" />
                <span>RESET ENGINE</span>
              </button>
            </>
          )}

        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* WEBCAM COLUMN */}
        <div className="glass-card p-8 bg-white lg:col-span-2 flex flex-col items-center space-y-6">
          
          <div className="w-full flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
            <span className="font-extrabold text-slate-500 uppercase text-[11px] tracking-widest">Engine Status</span>
            <span className={`font-black uppercase text-[10px] tracking-widest px-3 py-1.5 rounded-md ${
              !activeSession ? 'bg-slate-200 text-slate-600' :
              activeSession.status === 'active' ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 'bg-blue-100 text-blue-700'
            }`}>
              {!activeSession ? 'OFFLINE' : 
               activeSession.status === 'active' ? `LIVE: ${activeSession.sessionId}` : 'FINALIZED'}
            </span>
          </div>

          <div className="relative w-full overflow-hidden rounded-3xl bg-slate-950 border-4 border-slate-900 shadow-[0_0_40px_rgba(0,0,0,0.1)] flex items-center justify-center aspect-video">
            
            {cameraError && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center p-6 bg-slate-900/95 backdrop-blur-md">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4 border border-rose-500/20">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <span className="text-base font-extrabold text-white">Camera Access Failed</span>
                <span className="text-xs text-rose-300 mt-2 max-w-xs">{cameraError}</span>
              </div>
            )}

            {(!scanning || !activeSession || activeSession.status !== 'active') && !cameraError && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-4 bg-slate-900/70 backdrop-blur-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white mb-4 shadow-lg border border-white/20">
                  <Scan className="h-8 w-8" />
                </div>
                
                {activeSession && activeSession.status === 'completed' ? (
                  <>
                    <span className="text-base font-extrabold text-white tracking-wide">Attendance Completed</span>
                    <div className="mt-4 flex gap-4">
                      <div className="bg-emerald-500/20 border border-emerald-400/50 px-4 py-2 rounded-xl flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        <span className="text-emerald-50 font-bold">Present: {activeSession.presentCount}</span>
                      </div>
                      <div className="bg-rose-500/20 border border-rose-400/50 px-4 py-2 rounded-xl flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-rose-400" />
                        <span className="text-rose-50 font-bold">Absent: {activeSession.absentCount}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-base font-extrabold text-white tracking-wide">Scanner Offline</span>
                    <span className="text-sm text-slate-300 mt-1 max-w-xs">
                      Initialize the scanner to begin.
                    </span>
                  </>
                )}
              </div>
            )}

            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
              onUserMediaError={(err) => setCameraError("Cannot access webcam. Please check permissions or hardware.")}
              className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
            />
            
            {/* UI Reticles & Overlays when active */}
            {scanning && activeSession && activeSession.status === 'active' && !cameraError && (
              <>
                {/* Safe zone overlay */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                  <div className="absolute inset-[10%] border-2 border-dashed border-white/20 rounded-3xl"></div>
                  <div className="absolute top-[10%] left-[10%] w-8 h-8 border-t-4 border-l-4 border-emerald-400/80 rounded-tl-2xl"></div>
                  <div className="absolute top-[10%] right-[10%] w-8 h-8 border-t-4 border-r-4 border-emerald-400/80 rounded-tr-2xl"></div>
                  <div className="absolute bottom-[10%] left-[10%] w-8 h-8 border-b-4 border-l-4 border-emerald-400/80 rounded-bl-2xl"></div>
                  <div className="absolute bottom-[10%] right-[10%] w-8 h-8 border-b-4 border-r-4 border-emerald-400/80 rounded-br-2xl"></div>
                </div>

                {/* Scanline effect */}
                <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent w-full h-[10%] animate-[scan_3s_ease-in-out_infinite]"></div>
              </>
            )}

            {/* User Requested Debug Mode Panel */}
            {debugMode && (
              <div className="absolute top-5 right-5 z-40 bg-black/80 text-emerald-400 font-mono text-[10px] p-4 rounded-xl border border-emerald-500/30 flex flex-col gap-1.5 w-64 shadow-2xl backdrop-blur-md pointer-events-none">
                <div className="border-b border-emerald-500/30 pb-2 mb-2 font-black text-white tracking-widest uppercase text-[9px]">Live Diagnostics</div>
                <div className="flex justify-between"><span>Model State:</span> <span className="text-white">{debugInfo.faceDetectorLoaded}</span></div>
                <div className="flex justify-between"><span>Camera Link:</span> <span className="text-white">{scanning ? 'ACTIVE' : 'IDLE'}</span></div>
                <div className="flex justify-between"><span>Buffer Rate:</span> <span className="text-white">{scanning ? '1 FPS' : '0 FPS'}</span></div>
                <div className="flex justify-between"><span>Faces Found:</span> <span className="text-white">{debugInfo.facesFound}</span></div>
                <div className="flex justify-between"><span>Recognized:</span> <span className="text-white">{detectedStudent && detectedStudent.name !== 'Unknown' ? 'YES' : 'NO'}</span></div>
                <div className="flex justify-between truncate" title={debugInfo.backendResponse}><span>Socket:</span> <span className="text-white">{debugInfo.backendResponse === '200 OK' ? 'CONNECTED' : 'WAITING'}</span></div>
                <div className="flex justify-between"><span>DB Link:</span> <span className="text-white">SECURE</span></div>
                <div className="flex justify-between border-t border-emerald-500/30 pt-1.5 mt-1.5"><span>Entities Logged:</span> <span className="text-white font-bold">{attendanceList.length}</span></div>
              </div>
            )}

            {/* Warning if scanning but no face detected */}
            {scanning && !cameraError && debugInfo.facesFound === 0 && (
              <div className="absolute top-5 left-5 z-40 bg-rose-500/90 backdrop-blur text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-lg shadow-xl animate-pulse border border-rose-400/50 flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5" />
                Waiting for target...
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR COLUMN */}
        <div className="space-y-6">
          
          {/* Detected Student Card */}
          <div className="glass-card p-8 bg-white border-b-4 border-brand-500 relative overflow-hidden">
            {detectedStudent && detectedStudent.name !== 'Unknown' && (
               <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl"></div>
            )}
            
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Current Target
            </h3>
            
            {detectedStudent ? (
              <div className="space-y-4 relative z-10">
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Identity</span>
                  <span className={`block font-black text-xl truncate ${detectedStudent.name === 'Unknown' ? 'text-rose-500' : 'text-slate-900'}`}>
                    {detectedStudent.name}
                  </span>
                  {detectedStudent.message && detectedStudent.name === 'Unknown' && (
                    <span className="block text-xs font-bold text-rose-500 mt-2 whitespace-normal">
                      {detectedStudent.message}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Roll No.</span>
                    <span className="block font-bold text-sm text-slate-700 truncate">{detectedStudent.id}</span>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Match %</span>
                    <span className={`block font-black text-sm ${detectedStudent.name === 'Unknown' ? 'text-rose-500' : 'text-emerald-600'}`}>{detectedStudent.confidence}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl h-48">
                <ScanFace className="h-10 w-10 text-slate-300 mb-3" />
                <span className="text-xs font-bold text-slate-500">Scanning environment...</span>
              </div>
            )}
          </div>

          {/* Attendance List */}
          <div className="glass-card p-8 bg-white flex flex-col h-[340px]">
             <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {activeSession ? `Session Log` : 'Activity Log'}
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {attendanceList.length === 0 ? (
                <div className="text-center text-xs font-medium text-slate-400 mt-16 flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                    <Users className="h-5 w-5" />
                  </div>
                  No identities logged yet.
                </div>
              ) : (
                attendanceList.map((student, idx) => (
                  <div key={`${student.id}-${idx}`} className="flex items-center justify-between p-3.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-100 shadow-sm animate-fade-in-up">
                    <div className="flex items-center gap-3 truncate">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-200/50 text-emerald-700 font-bold text-xs">
                        {student.name[0]}
                      </div>
                      <span className="font-extrabold text-sm truncate">{student.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md shadow-sm border border-emerald-50 shrink-0">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Logged</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default RealTimeAttendance;
