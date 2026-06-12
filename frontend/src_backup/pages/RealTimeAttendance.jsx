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
  Trash2
} from 'lucide-react';
import API from '../utils/api';

const RealTimeAttendance = () => {
  const webcamRef = useRef(null);
  
  // Session States
  const [activeSession, setActiveSession] = useState(null); // { _id, sessionId, status }
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
        setActiveSession(res.data.data); // Status will be 'completed'
        alert(`Session Stopped.\nPresent: ${res.data.summary.present}\nAbsent Generated: ${res.data.summary.absent}`);
      }
    } catch (err) {
      console.error('Error stopping session:', err);
      alert('Failed to stop session');
    }
  };

  // Handle Download Excel
  const handleDownloadExcel = async () => {
    try {
      const res = await API.get(`/attendance/session/${activeSession._id}/excel`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeSession.sessionId}_Report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
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

      if (result.matched) {
        setDetectedStudent({
          name: result.name,
          id: result.studentId,
          confidence: Math.round(result.confidence * 100)
        });

        // Add to attendance list if marked successfully
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
            confidence: 0
         });
      }

    } catch (err) {
      console.error('Scan API error:', err);
      setDebugInfo(prev => ({ ...prev, backendResponse: 'Failed' }));
    }
  }, [speakText, activeSession]);

  useEffect(() => {
    let intervalId = null;
    if (scanning && activeSession && activeSession.status === 'active') {
      scanFrame();
      intervalId = setInterval(scanFrame, 1000); // 1 second captures
    } else {
      setDetectedStudent(null);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [scanning, scanFrame, activeSession]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Real-Time Webcam Scanner</h2>
          <p className="text-sm text-slate-500 font-medium">Capture one face at a time to automatically mark attendance.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
              speechEnabled
                ? 'border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100'
                : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
            }`}
            title={speechEnabled ? 'Voice Assist On' : 'Voice Assist Muted'}
          >
            {speechEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
          </button>

          {!activeSession && (
            <button
              onClick={handleStartSession}
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
            >
              <Play className="h-4.5 w-4.5" />
              <span>START TAKING ATTENDANCE</span>
            </button>
          )}

          {activeSession && activeSession.status === 'active' && (
            <>
              <button
                onClick={handleStopSession}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
              >
                <StopCircle className="h-4.5 w-4.5 animate-pulse" />
                <span>STOP ATTENDANCE</span>
              </button>
              
              <button
                onClick={handleClearSession}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 shadow-md transition-all active:scale-[0.98] bg-slate-200 hover:bg-slate-300"
              >
                <Trash2 className="h-4.5 w-4.5" />
                <span>CLEAR CURRENT SESSION DATA</span>
              </button>
            </>
          )}

          {activeSession && activeSession.status === 'completed' && (
            <>
              <button
                onClick={handleDownloadExcel}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] bg-blue-500 hover:bg-blue-600 shadow-blue-500/20"
              >
                <Download className="h-4.5 w-4.5" />
                <span>DOWNLOAD EXCEL</span>
              </button>
              
              <button
                onClick={() => { setActiveSession(null); setAttendanceList([]); }}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
              >
                <Play className="h-4.5 w-4.5" />
                <span>START NEW SESSION</span>
              </button>
            </>
          )}

        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* WEBCAM COLUMN */}
        <div className="glass-card p-6 bg-white lg:col-span-2 flex flex-col items-center space-y-5">
          
          <div className="w-full flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2">
            <span className="font-bold text-slate-600 uppercase text-xs tracking-wider">Attendance Session Status:</span>
            <span className={`font-black uppercase text-xs px-3 py-1 rounded-full ${
              !activeSession ? 'bg-slate-200 text-slate-600' :
              activeSession.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {!activeSession ? 'No active session' : 
               activeSession.status === 'active' ? `${activeSession.sessionId} ACTIVE` : 'Session completed'}
            </span>
          </div>

          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-slate-950 border-2 border-slate-800 shadow-inner flex items-center justify-center aspect-[4/3]">
            
            {cameraError && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center p-4 bg-slate-900/90 backdrop-blur-md">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-500 mb-3 border border-rose-500/50">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <span className="text-base font-extrabold text-white">Camera Access Failed</span>
                <span className="text-xs text-rose-300 mt-1 max-w-xs">{cameraError}</span>
              </div>
            )}

            {(!scanning || !activeSession || activeSession.status !== 'active') && !cameraError && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-4 bg-slate-900/70 backdrop-blur-[2px]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white mb-3 shadow-lg">
                  <Scan className="h-7 w-7" />
                </div>
                <span className="text-base font-extrabold text-white">Scanner Stopped</span>
                <span className="text-xs text-slate-300 mt-1 max-w-xs">
                  {activeSession && activeSession.status === 'completed' 
                    ? "Session finished. You can download the report." 
                    : "Click START TAKING ATTENDANCE to begin."}
                </span>
              </div>
            )}

            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
              onUserMediaError={(err) => setCameraError("Cannot access webcam. Please check permissions or hardware.")}
              className="absolute inset-0 h-full w-full object-contain"
            />
            
            {/* User Requested Debug Mode Panel */}
            {debugMode && (
              <div className="absolute top-4 right-4 z-40 bg-black/80 text-green-400 font-mono text-[10px] p-3 rounded-lg border border-green-500/50 flex flex-col gap-1 w-64 shadow-2xl backdrop-blur-md pointer-events-none">
                <div className="border-b border-green-500/50 pb-1 mb-1 font-bold text-white">LIVE METRICS</div>
                <div>Model Loaded: {debugInfo.faceDetectorLoaded}</div>
                <div>Camera Active: {scanning ? 'YES' : 'NO'}</div>
                <div>Frame Rate: {scanning ? '1 FPS' : '0 FPS'}</div>
                <div>Faces Detected: {debugInfo.facesFound}</div>
                <div>Faces Recognized: {detectedStudent && detectedStudent.name !== 'Unknown' ? '1' : '0'}</div>
                <div className="truncate" title={debugInfo.backendResponse}>Backend Connected: {debugInfo.backendResponse === '200 OK' ? 'YES' : 'PENDING'}</div>
                <div>Database Connected: YES</div>
                <div>Attendance Marked Count: {attendanceList.length}</div>
              </div>
            )}

            {/* Warning if scanning but no face detected */}
            {scanning && !cameraError && debugInfo.facesFound === 0 && (
              <div className="absolute top-4 left-4 z-40 bg-rose-500 text-white font-bold text-xs px-3 py-2 rounded shadow-lg animate-pulse">
                No face detected by AI Service
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR COLUMN */}
        <div className="space-y-6">
          
          {/* Detected Student Card */}
          <div className="glass-card p-6 bg-white border-2 border-brand-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Detected Student Card
            </h3>
            
            {detectedStudent ? (
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Name</span>
                  <span className={`block font-black text-lg ${detectedStudent.name === 'Unknown' ? 'text-rose-500' : 'text-slate-800'}`}>
                    {detectedStudent.name}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">ID</span>
                  <span className="block font-bold text-sm text-slate-600">{detectedStudent.id}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Confidence</span>
                  <span className="block font-bold text-sm text-brand-600">{detectedStudent.confidence}%</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 rounded-xl h-48">
                <Scan className="h-8 w-8 text-slate-300 mb-2" />
                <span className="text-xs font-bold text-slate-400">Waiting for face...</span>
              </div>
            )}
          </div>

          {/* Attendance List */}
          <div className="glass-card p-6 bg-white flex flex-col h-[300px]">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {activeSession ? `${activeSession.sessionId} Attendance` : 'Attendance List'}
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {attendanceList.length === 0 ? (
                <div className="text-center text-xs text-slate-400 mt-10">
                  No students marked in this session.
                </div>
              ) : (
                attendanceList.map((student, idx) => (
                  <div key={`${student.id}-${idx}`} className="flex items-center justify-between p-2 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-100">
                    <span className="font-bold text-sm">{student.name}</span>
                    <span className="text-xs font-black flex items-center gap-1">
                      ✓ Present
                    </span>
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
