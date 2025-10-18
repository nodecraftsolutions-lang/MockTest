const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const companyRoutes = require('./routes/company');
const testRoutes = require('./routes/test');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const courseRoutes = require('./routes/course');
const questionBankRoutes = require('./routes/questionBank');
const recordingRoutes=require("./routes/recordings");

const socketConfig = require('./socket/socketConfig');

const app = express();
const server = createServer(app);

// ✅ Initialize socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ✅ Allow all origins for easier deployment
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: false
}));

app.options("*", cors());

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));



// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// ✅ Pass io to socket config
socketConfig(io);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/tests', testRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/question-banks', questionBankRoutes);
app.use('/api/v1/enrollments', require('./routes/enrollment'));
app.use('/api/v1/recordings',recordingRoutes);


// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };
