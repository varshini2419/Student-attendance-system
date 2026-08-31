import re

path = 'frontend/src/pages/RealTimeAttendance.jsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add recognitionHoldRef
if 'recognitionHoldRef' not in code:
    code = code.replace(
        'const activeSessionRef = useRef(null);',
        'const activeSessionRef = useRef(null);\n  const recognitionHoldRef = useRef({ studentId: null, timestamp: 0 });'
    )

# 2. Modify faceDetected check
old_face_detected = '''      if (!result.faceDetected) {
        setDetectedStudent(null);
        return;
      }'''

new_face_detected = '''      if (!result.faceDetected) {
        if (Date.now() - recognitionHoldRef.current.timestamp < 3000) {
          console.log("[STABILITY] Holding previous identity (no face)");
          return;
        }
        console.log("[STABILITY] Identity cleared");
        setDetectedStudent(null);
        return;
      }'''

code = code.replace(old_face_detected, new_face_detected)

# 3. Modify result.matched block
old_matched = '''      if (result.matched) {
        setDetectedStudent({
          name: result.name,
          id: result.studentId,
          confidence: Math.round(result.confidence * 100),
          isCooldown: result.action === 'IGNORE'
        });'''

new_matched = '''      if (result.matched) {
        if (recognitionHoldRef.current.studentId !== result.studentId) {
          console.log("[STABILITY] Identity locked: " + result.name);
        }
        recognitionHoldRef.current = { studentId: result.studentId, timestamp: Date.now() };

        setDetectedStudent({
          name: result.name,
          id: result.studentId,
          confidence: Math.round(result.confidence * 100),
          isCooldown: result.action === 'IGNORE'
        });'''

if '[STABILITY] Identity locked' not in code:
    code = code.replace(old_matched, new_matched)

# 4. Modify else block
# We need to find the specific else block that sets Unknown
pattern = re.compile(r'\} else \{\s*setDetectedStudent\(\{\s*name: "Unknown",.*?\}\);', re.DOTALL)

new_else = '''} else {
        if (Date.now() - recognitionHoldRef.current.timestamp < 3000) {
          console.log("[STABILITY] Holding previous identity (ignoring unknown)");
          return;
        }
        console.log("[STABILITY] Identity cleared (unknown face)");
        setDetectedStudent({
          name: "Unknown",
          id: "-",
          confidence: result.confidence ? Math.round(result.confidence * 100) : 0,
          message: result.message,
          isCooldown: false
        });'''

if '[STABILITY] Identity cleared (unknown face)' not in code:
    code = pattern.sub(new_else, code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("frontend patched successfully via python!")
