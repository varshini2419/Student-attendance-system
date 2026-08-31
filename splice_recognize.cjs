const fs = require('fs');

let c = fs.readFileSync('backend/src/controllers/attendanceController.js', 'utf8');

const recognizeReplacement = `
    let student = bestMatch._id;

    // Phase 2/5: ActivityState Check with Configurable Cooldown
    const ActivityState = require('../models/ActivityState');
    let state = await ActivityState.findOne({ student, session: session._id });
    
    if (!state) {
      return res.status(200).json({
        success: true,
        matched: true,
        name: bestMatch.name,
        studentId: student,
        confidence: Number(confidence.toFixed(4)),
        action: 'LOGIN_AVAILABLE',
        message: 'Ready for login'
      });
    }

    if (state.currentState === 'IN') {
      const minsSinceLogin = (Date.now() - new Date(state.lastLoginTime).getTime()) / 60000;
      const cooldownTarget = parseInt(process.env.LOGOUT_COOLDOWN_MINUTES) || 5;
      
      if (minsSinceLogin < cooldownTarget) {
        return res.status(200).json({
          success: true,
          matched: true,
          name: bestMatch.name,
          studentId: student,
          confidence: Number(confidence.toFixed(4)),
          action: 'IGNORE',
          message: 'Inside cooldown window'
        });
      } else {
        return res.status(200).json({
          success: true,
          matched: true,
          name: bestMatch.name,
          studentId: student,
          confidence: Number(confidence.toFixed(4)),
          action: 'LOGOUT_AVAILABLE',
          message: 'Ready for logout'
        });
      }
    } else {
      return res.status(200).json({
        success: true,
        matched: true,
        name: bestMatch.name,
        studentId: student,
        confidence: Number(confidence.toFixed(4)),
        action: 'LOGIN_AVAILABLE',
        message: 'Ready for login'
      });
    }
`;

const regex = /if \(\s*existingRecord &&\s*existingRecord\.status === 'Present'\s*\) \{[\s\S]*?message: 'Attendance marked successfully'\s*\}\);/m;

if (regex.test(c)) {
  c = c.replace(regex, recognizeReplacement.trim() + '\\n    });');
  fs.writeFileSync('backend/src/controllers/attendanceController.js', c);
  console.log('Successfully spliced recognizeFace logic with 5-minute config.');
} else {
  console.log('Error: Could not find indices to slice.');
}
