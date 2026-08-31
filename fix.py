import re

with open('perfect_build.cjs', 'r') as f:
    content = f.read()

content = content.replace(r"\\'Present\\'", r"'Present'")

with open('perfect_build.cjs', 'w') as f:
    f.write(content)

print("Fixed!")
