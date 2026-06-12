const mongoose = require('mongoose');

// Direct replica set URI to bypass Windows querySrv DNS resolution errors
const mongoURI = "mongodb://varshini2419_db_user:varshi123@ac-yje3tca-shard-00-00.yje3tca.mongodb.net:27017,ac-yje3tca-shard-00-01.yje3tca.mongodb.net:27017,ac-yje3tca-shard-00-02.yje3tca.mongodb.net:27017/ai_attendance_system?ssl=true&replicaSet=atlas-hctv2h-shard-0&authSource=admin&retryWrites=true&w=majority";

async function run() {
  try {
    console.log('Connecting to your Cloud MongoDB Atlas Cluster...');
    
    // Connect directly using production configurations
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5 seconds instead of freezing
    });
    
    console.log('✨ Connected successfully to cloud infrastructure.\n');
    
    // Target the main users collection
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    
    console.log('==================================================');
    console.log(`📋 CURRENT ACCOUNTS FOUND IN DATABASE (${users.length}):`);
    console.log('==================================================\n');
    
    if (users.length === 0) {
      console.log('ℹ️ Your cloud collection is connected, but it contains 0 accounts.');
      console.log('👉 Head to the frontend UI dashboard and click "Seed default accounts" to populate records!');
    } else {
      // Print clean, formatted records
      const cleanOutput = users.map(user => ({
        id: user._id,
        name: user.name || 'N/A',
        email: user.email,
        role: user.role,
        passwordHash: user.password ? `${user.password.substring(0, 10)}... [SECURED]` : 'N/A'
      }));
      
      console.log(JSON.stringify(cleanOutput, null, 2));
    }
    
  } catch (err) {
    console.log('\n❌ DATABASE CONNECTION FAILED');
    console.log('--------------------------------------------------');
    if (err.code === 'ENOTFOUND' || err.message.includes('querySrv')) {
      console.error('Network Error: Your terminal cannot resolve the internet address.');
      console.error('Please check your active Wi-Fi connection or local DNS servers.');
    } else {
      console.error('Details:', err.message);
    }
    console.log('--------------------------------------------------\n');
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

run();