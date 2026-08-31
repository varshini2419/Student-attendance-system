const fs = require('fs');

const newExcelFunc = \
exports.downloadSessionExcel = async (req, res) => {
  try {
    const AttendanceSession = require('../models/AttendanceSession');
    const ActivityState = require('../models/ActivityState');
    const ActivityEvent = require('../models/ActivityEvent');
    const Student = require('../models/Student');

    const session = await AttendanceSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

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

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      \\\ttachment; filename=\\\_Report.xlsx\\\
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
\;

let c = fs.readFileSync('backend/src/controllers/attendanceController.js', 'utf8');
c = c.replace(/exports\\.downloadSessionExcel =\\s+async \\(req, res\\) => \\{[\\s\\S]*?res\\.end\\(\\);\\n\\s+\\} catch \\(error\\) \\{\\n\\s+res\\.status\\(500\\)\\.json\\(\\{\\n\\s+success: false,\\n\\s+message: error\\.message\\n\\s+\\}\\);\\n\\s+\\}\\n\\s+\\};/, newExcelFunc);
fs.writeFileSync('backend/src/controllers/attendanceController.js', c);
console.log('Excel function replaced');
