const fs = require('fs');

let c = fs.readFileSync('backend/src/controllers/attendanceController.js', 'utf8');

const recognizeReplacement = \
    let student = bestMatch._id;

    // Phase 2: ActivityState Check
    const ActivityState = require('../models/ActivityState');
    let state = await ActivityState.findOne({ student, session: session._id });
    
    if (!state) {
      return res.status(200).json({
        success: true,
        matched: true,
        name: bestMatch.name,
        studentId: student,
        confidence: Number(highestConfidence.toFixed(4)),
        action: 'LOGIN_AVAILABLE',
        message: 'Ready for login'
      });
    }

    if (state.currentState === 'IN') {
      const minsSinceLogin = (Date.now() - new Date(state.lastLoginTime).getTime()) / 60000;
      if (minsSinceLogin < 30) {
        return res.status(200).json({
          success: true,
          matched: true,
          name: bestMatch.name,
          studentId: student,
          confidence: Number(highestConfidence.toFixed(4)),
          action: 'IGNORE',
          message: 'Inside 30 min window'
        });
      } else {
        return res.status(200).json({
          success: true,
          matched: true,
          name: bestMatch.name,
          studentId: student,
          confidence: Number(highestConfidence.toFixed(4)),
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
        confidence: Number(highestConfidence.toFixed(4)),
        action: 'LOGIN_AVAILABLE',
        message: 'Ready for login'
      });
    }
\;

c = c.replace(/\\/\\/ Check if attendance already marked for this session[\\s\\S]*?Attendance marked successfully'/g, recognizeReplacement.trim());

const newEndpoints = \
exports.confirmActivity = async (req, res) => {
  try {
    const { studentId, sessionId, action } = req.body;
    const AttendanceSession = require('../models/AttendanceSession');
    const session = await AttendanceSession.findById(sessionId);
    if (!session || session.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Invalid session' });
    }

    const ActivityState = require('../models/ActivityState');
    const ActivityEvent = require('../models/ActivityEvent');
    const Attendance = require('../models/Attendance');
    const Student = require('../models/Student');

    let state = await ActivityState.findOne({ student: studentId, session: sessionId });
    
    if (action === 'LOGIN') {
      if (!state) {
        state = new ActivityState({ student: studentId, session: sessionId, totalDurationMinutes: 0 });
        const existingLegacy = await Attendance.findOne({ student: studentId, session: sessionId });
        if (!existingLegacy) {
          await Attendance.create({
            student: studentId,
            session: sessionId,
            status: 'Present',
            detectedTime: new Date()
          });
        }
      }
      state.currentState = 'IN';
      state.lastLoginTime = Date.now();
      await state.save();
      await ActivityEvent.create({ student: studentId, session: sessionId, eventType: 'LOGIN' });

      req.app.get('io').emit('activity_logged', { type: 'LOGIN', studentId, sessionId });
      
      const studentData = await Student.findById(studentId);
      req.app.get('io').emit('attendance_logged', {
        student: studentData,
        session: sessionId,
        time: new Date().toLocaleTimeString()
      });

      return res.status(200).json({ success: true, message: 'Login confirmed' });
    } else if (action === 'LOGOUT') {
      state.currentState = 'OUT';
      const logoutTime = Date.now();
      const loginTime = state.lastLoginTime ? new Date(state.lastLoginTime).getTime() : logoutTime;
      state.totalDurationMinutes += (logoutTime - loginTime) / 60000;
      state.lastLogoutTime = logoutTime;
      await state.save();
      
      await ActivityEvent.create({ student: studentId, session: sessionId, eventType: 'LOGOUT' });
      req.app.get('io').emit('activity_logged', { type: 'LOGOUT', studentId, sessionId });
      return res.status(200).json({ success: true, message: 'Logout confirmed' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllSessions = async (req, res) => {
  try {
    const AttendanceSession = require('../models/AttendanceSession');
    const sessions = await AttendanceSession.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSessionLiveTracking = async (req, res) => {
  try {
    const ActivityState = require('../models/ActivityState');
    const ActivityEvent = require('../models/ActivityEvent');
    
    const states = await ActivityState.find({ session: req.params.id }).populate('student', 'name rollNumber branch section');
    const events = await ActivityEvent.find({ session: req.params.id }).sort({ timestamp: 1 });
    
    const studentEvents = {};
    events.forEach(e => {
      const sId = e.student.toString();
      if (!studentEvents[sId]) studentEvents[sId] = [];
      studentEvents[sId].push(e);
    });

    const data = states.map(state => {
      const sId = state.student._id.toString();
      return {
        student: state.student,
        currentState: state.currentState,
        lastLoginTime: state.lastLoginTime,
        lastLogoutTime: state.lastLogoutTime,
        totalDurationMinutes: state.totalDurationMinutes,
        events: studentEvents[sId] || []
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
\;

c += '\\n' + newEndpoints;

const newExcelFunc = \
exports.downloadSessionExcel = async (req, res) => {
  try {
    const AttendanceSession = require('../models/AttendanceSession');
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const ActivityState = require('../models/ActivityState');
    const ActivityEvent = require('../models/ActivityEvent');
    
    const states = await ActivityState.find({ session: session._id }).populate('student');
    const events = await ActivityEvent.find({ session: session._id }).sort({ timestamp: 1 });

    const studentEvents = {};
    events.forEach(e => {
      const sId = e.student.toString();
      if (!studentEvents[sId]) studentEvents[sId] = [];
      studentEvents[sId].push(e);
    });

    let maxIntervals = 0;
    const reportData = states.map(state => {
      const studentId = state.student._id.toString();
      const evs = studentEvents[studentId] || [];
      
      const pairs = [];
      let currentPair = {};
      let loginCount = 0;
      let logoutCount = 0;

      evs.forEach(ev => {
        if (ev.eventType === 'LOGIN') {
          if (currentPair.login) {
            pairs.push(currentPair);
            currentPair = {};
          }
          currentPair.login = ev;
          loginCount++;
        } else if (ev.eventType === 'LOGOUT') {
          currentPair.logout = ev;
          pairs.push(currentPair);
          logoutCount++;
          currentPair = {};
        }
      });
      if (currentPair.login) pairs.push(currentPair);

      if (pairs.length > maxIntervals) maxIntervals = pairs.length;

      return {
        student: state.student,
        totalLogins: loginCount,
        totalLogouts: logoutCount,
        totalDuration: Math.round(state.totalDurationMinutes || 0),
        pairs
      };
    });

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    const columns = [
      { header: 'Roll No', key: 'rollNo', width: 18 },
      { header: 'Student Name', key: 'studentName', width: 25 },
      { header: 'Branch', key: 'branch', width: 15 },
      { header: 'Year', key: 'year', width: 15 },
      { header: 'Session ID', key: 'sessionId', width: 25 },
      { header: 'Session Name', key: 'sessionName', width: 25 },
      { header: 'Total Logins', key: 'totalLogins', width: 15 },
      { header: 'Total Logouts', key: 'totalLogouts', width: 15 },
      { header: 'Total Duration (Mins)', key: 'totalDuration', width: 22 }
    ];

    for (let i = 1; i <= maxIntervals; i++) {
      columns.push({ header: \\\Login \\\\\\, key: \\\login_\\\\\\, width: 20 });
      columns.push({ header: \\\Logout \\\\\\, key: \\\logout_\\\\\\, width: 20 });
    }

    worksheet.columns = columns;
    worksheet.getRow(1).font = { bold: true };

    const isActive = session.status === 'active';

    reportData.forEach(row => {
      const rowData = {
        rollNo: row.student.rollNumber,
        studentName: row.student.name,
        branch: row.student.branch,
        year: row.student.year,
        sessionId: session.sessionId,
        sessionName: session.sessionName,
        totalLogins: row.totalLogins,
        totalLogouts: row.totalLogouts,
        totalDuration: row.totalDuration
      };

      row.pairs.forEach((p, idx) => {
        const i = idx + 1;
        rowData[\\\login_\\\\\\] = p.login ? new Date(p.login.timestamp).toLocaleTimeString() : '';
        rowData[\\\logout_\\\\\\] = p.logout 
          ? new Date(p.logout.timestamp).toLocaleTimeString() 
          : (isActive ? 'Not Yet' : "Didn't Do Logout");
      });

      worksheet.addRow(rowData);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', \\\ttachment; filename=\\\_Report.xlsx\\\);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
\;

c = c.replace(/exports\\.downloadSessionExcel =\\s+async \\(req, res\\) => \\{[\\s\\S]*?res\\.end\\(\\);\\n\\s+\\} catch \\(error\\) \\{\\n\\s+res\\.status\\(500\\)\\.json\\(\\{\\n\\s+success: false,\\n\\s+message: error\\.message\\n\\s+\\}\\);\\n\\s+\\}\\n\\s+\\};/, newExcelFunc);
fs.writeFileSync('backend/src/controllers/attendanceController.js', c);
