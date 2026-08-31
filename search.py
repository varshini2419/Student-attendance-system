import os
import re

def search_files(directory, pattern):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if 'dist' in dirs:
            dirs.remove('dist')
            
        for file in files:
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if pattern in content:
                        print(f"Match found in: {path}")
            except Exception as e:
                pass

search_files('frontend/src', 'student-attendance-system-1-1bgq.onrender.com')
search_files('frontend', 'student-attendance-system-1-1bgq.onrender.com')
search_files('frontend/src', 'student-attendance-system-xvn5.onrender.com')
