import re

with open('frontend/src/pages/LiveMonitoring.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix the API URL
code = code.replace("API.get(\\/attendance/session/\\/live\\)", "API.get(`/attendance/session/${sessionId}/live`)")

# Fix the classNames
code = code.replace("className={\\w-full text-left p-3 rounded-xl border transition-all \\\\}", "className={`w-full text-left p-3 rounded-xl border transition-all ${selectedSession?._id === s._id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300'}`}")

code = code.replace("className={\\px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider \\\\}", "className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${selectedSession.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}")

code = code.replace("className={\\x0clex-1 flex items-center gap-2 \\\\}", 'className="flex-1 flex items-center gap-2"')

code = code.replace("className={\\x0clex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold \\\\}", 'className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"')

code = code.replace("className={\\x0cont-mono \\\\}", 'className="font-mono"')

# In case the \f didn't render as x0c in python but as literal \f
code = code.replace("className={\\flex-1 flex items-center gap-2 \\\\}", 'className="flex-1 flex items-center gap-2"')
code = code.replace("className={\\flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold \\\\}", 'className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"')
code = code.replace("className={\\font-mono \\\\}", 'className="font-mono"')

# Try literal replacement for \f
code = code.replace("className={\flex-1 flex items-center gap-2 \\}", 'className="flex-1 flex items-center gap-2"')
code = code.replace("className={\flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold \\}", 'className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"')
code = code.replace("className={\font-mono \\}", 'className="font-mono"')

with open('frontend/src/pages/LiveMonitoring.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed JSX!")
