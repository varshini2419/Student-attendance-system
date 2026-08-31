const fs = require('fs');
const file = 'backend/src/controllers/attendanceController.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
if (!content.includes('ActivityState')) {
  content = content.replace(
    "const Attendance = require('../models/Attendance');",
    "const Attendance = require('../models/Attendance');\nconst ActivityState = require('../models/ActivityState');\nconst ActivityEvent = require('../models/ActivityEvent');"
  );
}

// 2. Find where matching logic ends
const thresholdEndIndex = content.indexOf('if (\n      existingRecord &&\n      existingRecord.status === \'Present\'\n    )');
const functionEndIndex = content.indexOf('} catch (error) {\n    console.error(\n      \'[RECOGNIZE FACE ERROR]\',\n      error\n    );', thresholdEndIndex);

const newLogic = \    const state = await ActivityState.findOne({ student: bestMatch._id, session: session._id });

    let action = 'LOGIN_AVAILABLE';
    let reason = null;

    if (state && state.currentState === 'IN') {
      const elapsedMins = (Date.now() - new Date(state.lastLoginTime).getTime()) / 60000;
      if (elapsedMins < 30) {
        action = 'IGNORE';
        reason = 'WITHIN_30_MINUTE_PROTECTION';
      } else {
        action = 'LOGOUT_AVAILABLE';
      }
    }

    return res.status(200).json({
      faceDetected: true,
      matched: true,
      studentId: bestMatch._id,
      name: bestMatch.name,
      confidence,
      action,
      reason,
      message: action === 'IGNORE' ? 'Recent login detected' : (action === 'LOGIN_AVAILABLE' ? 'Login Available' : 'Logout Available')
    });
  \;

content = content.substring(0, thresholdEndIndex) + newLogic + content.substring(functionEndIndex);

// 3. Add confirmActivity
const confirmMethod = \

// @desc    Confirm Login/Logout Activity
// @route   POST /api/attendance/activity-confirm
// @access  Private (Admin & Faculty)
exports.confirmActivity = async (req, res) => {
  try {
    const { studentId, sessionId, action } = req.body;

    if (!studentId || !sessionId || !action) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    const session = await AttendanceSession.findById(sessionId);
    if (!session || session.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Invalid or inactive session' });
    }

    let state = await ActivityState.findOne({ student: studentId, session: sessionId });
    if (!state) {
      state = new ActivityState({ student: studentId, session: sessionId, totalDurationMinutes: 0 });
    }

    const io = req.app.get('io');
    const todayStr = new Date().toISOString().split('T')[0];

    if (action === 'LOGIN') {
      state.currentState = 'IN';
      state.lastLoginTime = Date.now();
      await state.save();

      await ActivityEvent.create({ student: studentId, session: sessionId, eventType: 'LOGIN' });

      // Create legacy attendance if first time for reports
      const existingLegacy = await Attendance.findOne({ student: studentId, session: sessionId });
      if (!existingLegacy) {
        await Attendance.create({
          student: studentId,
          session: sessionId,
          date: todayStr,
          status: 'Present',
          detectedTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }),
          markedBy: req.user._id
        });
      }

      io.emit('activity_logged', { type: 'LOGIN', studentId });
      // Legacy emit for dashboard
      const studentData = await Student.findById(studentId);
      io.emit('attendance_logged', {
        student: studentData,
        session: sessionId,
        time: new Date().toLocaleTimeString()
      });

      return res.status(200).json({ success: true, message: 'Login confirmed' });
    } 
    else if (action === 'LOGOUT') {
      state.currentState = 'OUT';
      
      const logoutTime = Date.now();
      const loginTime = state.lastLoginTime ? new Date(state.lastLoginTime).getTime() : logoutTime;
      const duration = (logoutTime - loginTime) / 60000;
      
      state.lastLogoutTime = logoutTime;
      state.totalDurationMinutes += duration;
      await state.save();

      await ActivityEvent.create({ student: studentId, session: sessionId, eventType: 'LOGOUT' });

      io.emit('activity_logged', { type: 'LOGOUT', studentId });

      return res.status(200).json({ success: true, message: 'Logout confirmed' });
    }
    
    return res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (err) {
    console.error('[CONFIRM ACTIVITY ERROR]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
\;

content = content + confirmMethod;

fs.writeFileSync(file, content);
console.log('Patched attendanceController.js');
