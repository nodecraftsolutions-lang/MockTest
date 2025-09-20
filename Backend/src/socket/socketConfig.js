const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Attempt = require('../models/Attempt');

// Store active exam sessions
const activeExamSessions = new Map();

const socketConfig = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const student = await Student.findById(decoded.studentId);
      
      if (!student || !student.isActive || student.activeSessionId !== decoded.sessionId) {
        return next(new Error('Authentication error: Invalid session'));
      }

      socket.studentId = student._id.toString();
      socket.studentEmail = student.email;
      socket.sessionId = decoded.sessionId;
      
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Exam namespace for real-time exam features
  const examNamespace = io.of('/exam');
  
  examNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const student = await Student.findById(decoded.studentId);
      
      if (!student || !student.isActive || student.activeSessionId !== decoded.sessionId) {
        return next(new Error('Invalid session'));
      }

      socket.studentId = student._id.toString();
      socket.studentEmail = student.email;
      
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  examNamespace.on('connection', (socket) => {
    console.log(`Student ${socket.studentEmail} connected to exam namespace`);

    // Join exam attempt room
    socket.on('joinAttempt', async (data) => {
      try {
        const { attemptId } = data;
        
        // Verify attempt belongs to student
        const attempt = await Attempt.findOne({
          _id: attemptId,
          studentId: socket.studentId,
          status: 'in-progress'
        });

        if (!attempt) {
          socket.emit('error', { message: 'Invalid attempt or attempt not in progress' });
          return;
        }

        // Check if attempt is expired
        if (attempt.isExpired()) {
          await attempt.autoSubmitIfExpired();
          socket.emit('attemptExpired', { 
            message: 'Attempt has expired and been auto-submitted',
            attemptId: attempt._id
          });
          return;
        }

        const roomName = `attempt_${attemptId}`;
        socket.join(roomName);
        socket.currentAttemptId = attemptId;

        // Store session info
        activeExamSessions.set(socket.studentId, {
          socketId: socket.id,
          attemptId: attemptId,
          joinedAt: new Date(),
          lastActivity: new Date()
        });

        // Send current time and remaining time
        const now = new Date();
        const timeElapsed = Math.floor((now - attempt.startTime) / 1000); // in seconds
        const timeRemaining = Math.max(0, (attempt.duration * 60) - timeElapsed);

        socket.emit('attemptJoined', {
          attemptId: attempt._id,
          serverTime: now.toISOString(),
          timeRemaining: timeRemaining,
          timeElapsed: timeElapsed
        });

        // Set up auto-submit timer
        if (timeRemaining > 0) {
          setTimeout(async () => {
            try {
              const currentAttempt = await Attempt.findById(attemptId);
              if (currentAttempt && currentAttempt.status === 'in-progress') {
                await currentAttempt.autoSubmitIfExpired();
                socket.emit('autoSubmit', {
                  message: 'Time expired. Attempt auto-submitted.',
                  attemptId: attemptId
                });
                socket.leave(roomName);
              }
            } catch (error) {
              console.error('Auto-submit error:', error);
            }
          }, timeRemaining * 1000);
        }

      } catch (error) {
        console.error('Join attempt error:', error);
        socket.emit('error', { message: 'Failed to join attempt' });
      }
    });

    // Sync time with server
    socket.on('syncTime', async (data) => {
      try {
        const { attemptId } = data;
        
        if (socket.currentAttemptId !== attemptId) {
          socket.emit('error', { message: 'Invalid attempt ID' });
          return;
        }

        const attempt = await Attempt.findById(attemptId);
        if (!attempt || attempt.status !== 'in-progress') {
          socket.emit('error', { message: 'Attempt not found or not in progress' });
          return;
        }

        const now = new Date();
        const timeElapsed = Math.floor((now - attempt.startTime) / 1000);
        const timeRemaining = Math.max(0, (attempt.duration * 60) - timeElapsed);

        socket.emit('timeSync', {
          serverTime: now.toISOString(),
          timeRemaining: timeRemaining,
          timeElapsed: timeElapsed
        });

        // Update last activity
        const session = activeExamSessions.get(socket.studentId);
        if (session) {
          session.lastActivity = now;
        }

      } catch (error) {
        console.error('Time sync error:', error);
        socket.emit('error', { message: 'Failed to sync time' });
      }
    });

    // Save answer in real-time
    socket.on('saveAnswer', async (data) => {
      try {
        const { attemptId, questionId, selectedOptions, isMarkedForReview, section } = data;
        
        if (socket.currentAttemptId !== attemptId) {
          socket.emit('error', { message: 'Invalid attempt ID' });
          return;
        }

        const attempt = await Attempt.findById(attemptId);
        if (!attempt || attempt.status !== 'in-progress') {
          socket.emit('error', { message: 'Attempt not found or not in progress' });
          return;
        }

        // Check if attempt is expired
        if (attempt.isExpired()) {
          await attempt.autoSubmitIfExpired();
          socket.emit('attemptExpired', { 
            message: 'Attempt has expired',
            attemptId: attemptId
          });
          return;
        }

        // Find existing answer or create new one
        let answerIndex = attempt.answers.findIndex(
          answer => answer.questionId.toString() === questionId
        );

        const answerData = {
          questionId: questionId,
          selectedOptions: selectedOptions || [],
          isMarkedForReview: isMarkedForReview || false,
          section: section,
          timeSpent: 0 // This would be calculated based on time tracking
        };

        if (answerIndex >= 0) {
          // Update existing answer
          attempt.answers[answerIndex] = { ...attempt.answers[answerIndex], ...answerData };
        } else {
          // Add new answer
          attempt.answers.push(answerData);
        }

        await attempt.save();

        socket.emit('answerSaved', {
          questionId: questionId,
          success: true,
          timestamp: new Date().toISOString()
        });

        // Update last activity
        const session = activeExamSessions.get(socket.studentId);
        if (session) {
          session.lastActivity = new Date();
        }

      } catch (error) {
        console.error('Save answer error:', error);
        socket.emit('error', { message: 'Failed to save answer' });
      }
    });

    // Handle exam violations
    socket.on('examViolation', async (data) => {
      try {
        const { attemptId, violationType, details } = data;
        
        if (socket.currentAttemptId !== attemptId) {
          return;
        }

        const attempt = await Attempt.findById(attemptId);
        if (!attempt || attempt.status !== 'in-progress') {
          return;
        }

        // Add violation to attempt
        attempt.violations.push({
          type: violationType,
          timestamp: new Date(),
          details: details || ''
        });

        await attempt.save();

        // Emit warning to student
        socket.emit('violationWarning', {
          type: violationType,
          message: getViolationMessage(violationType),
          violationCount: attempt.violations.length
        });

        // If too many violations, auto-submit
        if (attempt.violations.length >= 5) {
          attempt.status = 'auto-submitted';
          attempt.endTime = new Date();
          attempt.submittedAt = new Date();
          attempt.isValid = false;
          attempt.notes = 'Auto-submitted due to multiple violations';
          await attempt.save();

          socket.emit('forceSubmit', {
            message: 'Attempt submitted due to multiple violations',
            attemptId: attemptId
          });
        }

      } catch (error) {
        console.error('Exam violation error:', error);
      }
    });

    // Handle manual submit
    socket.on('submitAttempt', async (data) => {
      try {
        const { attemptId } = data;
        
        if (socket.currentAttemptId !== attemptId) {
          socket.emit('error', { message: 'Invalid attempt ID' });
          return;
        }

        const attempt = await Attempt.findById(attemptId);
        if (!attempt || attempt.status !== 'in-progress') {
          socket.emit('error', { message: 'Attempt not found or not in progress' });
          return;
        }

        // Submit the attempt
        attempt.status = 'submitted';
        attempt.endTime = new Date();
        attempt.submittedAt = new Date();
        await attempt.save();

        // Calculate rank and percentile
        await attempt.calculateRankAndPercentile();

        socket.emit('attemptSubmitted', {
          attemptId: attemptId,
          message: 'Attempt submitted successfully',
          submittedAt: attempt.submittedAt
        });

        // Leave the attempt room
        socket.leave(`attempt_${attemptId}`);
        socket.currentAttemptId = null;

        // Remove from active sessions
        activeExamSessions.delete(socket.studentId);

      } catch (error) {
        console.error('Submit attempt error:', error);
        socket.emit('error', { message: 'Failed to submit attempt' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`Student ${socket.studentEmail} disconnected: ${reason}`);
      
      // Remove from active sessions
      activeExamSessions.delete(socket.studentId);
      
      // If student was in an exam, mark the disconnection
      if (socket.currentAttemptId) {
        Attempt.findById(socket.currentAttemptId)
          .then(attempt => {
            if (attempt && attempt.status === 'in-progress') {
              attempt.violations.push({
                type: 'disconnect',
                timestamp: new Date(),
                details: `Disconnected: ${reason}`
              });
              return attempt.save();
            }
          })
          .catch(error => console.error('Disconnect handling error:', error));
      }
    });

    // Heartbeat to detect connection issues
    socket.on('heartbeat', () => {
      const session = activeExamSessions.get(socket.studentId);
      if (session) {
        session.lastActivity = new Date();
      }
      socket.emit('heartbeat_ack');
    });
  });

  // Regular namespace for general features
  io.on('connection', (socket) => {
    console.log(`Student ${socket.studentEmail} connected`);

    // Join student's personal room for notifications
    socket.join(`student_${socket.studentId}`);

    socket.on('disconnect', () => {
      console.log(`Student ${socket.studentEmail} disconnected`);
    });
  });

  // Cleanup inactive sessions every 5 minutes
  setInterval(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    for (const [studentId, session] of activeExamSessions.entries()) {
      if (session.lastActivity < fiveMinutesAgo) {
        console.log(`Cleaning up inactive session for student ${studentId}`);
        activeExamSessions.delete(studentId);
      }
    }
  }, 5 * 60 * 1000);
};

// Helper function to get violation messages
function getViolationMessage(violationType) {
  const messages = {
    'tab-switch': 'Warning: Switching tabs during exam is not allowed.',
    'window-blur': 'Warning: Please keep the exam window in focus.',
    'copy-paste': 'Warning: Copy-paste operations are not allowed.',
    'right-click': 'Warning: Right-click is disabled during exam.',
    'developer-tools': 'Warning: Developer tools are not allowed during exam.',
    'disconnect': 'Warning: Connection lost during exam.'
  };
  
  return messages[violationType] || 'Warning: Suspicious activity detected.';
}

module.exports = socketConfig;