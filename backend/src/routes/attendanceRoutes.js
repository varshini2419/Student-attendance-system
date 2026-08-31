const express = require('express');
const router = express.Router();
const {
  markAttendance,
  markAttendanceByFace,
  recognizeFace,
  getAttendanceLogs,
  getDashboardStats,
  startSession,
  stopSession,
  getSessionReport,
  downloadSessionExcel,
  clearActiveSession,
  confirmActivity,
  getAllSessions,
  getSessionLiveTracking
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

// All attendance operations require faculty or admin roles
router.use(protect);
router.use(authorize('admin', 'faculty'));

router.post('/manual', markAttendance);
router.post('/mark-face', markAttendanceByFace);
router.post('/recognize', recognizeFace);
router.post('/activity-confirm', confirmActivity);
router.get('/logs', getAttendanceLogs);
router.get('/dashboard', getDashboardStats);

// Session endpoints
router.post('/session/start', startSession);
router.post('/session/stop', stopSession);
router.get('/session/:id/report', getSessionReport);
router.get('/session/:id/excel', downloadSessionExcel);
router.delete('/session/active', clearActiveSession);
router.get('/sessions', getAllSessions);
router.get('/session/:id/live', getSessionLiveTracking);

module.exports = router;
