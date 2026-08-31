import re

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # We need to replace the complex pairs reconstruction with just map over cycles
    old_block = r"""                                // Organize into Login/Logout pairs
                                const pairs = \[\];
                                let currentPair = \{\};
                                record\.events\.forEach\(ev => \{
                                  if \(ev\.eventType === 'LOGIN'\) \{
                                    if \(currentPair\.login\) \{
                                      pairs\.push\(currentPair\); // Close unfinished pair
                                      currentPair = \{\};
                                    \}
                                    currentPair\.login = ev;
                                  \} else if \(ev\.eventType === 'LOGOUT'\) \{
                                    currentPair\.logout = ev;
                                    pairs\.push\(currentPair\);
                                    currentPair = \{\};
                                  \}
                                \}\);
                                if \(currentPair\.login\) pairs\.push\(currentPair\);

                                return pairs\.map\(\(p, i\) => \("""

    new_block = """                                return (record.cycles || []).map((c, i) => ("""
    
    code = re.sub(old_block, new_block, code)

    # We also need to fix formatTime(p.login?.timestamp) -> formatTime(c.loginTime)
    code = code.replace("formatTime(p.login?.timestamp)", "formatTime(c.loginTime)")
    # And p.logout -> (c.cycleStatus === 'COMPLETED')
    code = code.replace("p.logout ? formatTime(p.logout.timestamp)", "c.cycleStatus === 'COMPLETED' ? formatTime(c.logoutTime)")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)


patch_file(r"c:\Users\pc\New folder\New folder\reasume-enhancer\AI Student Attendance System\frontend\src\pages\LiveMonitoring.jsx")
try:
    patch_file(r"c:\Users\pc\New folder\New folder\reasume-enhancer\AI Student Attendance System\frontend\src\pages\AttendanceLogs.jsx")
except:
    pass

print("UI components patched!")
