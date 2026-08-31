import re
import os

filepath = r"c:\Users\pc\New folder\New folder\reasume-enhancer\AI Student Attendance System\backend\src\controllers\attendanceController.js"

with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update confirmActivity
confirm_activity_new = """exports.confirmActivity = async (req, res) => {
  try {
    const { studentId, sessionId, action, image } = req.body;
    const AttendanceSession = require('../models/AttendanceSession');
    const session = await AttendanceSession.findById(sessionId);
    if (!session || session.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Invalid session' });
    }

    const ActivityState = require('../models/ActivityState');
    const ActivityEvent = require('../models/ActivityEvent');
    const Attendance = require('../models/Attendance');
    const Student = require('../models/Student');
    const fs = require('fs');
    const path = require('path');

    let state = await ActivityState.findOne({ student: studentId, session: sessionId });
    
    // Process image if provided
    let screenshotUrl = null;
    if (image) {
      try {
        const base64Data = image.replace(/^data:image\\/\\w+;base64,/, '');
        const filename = `${studentId}_${Date.now()}.jpg`;
        const filepath = path.join(__dirname, '../../public/screenshots', filename);
        if (!fs.existsSync(path.dirname(filepath))) {
            fs.mkdirSync(path.dirname(filepath), { recursive: true });
        }
        await fs.promises.writeFile(filepath, base64Data, 'base64');
        screenshotUrl = `/screenshots/${filename}`;
      } catch (err) {
        console.error("Screenshot save failed", err);
      }
    }

    if (action === 'LOGIN') {
      // Check if there is already an open cycle
      const openCycle = await Attendance.findOne({ student: studentId, session: sessionId, cycleStatus: 'OPEN' });
      if (openCycle) {
        return res.status(400).json({ success: false, message: 'Student already has an open cycle in this session' });
      }

      if (!state) {
        state = new ActivityState({ student: studentId, session: sessionId, totalDurationMinutes: 0 });
      }
      
      const loginTime = Date.now();
      state.currentState = 'IN';
      state.lastLoginTime = loginTime;
      await state.save();
      
      // Create new Attendance cycle
      await Attendance.create({
        student: studentId,
        session: sessionId,
        date: new Date(loginTime).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
        loginTime: loginTime,
        loginScreenshot: screenshotUrl,
        cycleStatus: 'OPEN'
      });

      await ActivityEvent.create({ student: studentId, session: sessionId, eventType: 'LOGIN', screenshotUrl });

      req.app.get('io').emit('activity_logged', { type: 'LOGIN', studentId, sessionId });
      
      const studentData = await Student.findById(studentId);
      req.app.get('io').emit('attendance_logged', {
        student: studentData,
        session: sessionId,
        time: new Date().toLocaleTimeString()
      });

      return res.status(200).json({ success: true, message: 'Login confirmed' });
    } else if (action === 'LOGOUT') {
      const openCycle = await Attendance.findOne({ student: studentId, session: sessionId, cycleStatus: 'OPEN' });
      if (!openCycle) {
        return res.status(400).json({ success: false, message: 'No open cycle found to logout from' });
      }

      const logoutTime = Date.now();
      const duration = (logoutTime - new Date(openCycle.loginTime).getTime()) / 60000;
      
      openCycle.logoutTime = logoutTime;
      openCycle.logoutScreenshot = screenshotUrl;
      openCycle.durationMinutes = duration;
      openCycle.cycleStatus = 'COMPLETED';
      await openCycle.save();

      state.currentState = 'OUT';
      state.totalDurationMinutes += duration;
      state.lastLogoutTime = logoutTime;
      await state.save();
      
      await ActivityEvent.create({ student: studentId, session: sessionId, eventType: 'LOGOUT', screenshotUrl });
      req.app.get('io').emit('activity_logged', { type: 'LOGOUT', studentId, sessionId });
      return res.status(200).json({ success: true, message: 'Logout confirmed' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};"""

# 2. Update getSessionLiveTracking
get_live_tracking_new = """exports.getSessionLiveTracking = async (req, res) => {
  try {
    const Attendance = require('../models/Attendance');
    const ActivityState = require('../models/ActivityState');
    
    const states = await ActivityState.find({ session: req.params.id }).populate('student', 'name rollNumber branch section');
    const cycles = await Attendance.find({ session: req.params.id }).sort({ loginTime: 1 });
    
    const studentCycles = {};
    cycles.forEach(c => {
      const sId = c.student.toString();
      if (!studentCycles[sId]) studentCycles[sId] = [];
      studentCycles[sId].push(c);
    });

    const data = states.map(state => {
      const sId = state.student._id.toString();
      return {
        student: state.student,
        currentState: state.currentState,
        lastLoginTime: state.lastLoginTime,
        lastLogoutTime: state.lastLogoutTime,
        totalDurationMinutes: state.totalDurationMinutes,
        cycles: studentCycles[sId] || []
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};"""

# 3. Update exportSessionReport
export_session_report_new = """exports.exportSessionReport = async (req, res) => {
  try {
    const AttendanceSession = require('../models/AttendanceSession');
    const ActivityState = require('../models/ActivityState');
    const Attendance = require('../models/Attendance');
    
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const states = await ActivityState.find({ session: req.params.id }).populate('student', 'name rollNumber branch category year');
    const cycles = await Attendance.find({ session: req.params.id }).sort({ loginTime: 1 });

    const studentCycles = {};
    let maxCycles = 1;
    cycles.forEach(c => {
      const sId = c.student.toString();
      if (!studentCycles[sId]) studentCycles[sId] = [];
      studentCycles[sId].push(c);
      if (studentCycles[sId].length > maxCycles) maxCycles = studentCycles[sId].length;
    });

    const reportData = states.map(state => {
      const sId = state.student._id.toString();
      const sCycles = studentCycles[sId] || [];
      return {
        student: state.student,
        totalLogins: sCycles.length,
        totalLogouts: sCycles.filter(c => c.cycleStatus === 'COMPLETED').length,
        totalDuration: Math.round(state.totalDurationMinutes || 0),
        cycles: sCycles
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
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Session ID', key: 'sessionId', width: 25 },
      { header: 'Session Name', key: 'sessionName', width: 25 },
      { header: 'Total Logins', key: 'totalLogins', width: 15 },
      { header: 'Total Logouts', key: 'totalLogouts', width: 15 },
      { header: 'Total Duration (Mins)', key: 'totalDuration', width: 22 }
    ];

    for (let i = 1; i <= maxCycles; i++) {
      columns.push({ header: 'Login ' + i, key: 'login_' + i, width: 20 });
      columns.push({ header: 'Logout ' + i, key: 'logout_' + i, width: 20 });
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
        category: row.student.category,
        sessionId: session.sessionId,
        sessionName: session.sessionName,
        totalLogins: row.totalLogins,
        totalLogouts: row.totalLogouts,
        totalDuration: row.totalDuration
      };

      row.cycles.forEach((c, idx) => {
        const i = idx + 1;
        rowData['login_' + i] = new Date(c.loginTime).toLocaleTimeString();
        rowData['logout_' + i] = c.cycleStatus === 'COMPLETED' 
          ? new Date(c.logoutTime).toLocaleTimeString() 
          : (isActive ? 'Not Yet Logged Out' : "Not Yet Logged Out");
      });

      worksheet.addRow(rowData);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + session.sessionId + '_Report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};"""


code = re.sub(r'exports\.confirmActivity\s*=\s*async\s*\(req,\s*res\)\s*=>\s*\{.*?(?=\nexports\.\w+\s*=\s*async|\Z)', lambda m: confirm_activity_new + '\n\n', code, flags=re.DOTALL)
code = re.sub(r'exports\.getSessionLiveTracking\s*=\s*async\s*\(req,\s*res\)\s*=>\s*\{.*?(?=\nexports\.\w+\s*=\s*async|\Z)', lambda m: get_live_tracking_new + '\n\n', code, flags=re.DOTALL)
code = re.sub(r'exports\.exportSessionReport\s*=\s*async\s*\(req,\s*res\)\s*=>\s*\{.*?(?=\nexports\.\w+\s*=\s*async|\Z)', lambda m: export_session_report_new + '\n\n', code, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(code)

print("Patch applied to attendanceController.js!")
