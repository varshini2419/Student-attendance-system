const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://varshini2419_db_user:varshi123@cluster0.yje3tca.mongodb.net/?appName=Cluster0').then(async () => {
  const Attendance = mongoose.model('Attendance', new mongoose.Schema({
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession' },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    status: String,
    detectedTime: String,
    screenshotUrl: String
  }, { strict: false, collection: 'attendances' }));
  
  const AttendanceSession = mongoose.model('AttendanceSession', new mongoose.Schema({
    sessionId: String
  }, { strict: false, collection: 'attendancesessions' }));
  
  const session = await AttendanceSession.findOne({ sessionId: 'SESSION_20260817_4' });
  if (!session) return console.log('Session not found');
  
  const records = await Attendance.find({ session: session._id });
  console.log(JSON.stringify(records, null, 2));
  process.exit(0);
}).catch(console.error);
