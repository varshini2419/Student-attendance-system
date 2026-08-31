import os
import re

# 1. Fix .env BOM
env_path = 'frontend/.env'
if os.path.exists(env_path):
    with open(env_path, 'rb') as f:
        content = f.read()
    if content.startswith(b'\xef\xbb\xbf'):
        content = content[3:]
        with open(env_path, 'wb') as f:
            f.write(content)
        print("Removed UTF-8 BOM from frontend/.env")

# 2. Update api.js
api_js_path = 'frontend/src/utils/api.js'
with open(api_js_path, 'r', encoding='utf-8') as f:
    api_code = f.read()

# Replace the hardcoded string with environment-aware fallback
old_line = "let baseUrl = import.meta.env.VITE_API_URL || 'https://student-attendance-system-1-1bgq.onrender.com/api';"
new_line = "let baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:5000/api' : 'https://student-attendance-system-1-1bgq.onrender.com/api');"
api_code = api_code.replace(old_line, new_line)

with open(api_js_path, 'w', encoding='utf-8') as f:
    f.write(api_code)
print("Updated frontend/src/utils/api.js")

# 3. Update Navbar.jsx
navbar_path = 'frontend/src/components/Navbar.jsx'
with open(navbar_path, 'r', encoding='utf-8') as f:
    navbar_code = f.read()

old_ai_line = "let aiUrl = import.meta.env.VITE_AI_SERVICE_URL || 'https://student-attendance-system-xvn5.onrender.com';"
new_ai_line = "let aiUrl = import.meta.env.VITE_AI_SERVICE_URL || (import.meta.env.MODE === 'development' ? 'http://127.0.0.1:8000' : 'https://student-attendance-system-xvn5.onrender.com');"
navbar_code = navbar_code.replace(old_ai_line, new_ai_line)

with open(navbar_path, 'w', encoding='utf-8') as f:
    f.write(navbar_code)
print("Updated frontend/src/components/Navbar.jsx")

