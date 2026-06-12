const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_attendance_system';
    console.log(`Attempting to connect to MongoDB at: ${uri.split('@').pop()}`);
    
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    });
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB Atlas: ${error.message}`);
    console.log('Falling back to local MongoDB instance...');
    try {
      const fallbackUri = 'mongodb://127.0.0.1:27017/ai_attendance_system';
      const conn = await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`Local MongoDB Connected successfully: ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`Error connecting to local MongoDB: ${fallbackError.message}`);
      console.log('Please ensure your local MongoDB Server Windows Service is started.');
      // Do not exit process immediately; let it retry if needed or fail gracefully
      // process.exit(1); 
    }
  }

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected! Attempting to reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected successfully!');
  });
};

module.exports = connectDB;
