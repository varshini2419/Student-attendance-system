const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndex() {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    await mongoose.connection.collection('attendances').dropIndex('student_1_session_1');
    print("Dropped unique index successfully.");
  } catch (err) {
    console.log("Index might not exist or another error:", err.message);
  }
  process.exit();
}

dropIndex();
