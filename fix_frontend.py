import re

path = 'frontend/src/pages/RealTimeAttendance.jsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Fix the if (result.matched) block
pattern = re.compile(r'(if \(result\.matched\) \{)(\s+setDetectedStudent\(\{)')
replacement = r'\1\n        if (recognitionHoldRef.current.studentId !== result.studentId) {\n          console.log("[STABILITY] Identity locked: " + result.name);\n        }\n        recognitionHoldRef.current = { studentId: result.studentId, timestamp: Date.now() };\n\2'

code = pattern.sub(replacement, code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Matched block fixed!")
