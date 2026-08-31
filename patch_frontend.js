const fs = require('fs');
const file = 'frontend/src/pages/RealTimeAttendance.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add new state variables
content = content.replace(
  "const [detectedStudent, setDetectedStudent] = useState(null);",
  "const [detectedStudent, setDetectedStudent] = useState(null);\n    const [pendingAction, setPendingAction] = useState(null);\n    const pendingActionTimeoutRef = useRef(null);\n    const cooldownsRef = useRef({});"
);

// 2. Add confirm function
const confirmFunc = \
    const handleConfirmAction = async (actionType) => {
      if (!pendingAction) return;
      
      try {
        const student = pendingAction.student;
        const response = await API.post('/attendance/activity-confirm', {
          studentId: student.id,
          sessionId: activeSession._id,
          action: actionType
        });
        
        if (response.data.success) {
          setAttendanceList(prev => {
            const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            return [{ name: student.name, id: student.id, type: actionType, time: timeStr }, ...prev];
          });
          
          if (actionType === 'LOGIN') {
            speakText('Login recorded for ' + student.name);
          } else {
            speakText('Logout recorded for ' + student.name);
          }
        }
      } catch (err) {
        console.error('Action confirmation failed', err);
      } finally {
        cooldownsRef.current[pendingAction.student.id] = Date.now();
        setPendingAction(null);
        if (pendingActionTimeoutRef.current) {
          clearTimeout(pendingActionTimeoutRef.current);
          pendingActionTimeoutRef.current = null;
        }
      }
    };
\;
content = content.replace("const isScanningRef = useRef(false);", "const isScanningRef = useRef(false);\n" + confirmFunc);

// 3. Update scanFrame logic
const scanLogicOld = \        if (result.matched) {
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
              
              speakText(\\\Welcome, \\\\\\);
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
        }\;

const scanLogicNew = \        if (result.matched) {
          setDetectedStudent({
            name: result.name,
            id: result.studentId,
            confidence: Math.round(result.confidence * 100)
          });

          // Cooldown check (5 seconds)
          const lastPopupTime = cooldownsRef.current[result.studentId];
          const inCooldown = lastPopupTime && (Date.now() - lastPopupTime < 5000);

          if (!inCooldown && !pendingAction && result.action && result.action !== 'IGNORE') {
            setPendingAction({
              type: result.action,
              student: { name: result.name, id: result.studentId }
            });
            
            // Auto dismiss for LOGOUT
            if (result.action === 'LOGOUT_AVAILABLE') {
              if (pendingActionTimeoutRef.current) clearTimeout(pendingActionTimeoutRef.current);
              pendingActionTimeoutRef.current = setTimeout(() => {
                cooldownsRef.current[result.studentId] = Date.now();
                setPendingAction(null);
              }, 5000);
            }
          }

        } else {
           setDetectedStudent({
              name: "Unknown",
              id: "-",
              confidence: result.confidence ? Math.round(result.confidence * 100) : 0,
              message: result.message
           });
        }\;

content = content.replace(scanLogicOld, scanLogicNew);

// 4. Update the popup rendering. Add it before the end of the return statement.
const popupUI = \
          {/* Action Popup UI */}
          {pendingAction && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm rounded-3xl animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 border border-slate-100 text-center">
                <div className="h-16 w-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mb-4">
                  <ScanFace className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1">{pendingAction.student.name}</h3>
                <p className="text-sm font-medium text-slate-500 mb-6">
                  {pendingAction.type === 'LOGIN_AVAILABLE' ? 'Ready to log in?' : 'Do you want to log out?'}
                </p>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => {
                      cooldownsRef.current[pendingAction.student.id] = Date.now();
                      setPendingAction(null);
                      if (pendingActionTimeoutRef.current) clearTimeout(pendingActionTimeoutRef.current);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleConfirmAction(pendingAction.type === 'LOGIN_AVAILABLE' ? 'LOGIN' : 'LOGOUT')}
                    className={\lex-1 py-3 px-4 rounded-xl font-bold text-white transition-all active:scale-95 \\}
                  >
                    {pendingAction.type === 'LOGIN_AVAILABLE' ? 'LOGIN' : 'LOG OUT'}
                  </button>
                </div>
              </div>
            </div>
          )}
\;

// Inject popup inside the video container
content = content.replace('className="absolute top-5 left-5 z-40 bg-rose-500/90', popupUI + '\n              <div className="absolute top-5 left-5 z-40 bg-rose-500/90');

// 5. Update the Live Activity Display list
const oldListRender = \<div key={\\\\\\-\\\\\\\} className="flex items-center justify-between p-3.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-100 shadow-sm animate-fade-in-up">
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
                    </div>\;

const newListRender = \<div key={\\\\\\-\\\\\\\} className={\\\lex items-center justify-between p-3.5 rounded-xl border shadow-sm animate-fade-in-up \\\\}>
                      <div className="flex items-center gap-3 truncate">
                        <div className={\\\lex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-xs \\\\}>
                          {student.name[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-sm truncate">{student.name}</span>
                          <span className="text-[10px] font-bold text-slate-500">{student.time || '00:00 AM'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md shadow-sm border border-emerald-50 shrink-0">
                        {student.type === 'LOGOUT' ? (
                          <>
                            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">LOGOUT</span>
                          </>
                        ) : (
                          <>
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">LOGIN</span>
                          </>
                        )}
                      </div>
                    </div>\;

content = content.replace(oldListRender, newListRender);

// Also need to inject pendingAction into dependency array of scanFrame
content = content.replace("}, [speakText, activeSession, scanning]);", "}, [speakText, activeSession, scanning, pendingAction]);");

fs.writeFileSync(file, content);
console.log('Frontend patched!');
