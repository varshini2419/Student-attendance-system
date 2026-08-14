const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testCreateWithYearCategory() {
  try {
    // Login
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'internships2026CSD-CSIT@gmail.com',
      password: 'internships2026'
    });

    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('=== TEST: Creating student WITH year and category ===\n');

    const timestamp = Date.now();
    const newStudent = {
      name: 'Final Test Student',
      rollNumber: `FINAL_${timestamp}`,
      branch: 'CSD',
      section: 'A',
      email: `finaltest${timestamp}@test.com`,
      year: 'Second Year',
      category: 'Ideal Lab'
    };

    console.log('Request payload:');
    console.log(JSON.stringify(newStudent, null, 2));

    const res = await axios.post(`${API_URL}/students`, newStudent, { headers });

    console.log('\nResponse from server:');
    console.log(JSON.stringify(res.data.data, null, 2));

    console.log('\n=== VERIFICATION ===');
    console.log(`Year saved: ${res.data.data.year} (Expected: "Second Year")`);
    console.log(`Category saved: ${res.data.data.category} (Expected: "Ideal Lab")`);

    if (res.data.data.year === 'Second Year' && res.data.data.category === 'Ideal Lab') {
      console.log('\n✅ SUCCESS: Year and Category are being saved correctly!');
    } else {
      console.log('\n❌ FAILURE: Year and/or Category are NOT being saved!');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data?.message || error.message);
  }
}

testCreateWithYearCategory();
