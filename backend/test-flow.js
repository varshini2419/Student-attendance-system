const axios = require('axios');
const mongoose = require('mongoose');

const API_URL = 'http://localhost:5000/api';

async function runTest() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://varshini2419_db_user:varshi123@cluster0.yje3tca.mongodb.net/?appName=Cluster0');
    console.log('Connected to DB.');

    // 1. Get admin token
    console.log('Logging in as admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'internships2026CSD-CSIT@gmail.com',
      password: 'internships2026'
    });
    const token = loginRes.data.token;
    console.log('Admin token acquired.');

    // 2. Start a Session
    console.log('Starting attendance session...');
    const sessionRes = await axios.post(`${API_URL}/attendance/session/start`, {
      sessionName: 'Test Automation Session'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const sessionId = sessionRes.data.data._id;
    console.log('Session started:', sessionId);

    // 3. Find a random student (or create one) to simulate recognition
    let student = await mongoose.connection.collection('students').findOne({});
    if (!student) {
        throw new Error("No student found in DB to test");
    }
    console.log('Found test student:', student.name);

    // 4. Simulate hitting activity-confirm
    console.log('Hitting activity-confirm (LOGIN)...');
    const confirmRes = await axios.post(`${API_URL}/attendance/activity-confirm`, {
      studentId: student._id.toString(),
      sessionId: sessionId,
      action: 'LOGIN'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Confirm response status:', confirmRes.status);
    console.log('Confirm response data:', confirmRes.data);

    // 5. Verify it was saved in MongoDB
    const state = await mongoose.connection.collection('activitystates').findOne({ student: student._id, session: mongoose.Types.ObjectId.createFromHexString(sessionId) });
    const attendance = await mongoose.connection.collection('attendances').findOne({ student: student._id, session: mongoose.Types.ObjectId.createFromHexString(sessionId), cycleStatus: 'OPEN' });

    console.log('ActivityState saved:', !!state);
    console.log('Attendance cycle saved:', !!attendance);
    
    if (confirmRes.data.success && state && attendance) {
        console.log('TEST PASSED SUCCESSFULLY');
    } else {
        console.log('TEST FAILED');
    }
    
    process.exit(0);

  } catch (error) {
    console.error('TEST ERROR:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTest();
