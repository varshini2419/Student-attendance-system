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
  ChevronRight
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/students')}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Face Database Registration</h2>
          <p className="text-sm text-slate-500 font-medium">Record 3D face templates for real-time authentication</p>
        </div>
      </div>

      {/* Step 1: Select Student */}
      {!student ? (
        <div className="mx-auto max-w-xl glass-card p-6 bg-white space-y-6">
          <div className="text-center">
            <Search className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-bold text-slate-800">Select Student to Register</h3>
            <p className="text-xs text-slate-400 mt-1">Search the database by student name or roll number first</p>
          </div>

          <form onSubmit={handleSearchStudents} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
              required
            />
            <button
              type="submit"
              disabled={searching}
              className="rounded-xl bg-brand-500 hover:bg-brand-600 px-5 text-sm font-bold text-white shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
            >
              Search
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 max-h-64 overflow-y-auto">
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
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <span className="block text-sm font-semibold text-slate-800 leading-none mb-1">
                      {s.name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {s.rollNumber} • {s.branch}-{s.section}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Step 2: Camera Capture */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Instructions Card */}
          <div className="glass-card p-6 bg-white space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="block text-[10px] font-bold text-brand-600 tracking-wider uppercase">Active Registration</span>
              <h3 className="text-lg font-extrabold text-slate-900 leading-tight">{student.name}</h3>
              <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-100/50 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Roll Number:</span>
                  <span className="font-mono font-bold text-slate-700">{student.rollNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Database ID:</span>
                  <span className="font-mono text-[10px] text-slate-500 truncate max-w-[150px]">{student.id}</span>
                </div>
              </div>

              <div className="space-y-3.5 pt-4">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Instructions</span>
                <ul className="space-y-2 text-xs font-semibold text-slate-500 list-disc list-inside">
                  <li>Position yourself in a well-lit area.</li>
                  <li>Ensure no other faces are present in the frame.</li>
                  <li>Keep glasses off if possible for better accuracy.</li>
                  <li>Rotate head slowly following the screen prompts.</li>
                </ul>
              </div>
            </div>

            {registerStatus !== 'success' && (
              <button
                onClick={() => setStudent(null)}
                className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Select Different Student
              </button>
            )}
          </div>

          {/* Camera Frame Panel */}
          <div className="glass-card p-6 bg-white lg:col-span-2 flex flex-col items-center justify-center space-y-6">
            
            {registerStatus === 'idle' || registerStatus === 'processing' || capturing ? (
              <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
                
                {/* Camera Error Display */}
                {cameraError && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center p-4 bg-slate-900/90 backdrop-blur-md">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-500 mb-2 border border-rose-500/50">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-bold text-white">Camera Access Failed</span>
                    <span className="text-[10px] text-rose-300 mt-1 max-w-[200px]">{cameraError}</span>
                  </div>
                )}

                {/* Webcam Preview */}
                {!capturing && capturedFrames.length === 0 && !cameraError ? (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-4 bg-slate-900/60 backdrop-blur-[2px]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white mb-2">
                      <Camera className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-bold text-white">Camera Standby</span>
                    <span className="text-xs text-slate-300 mt-1">Click Start Capture when ready</span>
                  </div>
                ) : null}

                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  onUserMediaError={(err) => setCameraError("Cannot access webcam. Please check permissions or hardware.")}
                  className="h-full w-full object-cover"
                />

                {/* Face Grid Target Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="h-56 w-56 border-2 border-dashed border-white/40 rounded-full flex items-center justify-center">
                    <div className="h-48 w-48 border border-brand-400/20 rounded-full"></div>
                  </div>
                </div>

                {/* Progress Circle overlay */}
                {capturing && (
                  <div className="absolute bottom-4 left-4 z-20 rounded-xl bg-slate-900/80 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md flex items-center gap-2">
                    <span className="animate-ping h-2.5 w-2.5 rounded-full bg-brand-500"></span>
                    <span>Capturing: {currentStep} / {totalFramesNeeded}</span>
                  </div>
                )}
              </div>
            ) : registerStatus === 'success' ? (
              <div className="flex h-72 flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-md">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">Registration Successful</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm">
                    Student templates calculated and uploaded. Face authentication is active for this student.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => navigate('/students')}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Back to Directory
                  </button>
                  <button
                    onClick={resetAll}
                    className="rounded-xl bg-brand-500 hover:bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition-all"
                  >
                    Register Again
                  </button>
                </div>
              </div>
            ) : (
              // Error state
              <div className="flex h-72 flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-md">
                  <AlertTriangle className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">Registration Failed</h3>
                  <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 rounded-xl p-3.5 mt-2 max-w-sm">
                    {errorMessage}
                  </p>
                </div>
                <button
                  onClick={resetAll}
                  className="rounded-xl bg-brand-500 hover:bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Retry Capture</span>
                </button>
              </div>
            )}

            {/* Guided Prompt Banner */}
            {(capturing || registerStatus === 'processing') && (
              <div className="w-full max-w-md rounded-xl bg-slate-50 p-4 border border-slate-100 text-center shadow-sm">
                {capturing ? (
                  <>
                    <span className="block text-[10px] font-bold text-brand-600 tracking-wider uppercase mb-1">Guided Angle Position</span>
                    <span className="text-sm font-semibold text-slate-800">{getGuideMessage(currentStep)}</span>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                    <span className="text-xs font-bold text-slate-700">Analyzing captured face frames in AI engine...</span>
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            {registerStatus === 'idle' && !capturing && (
              <div className="w-full max-w-md flex flex-col items-center gap-4">
                {/* Progress bar */}
                {capturedFrames.length > 0 && (
                  <div className="w-full space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold text-slate-400">
                      <span>Capture Completed</span>
                      <span>100%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 w-full">
                  {capturedFrames.length > 0 && (
                    <button
                      onClick={resetAll}
                      className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Retake</span>
                    </button>
                  )}
                  <button
                    onClick={startRegistration}
                    className="flex-1 rounded-xl bg-brand-500 hover:bg-brand-600 py-3 text-sm font-bold text-white shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Play className="h-4 w-4" />
                    <span>{capturedFrames.length > 0 ? 'Restart Capture' : 'Start Capture Session'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Capturing Status Bar */}
            {capturing && (
              <div className="w-full max-w-md space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                  <span>Capturing Templates...</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
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
