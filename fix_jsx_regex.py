import re

with open('frontend/src/pages/LiveMonitoring.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace any className={...\\} pattern entirely.
# For example, className={\x0clex-1 flex items-center gap-2 \\}
# Let's just use re.sub with a regex that matches `className={\[anything]\}`

code = re.sub(r'className=\{\\.*?lex-1 flex items-center gap-2 \\\\\}', 'className="flex-1 flex items-center gap-2"', code)
code = re.sub(r'className=\{\\.*?lex h-5 w-5 items-center justify-center rounded-full text-\[10px\] font-bold \\\\\}', 'className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"', code)
code = re.sub(r'className=\{\\.*?ont-mono \\\\\}', 'className="font-mono"', code)

with open('frontend/src/pages/LiveMonitoring.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed JSX again!")
