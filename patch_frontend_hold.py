import re

path = 'frontend/src/pages/RealTimeAttendance.jsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add recognitionHoldRef
ref_block_old = '''  const isRequestPendingRef = useRef(false);
  const activeSessionRef = useRef(null);'''

ref_block_new = '''  const isRequestPendingRef = useRef(false);
  const activeSessionRef = useRef(null);
  const recognitionHoldRef = useRef({ studentId: null, timestamp: 0 });'''

code = code.replace(ref_block_old, ref_block_new)

# 2. Add temporal hold logic
scan_block_old = '''      if (!result.faceDetected) {
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

        const lastPopupTime = cooldownsRef.current[result.studentId];'''

scan_block_new = '''      if (!result.faceDetected) {
        if (Date.now() - recognitionHoldRef.current.timestamp < 2500) {
          console.log("[STABILITY] Holding previous identity (no face)");
          return;
        }
        console.log("[STABILITY] Identity cleared");
        setDetectedStudent(null);
        return;
      }

      if (result.matched) {
        if (recognitionHoldRef.current.studentId !== result.studentId) {
          console.log("[STABILITY] Identity locked: " + result.name);
        }
        recognitionHoldRef.current = { studentId: result.studentId, timestamp: Date.now() };

        setDetectedStudent({
          name: result.name,
          id: result.studentId,
          confidence: Math.round(result.confidence * 100),
          isCooldown: result.action === 'IGNORE'
        });

        const lastPopupTime = cooldownsRef.current[result.studentId];'''

code = code.replace(scan_block_old, scan_block_new)

# 3. Add temporal hold logic for unknown faces
else_block_old = '''      } else {
         setDetectedStudent({
            name: "Unknown",
            id: "N/A",
            confidence: 0,
            message: result.message,
            isCooldown: false
         });
      }'''

else_block_new = '''      } else {
        if (Date.now() - recognitionHoldRef.current.timestamp < 2500) {
          console.log("[STABILITY] Holding previous identity (ignoring unknown)");
          return;
        }
        console.log("[STABILITY] Identity cleared (unknown face)");
        setDetectedStudent({
          name: "Unknown",
          id: "N/A",
          confidence: 0,
          message: result.message,
          isCooldown: false
        });
      }'''

code = code.replace(else_block_old, else_block_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("frontend patched with temporal hold!")
