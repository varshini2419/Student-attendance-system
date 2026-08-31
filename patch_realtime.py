import re

filepath = r"c:\Users\pc\New folder\New folder\reasume-enhancer\AI Student Attendance System\frontend\src\pages\RealTimeAttendance.jsx"
with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add isConfirming state
code = code.replace("const [scanning, setScanning] = useState(false);", "const [scanning, setScanning] = useState(false);\n  const [isConfirming, setIsConfirming] = useState(false);")

# 2. Add image: imageSrc
old_next_action = """              const nextAction = {
                type: result.action,
                student: { name: result.name, id: result.studentId }
              };"""
new_next_action = """              const nextAction = {
                type: result.action,
                student: { name: result.name, id: result.studentId },
                image: imageSrc
              };"""
code = code.replace(old_next_action, new_next_action)

# 3. Add image to POST payload and set isConfirming
old_post = """    const handleConfirmAction = async (actionType) => {
    if (!pendingAction) return;
    
    try {
      const student = pendingAction.student;
      const response = await API.post('/attendance/activity-confirm', {
        studentId: student.id,
        sessionId: activeSession._id,
        action: actionType
      });"""
new_post = """    const handleConfirmAction = async (actionType) => {
    if (!pendingAction || isConfirming) return;
    
    try {
      setIsConfirming(true);
      const student = pendingAction.student;
      const response = await API.post('/attendance/activity-confirm', {
        studentId: student.id,
        sessionId: activeSession._id,
        action: actionType,
        image: pendingAction.image
      });"""
code = code.replace(old_post, new_post)

# 4. Clear isConfirming in finally block
old_finally = """    } finally {
      cooldownsRef.current[pendingAction.student.id] = Date.now();
      setPendingAction(null);"""
new_finally = """    } finally {
      setIsConfirming(false);
      cooldownsRef.current[pendingAction.student.id] = Date.now();
      setPendingAction(null);"""
code = code.replace(old_finally, new_finally)

# 5. Disable confirm button
old_btn = """                      <button 
                        onClick={() => handleConfirmAction(pendingAction.type === 'LOGIN_AVAILABLE' ? 'LOGIN' : 'LOGOUT')}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all active:scale-95 """
new_btn = """                      <button 
                        onClick={() => handleConfirmAction(pendingAction.type === 'LOGIN_AVAILABLE' ? 'LOGIN' : 'LOGOUT')}
                        disabled={isConfirming}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all active:scale-95 ${isConfirming ? 'opacity-50 cursor-not-allowed ' : ''}"""
code = code.replace(old_btn, new_btn)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(code)

print("RealTimeAttendance patched!")
