import re

with open('frontend/src/pages/LiveMonitoring.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Remove socket import
code = re.sub(r"import \{ useSocket \} from '\.\./context/SocketContext';\n", "", code)
code = re.sub(r'import \{ useSocket \} from "\.\./context/SocketContext";\n', "", code)

# Remove socket hook
code = re.sub(r'  const \{ socket, connected \} = useSocket\(\);\n', "", code)

# Remove socket useEffect
socket_effect_pattern = r"  useEffect\(\(\) => \{\n    if \(\!socket \|\| \!selectedSession\) return;\n\n    const handleActivity = \(data\) => \{\n      if \(data\.sessionId === selectedSession\._id\) \{\n        // Refetch to get the accurate updated timeline\n        fetchLiveTracking\(selectedSession\._id\);\n      \}\n    \};\n\n    socket\.on\('activity_logged', handleActivity\);\n    return \(\) => \{\n      socket\.off\('activity_logged', handleActivity\);\n    \};\n  \}, \[socket, selectedSession\]\);\n"
code = re.sub(socket_effect_pattern, "", code, flags=re.MULTILINE)

with open('frontend/src/pages/LiveMonitoring.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Removed socket references!")
