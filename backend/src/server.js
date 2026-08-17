const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const connectDB = async () => {
  const conn = require('./config/db');
  await conn();
  
  // Seed default admin/faculty accounts automatically
  const seedDatabase = require('./utils/seeder');
  await seedDatabase();
};

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes = require('./routes/reportRoutes');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();

// Connect to database
connectDB();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://student-attendance-system-eight-tau.vercel.app',
  'https://student-attendance-system-frontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS BLOCKED] Origin ${origin} not allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Increase body parser limit to handle large arrays of base64 images during face registration
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);

// Serve static reports and screenshots
app.use('/reports', express.static(path.join(__dirname, '../public/reports')));
app.use('/screenshots', express.static(path.join(__dirname, '../public/screenshots')));

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Student Attendance System API is running'
  });
});

// Health check endpoint
const mongoose = require('mongoose');
const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    dbConnected: mongoose.connection.readyState === 1
  });
};
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend server running in production mode on port ${PORT}`);
});
