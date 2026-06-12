import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import {
  Camera,
  Play,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Search,
  ChevronRight,
  ScanFace
} from 'lucide-react';
import API from '../utils/api';

const FaceRegistration = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const webcamRef = useRef(null);

  // Student State
  const [student, setStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Capture State
  const [capturing, setCapturing] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const totalFramesNeeded = 25;
  const [progressPercent, setProgressPercent] = useState(0);

  // Success/Error State
  const [registerStatus, setRegisterStatus] = useState('idle'); // 'idle' | 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [cameraError, setCameraError] = useState(null);

  // Handle passed state from directory
  useEffect(() => {
    if (location.state?.studentId && location.state?.rollNumber && location.state?.name) {
      setStudent({
        id: location.state.studentId,
        rollNumber: location.state.rollNumber,
        name: location.state.name
      });
    }
  }, [location.state]);

  const handleSearchStudents = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await API.get('/students', { params: { search: searchQuery } });
      if (response.data.success) {
        setSearchResults(response.data.data);
      }
    } catch (err) {
      console.error('Error searching students:', err);
    } finally {
      setSearching(false);
    }
  };

  const getGuideMessage = (frameIndex) => {
    if (frameIndex <= 5) return 'Look straight at the camera and keep a neutral expression';
    if (frameIndex <= 10) return 'Tilt your head slightly to the left';
    if (frameIndex <= 15) return 'Tilt your head slightly to the right';
    if (frameIndex <= 20) return 'Look slightly upwards';
    return 'Look slightly downwards or smile';
  };

  const captureFrame = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot({ width: 640, height: 480 });
      return imageSrc;
    }
    return null;
  };

  const startRegistration = () => {
    setCapturedFrames([]);
    setCurrentStep(0);
    setProgressPercent(0);
    setRegisterStatus('idle');
    setErrorMessage('');
    setCapturing(true);
  };

  useEffect(() => {
    let intervalId = null;

    if (capturing && currentStep < totalFramesNeeded) {
      intervalId = setInterval(() => {
        const frame = captureFrame();
        if (frame) {
          setCapturedFrames((prev) => {
            const updated = [...prev, frame];
            const nextStep = updated.length;
            setCurrentStep(nextStep);
            setProgressPercent(Math.round((nextStep / totalFramesNeeded) * 100));

            if (nextStep >= totalFramesNeeded) {
              setCapturing(false);
              clearInterval(intervalId);
              uploadFaceData(updated);
            }
            return updated;
          });
        }
      }, 200); // Capture frame every 200ms
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [capturing, currentStep]);

  const uploadFaceData = async (frames) => {
    setRegisterStatus('processing');
    try {
      const response = await API.post(`/students/${student.id}/register-faces`, {
        images: frames
      });

      if (response.data.success) {
        setRegisterStatus('success');
      }
    } catch (err) {
      console.error('Error uploading face data:', err);
      setRegisterStatus('error');
      setErrorMessage(
        err.response?.data?.message ||
        'Failed to process face images. Ensure your face is clearly visible and try again.'
      );
    }
  };

  const resetAll = () => {
    setCapturedFrames([]);
    setCurrentStep(0);
    setProgressPercent(0);
    setRegisterStatus('idle');
    setErrorMessage('');
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/students')}
            className="group flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex items-center justify-center rounded-lg bg-indigo-50 p-1.5 text-indigo-600">
                <ScanFace className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Enrollment</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">AI Profile Registration</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Record 3D face templates for real-time authentication</p>
          </div>
        </div>
      </div>

      {/* Step 1: Select Student */}
      {!student ? (
        <div className="mx-auto max-w-xl glass-card p-8 bg-white space-y-6">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 border-2 border-dashed border-slate-200 mb-4">
              <Search className="h-6 w-6 text-slate-300" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-800">Select Student Identity</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Search the central database by name or ID</p>
          </div>

          <form onSubmit={handleSearchStudents} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name or roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {searching ? 'Finding...' : 'Search'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 max-h-72 overflow-y-auto bg-white shadow-sm">
              {searchResults.map((s) => (
                <button
                  key={s._id}
                  onClick={() =>
                    setStudent({
                      id: s._id,
                      rollNumber: s.rollNumber,
                      name: s.name
                    })
                  }
                  className="group flex w-full items-center justify-between p-4 text-left hover:bg-brand-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-sm group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                      {s.name[0]}
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-slate-900 mb-0.5">
                        {s.name}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {s.rollNumber} • <span className="font-medium text-slate-400">{s.branch}-{s.section}</span>
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-brand-500 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Step 2: Camera Capture */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Instructions Card */}
          <div className="glass-card p-8 bg-white space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <span className="block text-[11px] font-bold text-brand-600 tracking-widest uppercase mb-1.5">Target Subject</span>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">{student.name}</h3>
              </div>
              
              <div className="space-y-3 rounded-xl bg-slate-50 p-5 border border-slate-100/60">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Identity ID</span>
                  <span className="text-sm font-mono font-bold text-slate-800 bg-white px-2 py-1 rounded-md border border-slate-200">{student.rollNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">System DB Hash</span>
                  <span className="text-[11px] font-mono font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{student.id.substring(0,8)}...</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Setup Guide</span>
                <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
                  <li className="flex gap-2.5"><span className="text-brand-500">•</span> Position yourself in a well-lit area.</li>
                  <li className="flex gap-2.5"><span className="text-brand-500">•</span> Ensure no other faces are present in the frame.</li>
                  <li className="flex gap-2.5"><span className="text-brand-500">•</span> Keep glasses off if possible for better accuracy.</li>
                  <li className="flex gap-2.5"><span className="text-brand-500">•</span> Rotate head slowly following the screen prompts.</li>
                </ul>
              </div>
            </div>

            {registerStatus !== 'success' && (
              <button
                onClick={() => setStudent(null)}
                className="w-full rounded-xl bg-white border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm active:scale-95 mt-6"
              >
                Change Target Subject
              </button>
            )}
          </div>

          {/* Camera Frame Panel */}
          <div className="glass-card p-8 bg-white lg:col-span-2 flex flex-col items-center justify-center space-y-6">
            
            {registerStatus === 'idle' || registerStatus === 'processing' || capturing ? (
              <div className="relative aspect-video w-full max-w-lg overflow-hidden rounded-3xl bg-slate-950 shadow-[0_0_40px_rgba(0,0,0,0.1)] flex items-center justify-center border-4 border-slate-900">
                
                {/* Camera Error Display */}
                {cameraError && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center p-6 bg-slate-900/95 backdrop-blur-md">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4 border border-rose-500/20">
                      <AlertTriangle className="h-8 w-8" />
                    </div>
                    <span className="text-base font-extrabold text-white">Camera Access Error</span>
                    <span className="text-xs text-slate-400 mt-2 max-w-xs">{cameraError}</span>
                  </div>
                )}

                {/* Webcam Preview */}
                {!capturing && capturedFrames.length === 0 && !cameraError ? (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-4 bg-slate-900/70 backdrop-blur-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white mb-4 border border-white/20">
                      <Camera className="h-8 w-8" />
                    </div>
                    <span className="text-base font-extrabold text-white tracking-wide">Sensor Standby</span>
                    <span className="text-sm font-medium text-slate-300 mt-1">Initiate capture to begin scanning</span>
                  </div>
                ) : null}

                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  onUserMediaError={(err) => setCameraError("Cannot access webcam. Please check permissions or hardware.")}
                  className="h-full w-full object-cover scale-x-[-1]"
                />

                {/* Face Grid Target Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="h-64 w-64 border-[3px] border-dashed border-white/30 rounded-full flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border border-brand-400/20 shadow-[inset_0_0_50px_rgba(59,130,246,0.1)]"></div>
                    {/* Targeting reticles */}
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 border-t-2 border-l-2 border-brand-400/80"></div>
                    <div className="absolute top-1/4 right-1/4 w-2 h-2 border-t-2 border-r-2 border-brand-400/80"></div>
                    <div className="absolute bottom-1/4 left-1/4 w-2 h-2 border-b-2 border-l-2 border-brand-400/80"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-2 h-2 border-b-2 border-r-2 border-brand-400/80"></div>
                  </div>
                </div>

                {/* Progress Circle overlay */}
                {capturing && (
                  <div className="absolute bottom-5 left-5 z-20 rounded-xl bg-slate-900/90 px-4 py-2 text-xs font-extrabold text-white backdrop-blur-md flex items-center gap-2.5 border border-white/10 shadow-xl">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
                    </span>
                    <span>Frame: {currentStep} / {totalFramesNeeded}</span>
                  </div>
                )}
              </div>
            ) : registerStatus === 'success' ? (
              <div className="flex h-80 flex-col items-center justify-center text-center p-8 space-y-5">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20"></div>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shadow-lg border-4 border-white relative z-10">
                    <CheckCircle className="h-10 w-10" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Identity Enrolled</h3>
                  <p className="text-sm font-medium text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                    AI template has been successfully generated and mapped to <strong className="text-slate-700">{student.name}</strong>.
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => navigate('/students')}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                  >
                    Return to Directory
                  </button>
                  <button
                    onClick={resetAll}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Scan Another Template
                  </button>
                </div>
              </div>
            ) : (
              // Error state
              <div className="flex h-80 flex-col items-center justify-center text-center p-8 space-y-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shadow-md border border-rose-100">
                  <AlertTriangle className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Processing Error</h3>
                  <div className="mt-3 rounded-xl bg-rose-50 border border-rose-100 p-4">
                    <p className="text-xs font-semibold text-rose-700 max-w-sm mx-auto">
                      {errorMessage}
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetAll}
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95 mt-2"
                >
                  <RotateCcw className="h-4.5 w-4.5" />
                  <span>Retry Initialization</span>
                </button>
              </div>
            )}

            {/* Guided Prompt Banner */}
            {(capturing || registerStatus === 'processing') && (
              <div className="w-full max-w-lg rounded-2xl bg-slate-50 p-5 border border-slate-100 text-center shadow-inner">
                {capturing ? (
                  <>
                    <span className="block text-[10px] font-bold text-brand-600 tracking-widest uppercase mb-1.5">Action Required</span>
                    <span className="text-base font-extrabold text-slate-800 tracking-tight">{getGuideMessage(currentStep)}</span>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-3 border-brand-500 border-t-transparent"></div>
                    <span className="text-sm font-bold text-slate-700">Synthesizing 3D facial mesh vectors...</span>
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            {registerStatus === 'idle' && !capturing && (
              <div className="w-full max-w-lg flex flex-col items-center gap-5">
                {/* Progress bar */}
                {capturedFrames.length > 0 && (
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Capture Buffer</span>
                      <span className="text-emerald-500">100% Loaded</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                      <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 w-full">
                  {capturedFrames.length > 0 && (
                    <button
                      onClick={resetAll}
                      className="flex-[0.4] rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                    >
                      <RotateCcw className="h-4.5 w-4.5 text-slate-400" />
                      <span>Discard</span>
                    </button>
                  )}
                  <button
                    onClick={startRegistration}
                    className="flex-1 rounded-xl bg-brand-500 hover:bg-brand-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Play className="h-4.5 w-4.5" />
                    <span>{capturedFrames.length > 0 ? 'Force Retake' : 'Initialize Sensor Array'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Capturing Status Bar */}
            {capturing && (
              <div className="w-full max-w-lg space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Data Ingestion</span>
                  <span className="text-brand-600">{progressPercent}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                  <div className="h-full bg-brand-500 transition-all duration-300 relative" style={{ width: `${progressPercent}%` }}>
                    <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30"></div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default FaceRegistration;
