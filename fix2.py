import re

path = 'backend/src/controllers/attendanceController.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# I want to add "faceDetected: true," just before "success: true," in the specific recognizeFace blocks
# Wait, actually I can just do a precise replace for the blocks that have "success: true,\n        matched: true,\n        name: bestMatch.name,"
# This is safe because it only occurs in this specific function.

old_str = '''      return res.status(200).json({
        success: true,
        matched: true,
        name: bestMatch.name,'''

new_str = '''      return res.status(200).json({
        faceDetected: true,
        success: true,
        matched: true,
        name: bestMatch.name,'''

old_str2 = '''        return res.status(200).json({
          success: true,
          matched: true,
          name: bestMatch.name,'''

new_str2 = '''        return res.status(200).json({
          faceDetected: true,
          success: true,
          matched: true,
          name: bestMatch.name,'''

code = code.replace(old_str, new_str)
code = code.replace(old_str2, new_str2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed attendanceController.js!")
