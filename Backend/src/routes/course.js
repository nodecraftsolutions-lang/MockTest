const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, adminAuth } = require('../middlewares/auth');
const Course = require('../models/Course');
const Discussion = require('../models/Discussion');
const router = express.Router();

//ADMIN ROUTES
// 📌 Create a new course (Admin only)
router.post("/", adminAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      outcomes,
      features,
      price,
      currency,
      category,
      startDate,
      duration,
      level,
      isPaid,
      recordingsPrice,
      curriculum,   // ✅ NEW field for curriculum
      instructors   // ✅ NEW field for course-level instructors
    } = req.body;

    const course = new Course({
      title,
      description,
      outcomes,
      features,
      price,
      currency,
      category,
      startDate,
      duration,
      level,
      isPaid,
      recordingsPrice: recordingsPrice || 0,
      curriculum: curriculum || { phases: [] },
      instructors: instructors || [],
      createdBy: req.student.id,
    });

    await course.save();

    res.json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({ success: false, message: "Failed to create course" });
  }
});



/// 📌 Update course details
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      outcomes,
      features,
      price,
      currency,
      category,
      startDate,
      duration,
      level,
      isPaid,
      recordingsPrice,
      curriculum,   // ✅ NEW field for curriculum
      instructors   // ✅ NEW field for course-level instructors
    } = req.body;

    // Validation
    if (!title || !description) {
      return res.status(400).json({ 
        success: false, 
        message: "Title and description are required" 
      });
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        outcomes: outcomes || [""],
        features: features || [""],
        price: price || 0,
        currency: currency || "INR",
        category: category || "",
        startDate: startDate || null,
        duration: duration || "",
        level: level || "Beginner",
        isPaid: isPaid !== undefined ? isPaid : true,
        recordingsPrice: recordingsPrice || 0,
        curriculum: curriculum || { phases: [] },
        instructors: instructors || []
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({ success: false, message: "Failed to update course: " + error.message });
  }
});


// Delete course
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course deleted' });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete course' });
  }
});

// Add session to a course
router.post('/:id/sessions', adminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const session = {
      title: req.body.title,
      startsAt: req.body.startsAt,
      duration: req.body.duration,
      streamLink: req.body.streamLink,
      description: req.body.description
    };

    course.sessions.push(session);
    await course.save();

    res.json({ success: true, message: 'Session added', data: course.sessions });
  } catch (err) {
    console.error('Add session error:', err);
    res.status(500).json({ success: false, message: 'Failed to add session' });
  }
});

/**
 * ============================
 *   PUBLIC + STUDENT ROUTES
 * ============================
 */

// Get all courses (public)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select("title description price features outcomes currency isPaid category startDate duration curriculum instructors");

    res.json({ success: true, data: courses });
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
});

// Get all courses for admin management (Admin only)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select("title description price features outcomes currency isPaid category startDate duration curriculum instructors enrolledStudents recordingsPrice")
      .populate("enrolledStudents", "_id");

    // Add discussion count to each course
    const coursesWithDiscussionCount = await Promise.all(courses.map(async (course) => {
      const discussionCount = await Discussion.countDocuments({ courseId: course._id });
      return {
        ...course.toObject(),
        discussionCount
      };
    }));

    res.json({ success: true, data: coursesWithDiscussionCount });
  } catch (err) {
    console.error('Get admin courses error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
});

// Get single course
router.get("/:id", auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("createdBy", "name email")
      .lean();

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const isEnrolled = Array.isArray(course.enrolledStudents)
      ? course.enrolledStudents.some(
          (s) => s.toString() === req.student?.id.toString()
        )
      : false;

    res.json({
      success: true,
      data: { course, isEnrolled },
    });
  } catch (err) {
    console.error("Get course error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch course" });
  }
});


// Enroll student into course
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if course is paid
    if (course.isPaid && course.price > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'This is a paid course. Please proceed to payment to enroll.' 
      });
    }

    if (course.enrolledStudents.includes(req.student.id)) {
      return res.status(400).json({ success: false, message: 'Already enrolled' });
    }

    course.enrolledStudents.push(req.student.id);
    await course.save();

    // Create enrollment record
    const enrollment = new Enrollment({
      studentId: req.student.id,
      courseId: course._id,
      type: 'course',
      status: 'enrolled'
    });
    await enrollment.save();

    res.json({ 
      success: true, 
      message: 'Enrolled successfully',
      data: enrollment
    });
  } catch (err) {
    console.error("Enroll course error:", err);
    res.status(500).json({ success: false, message: 'Failed to enroll' });
  }
});

// Get sessions (student must be enrolled)
router.get("/:id/sessions", auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).select("sessions enrolledStudents");
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (!course.enrolledStudents.includes(req.student.id)) {
      return res.status(403).json({ success: false, message: "Not enrolled in this course" });
    }

    res.json({ success: true, data: course.sessions });
  } catch (err) {
    console.error("Get sessions error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch sessions" });
  }
});

// Get course discussions (must be enrolled)
router.get("/:id/discussions", auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).select("enrolledStudents");
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (!course.enrolledStudents.includes(req.student.id)) {
      return res.status(403).json({ success: false, message: "Not enrolled in this course" });
    }

    const messages = await Discussion.find({ courseId: req.params.id })
      .populate("studentId", "name email")
      .populate("replies.userId", "name email")
      .sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error("Get discussions error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch discussions" });
  }
});

// Post new message in discussion (must be enrolled)
router.post("/:id/discussions", auth, async (req, res) => {
  try {
    if (!req.body.message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const course = await Course.findById(req.params.id).select("enrolledStudents");
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (!course.enrolledStudents.includes(req.student.id)) {
      return res.status(403).json({ success: false, message: "Not enrolled in this course" });
    }

    const newMessage = new Discussion({
      courseId: req.params.id,
      studentId: req.student.id,
      message: req.body.message,
    });

    await newMessage.save();
    await newMessage.populate("studentId", "name email");

    res.status(201).json({ success: true, data: newMessage });
  } catch (err) {
    console.error("Post discussion error:", err);
    res.status(500).json({ success: false, message: "Failed to post message" });
  }
});

// ADMIN ROUTES FOR DISCUSSIONS
// Get all discussions for a course (Admin only)
router.get("/:id/discussions/admin", adminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const messages = await Discussion.find({ courseId: req.params.id })
      .populate("studentId", "name email")
      .populate("replies.userId", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error("Get admin discussions error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch discussions" });
  }
});

// Delete a discussion message (Admin only)
router.delete("/discussions/:discussionId", adminAuth, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.discussionId);
    if (!discussion) {
      return res.status(404).json({ success: false, message: "Discussion not found" });
    }

    await Discussion.findByIdAndDelete(req.params.discussionId);
    
    res.json({ success: true, message: "Discussion deleted successfully" });
  } catch (err) {
    console.error("Delete discussion error:", err);
    res.status(500).json({ success: false, message: "Failed to delete discussion" });
  }
});

// Add reply to a discussion (Admin only)
router.post("/discussions/:discussionId/reply", adminAuth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim() === "") {
      return res.status(400).json({ success: false, message: "Reply message is required" });
    }

    const discussion = await Discussion.findById(req.params.discussionId);
    if (!discussion) {
      return res.status(404).json({ success: false, message: "Discussion not found" });
    }

    // Add the reply
    discussion.replies.push({
      userId: req.student.id,
      userType: "Admin",
      message: message.trim()
    });

    await discussion.save();

    // Populate the reply user info
    await discussion.populate("replies.userId", "name email");
    
    res.json({ 
      success: true, 
      message: "Reply added successfully",
      data: discussion.replies[discussion.replies.length - 1]
    });
  } catch (err) {
    console.error("Add reply error:", err);
    res.status(500).json({ success: false, message: "Failed to add reply: " + err.message });
  }
});

// Delete a specific reply from a discussion (Admin only)
router.delete("/discussions/:discussionId/reply/:replyId", adminAuth, async (req, res) => {
  try {
    const { discussionId, replyId } = req.params;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ success: false, message: "Discussion not found" });
    }

    // Find the reply index
    const replyIndex = discussion.replies.findIndex(reply => reply._id.toString() === replyId);
    if (replyIndex === -1) {
      return res.status(404).json({ success: false, message: "Reply not found" });
    }

    // Remove the reply
    discussion.replies.splice(replyIndex, 1);
    await discussion.save();

    res.json({ 
      success: true, 
      message: "Reply deleted successfully"
    });
  } catch (err) {
    console.error("Delete reply error:", err);
    res.status(500).json({ success: false, message: "Failed to delete reply: " + err.message });
  }
});

// Get all discussions across all courses (Admin only)
router.get("/discussions/all", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, courseId } = req.query;
    
    const query = {};
    if (courseId) query.courseId = courseId;
    
    const messages = await Discussion.find(query)
      .populate("courseId", "title")
      .populate("studentId", "name email")
      .populate("replies.userId", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Discussion.countDocuments(query);

    res.json({ 
      success: true, 
      data: { 
        messages, 
        pagination: { 
          current: parseInt(page), 
          pages: Math.ceil(total / limit), 
          total 
        } 
      } 
    });
  } catch (err) {
    console.error("Get all discussions error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch discussions: " + err.message });
  }
});

// Add new recording to course
router.post("/:courseId/recordings", adminAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, videoUrl, duration } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const recording = { title, description, videoUrl, duration };
    course.recordings.push(recording);

    await course.save();

    res.json({ success: true, message: "Recording added", data: recording });
  } catch (err) {
    console.error("Add recording error:", err);
    res.status(500).json({ success: false, message: "Failed to add recording" });
  }
});

// Get all recordings of a course
router.get("/:courseId/recordings", auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).select("title recordings recordingsPrice");
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    // Check if student has unlocked
    const enrollment = await Enrollment.findOne({
      studentId: req.student.id,
      courseId,
      type: "recording",
      status: "unlocked"
    });

    if (!enrollment && course.recordingsPrice > 0) {
      return res.status(403).json({ success: false, message: "Unlock recordings to access" });
    }

    res.json({ success: true, data: course.recordings });
  } catch (err) {
    console.error("Get recordings error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch recordings" });
  }
});
// 📌 GET /api/v1/courses?withRecordings=true
// Fetch only courses that have recordings uploaded OR have recordingsPrice > 0
router.get("/", auth, async (req, res) => {
  try {
    const { withRecordings } = req.query;

    let query = { isActive: true };

    if (withRecordings === "true") {
      query.$or = [
        { recordingsPrice: { $gt: 0 } },
        { recordings: { $exists: true, $ne: [] } }
      ];
    }

    const courses = await Course.find(query)
      .select("title recordingsPrice recordings");

    res.json({
      success: true,
      data: {
        courses
      }
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch courses" });
  }
});

// POST /api/v1/courses/:id/recordings
router.post("/:id/recordings", adminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    course.recordings.push({ title: req.body.title, link: req.body.link });
    await course.save();

    res.json({ success: true, message: "Recording added", data: course.recordings });
  } catch (err) {
    console.error("Add recording error:", err);
    res.status(500).json({ success: false, message: "Failed to add recording" });
  }
});


// ✅ CREATE resource inside a course POST /api/v1/courses/:courseId/resources
router.post("/:courseId/resources", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, link } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.resourceCourse.push({ title, link });
    await course.save();

    res.status(201).json({
      message: "Resource added successfully",
      resources: course.resourceCourse,
    });
  } catch (err) {
    res.status(500).json({ message: "Error adding resource", error: err.message });
  }
});


// ✅ READ all resources of a course
router.get("/:courseId/resources", async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).select("resourceCourse");
    if (!course) return res.status(404).json({ message: "Course not found" });

    res.json(course.resourceCourse);
  } catch (err) {
    res.status(500).json({ message: "Error fetching resources", error: err.message });
  }
});


// ✅ UPDATE a specific resource in a course
router.put("/:courseId/resources/:resourceId", async (req, res) => {
  try {
    const { courseId, resourceId } = req.params;
    const { title, link } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const resource = course.resourceCourse.id(resourceId);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    if (title) resource.title = title;
    if (link) resource.link = link;

    await course.save();

    res.json({ message: "Resource updated successfully", resource });
  } catch (err) {
    res.status(500).json({ message: "Error updating resource", error: err.message });
  }
});

// ✅ DELETE a specific resource from a course
router.delete("/:courseId/resources/:resourceId", async (req, res) => {
  try {
    const { courseId, resourceId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const resource = course.resourceCourse.id(resourceId);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    resource.deleteOne();

    await course.save();

    res.json({ message: "Resource deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting resource", error: err.message });
  }
});




// ✅ CREATE resource inside a course POST /api/v1/courses/:courseId/resourcesrecord
router.post("/:courseId/resourcesrecord", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, link } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.resourceRecordings.push({ title, link });
    await course.save();

    res.status(201).json({
      message: "Resource added successfully",
      resources: course.resourceRecordings,
    });
  } catch (err) {
    res.status(500).json({ message: "Error adding resource", error: err.message });
  }
});


// ✅ READ all resources of a course
router.get("/:courseId/resourcesrecord", async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).select("resourceRecordings");
    if (!course) return res.status(404).json({ message: "Course not found" });

    res.json(course.resourceRecordings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching resources", error: err.message });
  }
});


// ✅ UPDATE a specific resource in a course
router.put("/:courseId/resourcesrecord/:resourceId", async (req, res) => {
  try {
    const { courseId, resourceId } = req.params;
    const { title, link } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const resource = course.resourceRecordings.id(resourceId);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    if (title) resource.title = title;
    if (link) resource.link = link;

    await course.save();

    res.json({ message: "Resource updated successfully", resource });
  } catch (err) {
    res.status(500).json({ message: "Error updating resource", error: err.message });
  }
});

// ✅ DELETE a specific resource from a course
router.delete("/:courseId/resourcesrecord/:resourceId", async (req, res) => {
  try {
    const { courseId, resourceId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // ✅ Find the resource subdocument
    const resource = course.resourceRecordings.id(resourceId);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    // ✅ Correct way to remove in Mongoose 6+
    resource.deleteOne(); // or use course.resourceRecordings.pull(resourceId)

    await course.save();

    res.json({ message: "Resource deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting resource", error: err.message });
  }
});



module.exports = router;