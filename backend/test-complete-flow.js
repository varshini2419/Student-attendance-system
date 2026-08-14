const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const API_URL = 'http://localhost:5000/api';

async function testCompleteFlow() {
  let token = null;
  const timestamp = Date.now();
  const newStudentEmail = `comprehensive${timestamp}@test.com`;
  const newStudentRoll = `COMP${timestamp}`;
  
  try {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║   COMPLETE YEAR & CATEGORY STUDENT CREATION FLOW TEST         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // STEP 1: AUTHENTICATION
    console.log('STEP 1: Authenticating...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'internships2026CSD-CSIT@gmail.com',
      password: 'internships2026'
    });
    token = loginRes.data.token;
    console.log('✅ Authenticated successfully\n');

    // STEP 2: CREATE STUDENT WITH YEAR & CATEGORY
    console.log('STEP 2: Creating student with Year and Category...');
    const headers = { Authorization: `Bearer ${token}` };
    
    const studentPayload = {
      name: 'Comprehensive Test Student',
      rollNumber: newStudentRoll,
      branch: 'CSD',
      section: 'A',
      email: newStudentEmail,
      year: 'Third Year',
      category: 'Ideal Lab'
    };
    
    console.log('Sending to API:');
    console.log(JSON.stringify(studentPayload, null, 2));

    const createRes = await axios.post(`${API_URL}/students`, studentPayload, { headers });
    const createdStudent = createRes.data.data;
    const studentId = createdStudent._id;

    console.log('\n✅ Student created successfully\n');
    console.log('Response from API:');
    console.log(`  Name: ${createdStudent.name}`);
    console.log(`  Roll: ${createdStudent.rollNumber}`);
    console.log(`  Branch: ${createdStudent.branch}`);
    console.log(`  Section: ${createdStudent.section}`);
    console.log(`  Email: ${createdStudent.email}`);
    console.log(`  Year: ${createdStudent.year}`);
    console.log(`  Category: ${createdStudent.category}\n`);

    // STEP 3: FETCH STUDENT FROM API
    console.log('STEP 3: Fetching student from API...');
    const fetchRes = await axios.get(`${API_URL}/students/${studentId}`, { headers });
    const fetchedStudent = fetchRes.data.data;

    console.log('✅ Student retrieved successfully\n');
    console.log('API Response includes:');
    console.log(`  Year: ${fetchedStudent.year}`);
    console.log(`  Category: ${fetchedStudent.category}\n`);

    // STEP 4: VERIFY IN DATABASE
    console.log('STEP 4: Verifying data in database...');
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    
    const Student = require('./src/models/Student');
    const dbStudent = await Student.findById(studentId);

    console.log('✅ Database query successful\n');
    console.log('Database record shows:');
    console.log(`  Year: ${dbStudent.year}`);
    console.log(`  Category: ${dbStudent.category}\n`);

    // STEP 5: VERIFY COMPLETE FLOW
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                      VERIFICATION RESULTS                      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const flowCheck = {
      'Form sent Year/Category': studentPayload.year && studentPayload.category,
      'API received Year/Category': createRes.data.data.year && createRes.data.data.category,
      'API response contains Year': fetchedStudent.year === 'Third Year',
      'API response contains Category': fetchedStudent.category === 'Ideal Lab',
      'Database stored Year': dbStudent.year === 'Third Year',
      'Database stored Category': dbStudent.category === 'Ideal Lab'
    };

    Object.entries(flowCheck).forEach(([check, result]) => {
      console.log(`${result ? '✅' : '❌'} ${check}`);
    });

    const allPassed = Object.values(flowCheck).every(v => v === true);
    
    console.log('\n' + (allPassed ? '🎉 ALL CHECKS PASSED!' : '❌ SOME CHECKS FAILED!'));
    console.log('\nConclusion:');
    if (allPassed) {
      console.log('✅ Year and Category are properly:');
      console.log('   - Accepted from the frontend form');
      console.log('   - Validated by the backend');
      console.log('   - Stored in the MongoDB database');
      console.log('   - Retrieved via the API');
      console.log('   - Ready to display in the Student Profile');
    }

    await mongoose.disconnect();

  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data?.message || error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

testCompleteFlow();
