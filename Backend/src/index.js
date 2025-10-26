const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const companyRoutes = require('./routes/company');
const testRoutes = require('./routes/test');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const courseRoutes = require('./routes/course');
const questionBankRoutes = require('./routes/questionBank');
const recordingRoutes = require('./routes/recordings');
const enrollmentRoutes = require('./routes/enrollment');
const alumniRoutes = require('./routes/alumni');

const socketConfig = require('./socket/socketConfig');

const app = express();
const server = createServer(app);

// ✅ Configure CORS with specific origins for production
const corsOptions = {
  origin: [
    'http://localhost:5173',  // Local development
    'http://localhost:3000',  // Alternative local development
    'https://mock-test-ten.vercel.app',  // Your Vercel frontend
    'https://mocktest-bckx.onrender.com',  // Your Render backend (for internal requests)
    /\.vercel\.app$/,  // Any Vercel deployment
    /\.onrender\.com$/  // Any Render deployment
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};

// ✅ Apply CORS middleware
app.use(cors(corsOptions));

// ✅ Handle preflight OPTIONS requests
app.options('*', cors(corsOptions));

// ✅ Basic body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Server is running successfully'
  });
});

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Socket.io setup
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://mock-test-ten.vercel.app',
      /\.vercel\.app$/,
      /\.onrender\.com$/
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
});

socketConfig(io);

// ✅ API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/tests', testRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/question-banks', questionBankRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/recordings', recordingRoutes);
app.use('/api/v1/alumni', alumniRoutes);

// ✅ Simple 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, io };