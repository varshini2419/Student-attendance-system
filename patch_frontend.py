import re

path = 'frontend/src/pages/RealTimeAttendance.jsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add Clock to imports
code = code.replace('  ScanFace,\n  RotateCcw\n}', '  ScanFace,\n  RotateCcw,\n  Clock\n}')

# 2. Add isRequestPendingRef and activeSessionRef
old_refs = '''  const isScanningRef = useRef(false);
  const loopTimeoutRef = useRef(null);

  useEffect(() => {
    isScanningRef.current = scanning && activeSession && activeSession.status === 'active';
  }, [scanning, activeSession]);'''

new_refs = '''  const isScanningRef = useRef(false);
  const loopTimeoutRef = useRef(null);
  const isRequestPendingRef = useRef(false);
  const activeSessionRef = useRef(null);

  useEffect(() => {
    activeSessionRef.current = activeSession;
    isScanningRef.current = scanning && activeSession && activeSession.status === 'active';
  }, [scanning, activeSession]);'''

code = code.replace(old_refs, new_refs)

# 3. Replace scanFrame definition
# I need to find the entire scanFrame definition and the useEffect right after it.
# It starts at: const scanFrame = useCallback(async () => {
# and ends at: }, [scanning, activeSession, scanFrame]);

pattern = re.compile(r'  const scanFrame = useCallback\(async \(\) => \{.*?  \}, \[scanning, activeSession, scanFrame\]\);', re.DOTALL)

new_scan_logic = '''  const scanFrame = useCallback(async () => {
    if (!isScanningRef.current) {
      setDetectedStudent(null);
      return;
    }

    if (!webcamRef.current) {
      if (isScanningRef.current) loopTimeoutRef.current = setTimeout(scanFrame, 1000);
      return;
    }

    if (isRequestPendingRef.current) {
      return;
    }

    try {
      isRequestPendingRef.current = true;
      const imageSrc = webcamRef.current.getScreenshot({ width: 640, height: 480 });
      if (!imageSrc) {
        setDebugInfo(prev => ({ ...prev, frameCaptured: 'NO' }));
        return;
      }
      
      const response = await API.post('/attendance/recognize', { 
        image: imageSrc,
        sessionId: activeSessionRef.current._id
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
          confidence: Math.round(result.confidence * 100),
          isCooldown: result.action === 'IGNORE'
        });

        const lastPopupTime = cooldownsRef.current[result.studentId];
        const inCooldown = lastPopupTime && (Date.now() - lastPopupTime < 5000);

        setPendingAction(prevPending => {
          if (!inCooldown && !prevPending && result.action && result.action !== 'IGNORE') {
            const nextAction = {
              type: result.action,
              student: { name: result.name, id: result.studentId }
            };
            
            if (result.action === 'LOGOUT_AVAILABLE') {
              if (pendingActionTimeoutRef.current) clearTimeout(pendingActionTimeoutRef.current);
              pendingActionTimeoutRef.current = setTimeout(() => {
                cooldownsRef.current[result.studentId] = Date.now();
                setPendingAction(null);
              }, 5000);
            }
            return nextAction;
          }
          return prevPending;
        });
      } else {
         setDetectedStudent({
            name: "Unknown",
            id: "N/A",
            confidence: 0,
            message: result.message,
            isCooldown: false
         });
      }
    } catch (err) {
      console.error('Scan error:', err);
      setCameraError(err.response?.data?.message || err.message);
    } finally {
      isRequestPendingRef.current = false;
      if (isScanningRef.current) {
        loopTimeoutRef.current = setTimeout(scanFrame, 1000);
      }
    }
  }, [speakText]);

  useEffect(() => {
    if (scanning && activeSession && activeSession.status === 'active') {
      scanFrame();
    } else {
      setDetectedStudent(null);
    }
    
    return () => {
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
    };
  }, [scanning, activeSession]); // Excluded scanFrame to prevent zombie loops'''

code = pattern.sub(new_scan_logic, code)

# 4. Add the cooldown badge to UI
old_badge = '''                  {detectedStudent.message && detectedStudent.name === 'Unknown' && (
                    <span className="block text-xs font-bold text-rose-500 mt-2 whitespace-normal">
                      {detectedStudent.message}
                    </span>
                  )}'''

new_badge = '''                  {detectedStudent.message && detectedStudent.name === 'Unknown' && (
                    <span className="block text-xs font-bold text-rose-500 mt-2 whitespace-normal">
                      {detectedStudent.message}
                    </span>
                  )}
                  {detectedStudent.isCooldown && (
                    <span className="block text-xs font-bold text-amber-500 mt-2 whitespace-normal flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Cooldown Active
                    </span>
                  )}'''

code = code.replace(old_badge, new_badge)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("RealTimeAttendance.jsx updated safely!")
