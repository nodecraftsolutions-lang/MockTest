import { useState, useEffect } from "react";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Calendar,
  Users,
  DollarSign,
  Video,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  User,
  Award,
  Clock,
  List
} from "lucide-react";
import api from "../../../api/axios";
import { useToast } from "../../../context/ToastContext";
import LoadingSpinner from "../../../components/LoadingSpinner";

const CourseManagement = () => {
  const { showSuccess, showError } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState("list"); // list, create, edit
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    outcomes: [""],
    features: [""],
    price: "",
    currency: "INR",
    category: "",
    startDate: "",
    duration: "",
    level: "Beginner",
    isPaid: true,
    recordingsPrice: "",
    curriculum: {
      phases: []
    },
    instructors: [{ name: "", bio: "", experience: "", expertise: "", photoUrl: "" }]
  });

  // Fetch all courses
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses/admin/all");
      setCourses(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      showError("Failed to load courses");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories for filter
  const categories = [...new Set(courses.map(course => course.category))];

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || course.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Toggle course expansion
  const toggleCourseExpansion = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  // Delete course
  const deleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    try {
      await api.delete(`/courses/${courseId}`);
      showSuccess("Course deleted successfully");
      fetchCourses(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete course:", error);
      showError("Failed to delete course: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Start editing a course
  const startEditing = (course) => {
    setEditingCourse(course._id);
    setCourseData({
      title: course.title || "",
      description: course.description || "",
      outcomes: course.outcomes || [""],
      features: course.features || [""],
      price: course.price || "",
      currency: course.currency || "INR",
      category: course.category || "",
      startDate: course.startDate || "",
      duration: course.duration || "",
      level: course.level || "Beginner",
      isPaid: course.isPaid !== undefined ? course.isPaid : true,
      recordingsPrice: course.recordingsPrice || "",
      curriculum: course.curriculum || { phases: [] },
      instructors: course.instructors || [{ name: "", bio: "", experience: "", expertise: "", photoUrl: "" }]
    });
    setActiveTab("edit");
  };

  // Update course
  const updateCourse = async () => {
    if (!courseData.title || !courseData.description) {
      showError("Title and description are required");
      return;
    }

    // Validate that each phase has at least one week
    for (const phase of courseData.curriculum.phases) {
      if (!phase.weeks || phase.weeks.length === 0) {
        showError(`Phase "${phase.title}" must have at least one week`);
        return;
      }
      
      // Validate that each week has at least one topic
      for (const week of phase.weeks) {
        if (!week.topics || week.topics.length === 0) {
          showError(`Week "${week.title}" in phase "${phase.title}" must have at least one topic`);
          return;
        }
      }
    }

    // Validate that there's at least one instructor
    if (courseData.instructors.length === 0 || !courseData.instructors[0].name) {
      showError("At least one instructor with a name is required");
      return;
    }

    try {
      // Ensure we're sending the complete course data including all instructor fields
      const courseUpdateData = {
        title: courseData.title,
        description: courseData.description,
        outcomes: courseData.outcomes,
        features: courseData.features,
        price: courseData.price,
        currency: courseData.currency,
        category: courseData.category,
        startDate: courseData.startDate,
        duration: courseData.duration,
        level: courseData.level,
        isPaid: courseData.isPaid,
        recordingsPrice: courseData.recordingsPrice,
        curriculum: courseData.curriculum,
        instructors: courseData.instructors.map(instructor => ({
          name: instructor.name,
          bio: instructor.bio,
          experience: instructor.experience,
          expertise: instructor.expertise,
          photoUrl: instructor.photoUrl
        }))
      };

      const response = await api.put(`/courses/${editingCourse}`, courseUpdateData);
      showSuccess("Course updated successfully!");
      console.log("Course updated:", response.data);
      
      // Reset form and refresh courses
      setEditingCourse(null);
      setActiveTab("list");
      fetchCourses();
    } catch (error) {
      console.error("Failed to update course:", error);
      showError("Failed to update course: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  // Handle basic course info changes
  const handleCourseChange = (field, value) => {
    setCourseData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle array fields (outcomes, features)
  const handleArrayChange = (field, index, value) => {
    setCourseData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setCourseData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }));
  };

  const removeArrayItem = (field, index) => {
    setCourseData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Phase management
  const [editingPhaseIndex, setEditingPhaseIndex] = useState(null);
  const [newPhase, setNewPhase] = useState({
    phaseNumber: "",
    title: "",
    description: "",
    goal: "",
    weeks: []
  });

  const handleNewPhaseChange = (field, value) => {
    setNewPhase(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPhase = () => {
    if (!newPhase.phaseNumber || !newPhase.title) {
      showError("Phase number and title are required");
      return;
    }

    // Check if phase number already exists
    const phaseExists = courseData.curriculum.phases.some(
      phase => phase.phaseNumber === parseInt(newPhase.phaseNumber)
    );
    
    if (phaseExists) {
      showError("Phase number already exists");
      return;
    }

    setCourseData(prev => ({
      ...prev,
      curriculum: {
        ...prev.curriculum,
        phases: [...prev.curriculum.phases, { ...newPhase, phaseNumber: parseInt(newPhase.phaseNumber) }]
      }
    }));

    // Reset new phase form
    setNewPhase({
      phaseNumber: "",
      title: "",
      description: "",
      goal: "",
      weeks: []
    });

    showSuccess("Phase added successfully!");
  };

  const removePhase = (index) => {
    setCourseData(prev => ({
      ...prev,
      curriculum: {
        ...prev.curriculum,
        phases: prev.curriculum.phases.filter((_, i) => i !== index)
      }
    }));
  };

  const startEditingPhase = (index) => {
    setEditingPhaseIndex(index);
    setNewPhase(courseData.curriculum.phases[index]);
  };

  const updatePhase = () => {
    if (!newPhase.phaseNumber || !newPhase.title) {
      showError("Phase number and title are required");
      return;
    }

    // Check if phase number already exists (excluding current editing phase)
    const phaseExists = courseData.curriculum.phases.some(
      (phase, i) => phase.phaseNumber === parseInt(newPhase.phaseNumber) && i !== editingPhaseIndex
    );
    
    if (phaseExists) {
      showError("Phase number already exists");
      return;
    }

    setCourseData(prev => ({
      ...prev,
      curriculum: {
        ...prev.curriculum,
        phases: prev.curriculum.phases.map((phase, i) => 
          i === editingPhaseIndex ? { ...newPhase, phaseNumber: parseInt(newPhase.phaseNumber) } : phase
        )
      }
    }));

    setEditingPhaseIndex(null);
    setNewPhase({
      phaseNumber: "",
      title: "",
      description: "",
      goal: "",
      weeks: []
    });

    showSuccess("Phase updated successfully!");
  };

  const cancelEditPhase = () => {
    setEditingPhaseIndex(null);
    setNewPhase({
      phaseNumber: "",
      title: "",
      description: "",
      goal: "",
      weeks: []
    });
  };

  // Week management
  const [editingWeekIndices, setEditingWeekIndices] = useState({ phaseIndex: null, weekIndex: null });
  const [newWeek, setNewWeek] = useState({
    weekNumber: "",
    title: "",
    topics: [{ title: "", description: "" }],
    goal: ""
  });

  const handleNewWeekChange = (field, value) => {
    setNewWeek(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTopicToWeek = () => {
    setNewWeek(prev => ({
      ...prev,
      topics: [...prev.topics, { title: "", description: "" }]
    }));
  };

  const removeTopicFromWeek = (index) => {
    setNewWeek(prev => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index)
    }));
  };

  const handleTopicChange = (index, field, value) => {
    setNewWeek(prev => ({
      ...prev,
      topics: prev.topics.map((topic, i) => 
        i === index ? { ...topic, [field]: value } : topic
      )
    }));
  };

  const addWeekToPhase = (phaseIndex) => {
    if (!newWeek.weekNumber || !newWeek.title) {
      showError("Week number and title are required");
      return;
    }

    // Check if week number already exists in this phase
    const weekExists = courseData.curriculum.phases[phaseIndex].weeks.some(
      week => week.weekNumber === parseInt(newWeek.weekNumber)
    );
    
    if (weekExists) {
      showError("Week number already exists in this phase");
      return;
    }

    const updatedPhases = [...courseData.curriculum.phases];
    updatedPhases[phaseIndex].weeks.push({ ...newWeek, weekNumber: parseInt(newWeek.weekNumber) });

    setCourseData(prev => ({
      ...prev,
      curriculum: {
        ...prev.curriculum,
        phases: updatedPhases
      }
    }));

    // Reset new week form
    setNewWeek({
      weekNumber: "",
      title: "",
      topics: [{ title: "", description: "" }],
      goal: ""
    });

    showSuccess("Week added successfully!");
  };

  const removeWeekFromPhase = (phaseIndex, weekIndex) => {
    const updatedPhases = [...courseData.curriculum.phases];
    updatedPhases[phaseIndex].weeks.splice(weekIndex, 1);

    setCourseData(prev => ({
      ...prev,
      curriculum: {
        ...prev.curriculum,
        phases: updatedPhases
      }
    }));
  };

  // Start editing a week
  const startEditingWeek = (phaseIndex, weekIndex) => {
    setEditingWeekIndices({ phaseIndex, weekIndex });
    setNewWeek(courseData.curriculum.phases[phaseIndex].weeks[weekIndex]);
  };

  // Update a week
  const updateWeek = () => {
    if (!newWeek.weekNumber || !newWeek.title) {
      showError("Week number and title are required");
      return;
    }

    // Check if week number already exists in this phase (excluding current editing week)
    const weekExists = courseData.curriculum.phases[editingWeekIndices.phaseIndex].weeks.some(
      (week, i) => week.weekNumber === parseInt(newWeek.weekNumber) && i !== editingWeekIndices.weekIndex
    );
    
    if (weekExists) {
      showError("Week number already exists in this phase");
      return;
    }

    const updatedPhases = [...courseData.curriculum.phases];
    updatedPhases[editingWeekIndices.phaseIndex].weeks[editingWeekIndices.weekIndex] = { 
      ...newWeek, 
      weekNumber: parseInt(newWeek.weekNumber) 
    };

    setCourseData(prev => ({
      ...prev,
      curriculum: {
        ...prev.curriculum,
        phases: updatedPhases
      }
    }));

    setEditingWeekIndices({ phaseIndex: null, weekIndex: null });
    setNewWeek({
      weekNumber: "",
      title: "",
      topics: [{ title: "", description: "" }],
      goal: ""
    });

    showSuccess("Week updated successfully!");
  };

  // Cancel editing a week
  const cancelEditWeek = () => {
    setEditingWeekIndices({ phaseIndex: null, weekIndex: null });
    setNewWeek({
      weekNumber: "",
      title: "",
      topics: [{ title: "", description: "" }],
      goal: ""
    });
  };

  // Instructor management
  const [editingInstructorIndex, setEditingInstructorIndex] = useState(null);
  const [newInstructor, setNewInstructor] = useState({
    name: "",
    bio: "",
    experience: "",
    expertise: "",
    photoUrl: ""
  });

  const handleInstructorChange = (index, field, value) => {
    setCourseData(prev => ({
      ...prev,
      instructors: prev.instructors.map((instructor, i) => 
        i === index ? { ...instructor, [field]: value } : instructor
      )
    }));
  };

  const handleNewInstructorChange = (field, value) => {
    setNewInstructor(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addInstructor = () => {
    if (!newInstructor.name) {
      showError("Instructor name is required");
      return;
    }

    setCourseData(prev => ({
      ...prev,
      instructors: [...prev.instructors, newInstructor]
    }));

    // Reset new instructor form
    setNewInstructor({
      name: "",
      bio: "",
      experience: "",
      expertise: "",
      photoUrl: ""
    });

    showSuccess("Instructor added successfully!");
  };

  const removeInstructor = (index) => {
    if (courseData.instructors.length > 1) {
      setCourseData(prev => ({
        ...prev,
        instructors: prev.instructors.filter((_, i) => i !== index)
      }));
    } else {
      showError("At least one instructor is required");
    }
  };

  const startEditingInstructor = (index) => {
    setEditingInstructorIndex(index);
    setNewInstructor(courseData.instructors[index]);
  };

  const updateInstructor = () => {
    if (!newInstructor.name) {
      showError("Instructor name is required");
      return;
    }

    // Create a copy of the current instructors array
    const updatedInstructors = [...courseData.instructors];
    // Update the specific instructor at the editing index
    updatedInstructors[editingInstructorIndex] = { ...newInstructor };

    // Update the courseData state with the modified instructors array
    setCourseData(prev => ({
      ...prev,
      instructors: updatedInstructors
    }));

    setEditingInstructorIndex(null);
    setNewInstructor({
      name: "",
      bio: "",
      experience: "",
      expertise: "",
      photoUrl: ""
    });

    showSuccess("Instructor updated successfully!");
  };

  const cancelEditInstructor = () => {
    setEditingInstructorIndex(null);
    setNewInstructor({
      name: "",
      bio: "",
      experience: "",
      expertise: "",
      photoUrl: ""
    });
  };

  const cancelEdit = () => {
    setEditingCourse(null);
    setActiveTab("list");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="large" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BookOpen className="w-8 h-8 mr-3 text-blue-600" />
                Course Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage all courses, create new ones, and organize content
              </p>
            </div>

          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("list")}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === "list"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <BookOpen className="w-5 h-5 inline mr-2" />
                All Courses
              </button>

              {activeTab === "edit" && (
                <button
                  className="py-4 px-6 text-center border-b-2 font-medium text-sm border-blue-500 text-blue-600"
                >
                  <Edit className="w-5 h-5 inline mr-2" />
                  Edit Course
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === "list" ? (
          <>
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <div className="relative">
                    <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-end text-sm text-gray-600">
                  <span>
                    Showing {filteredCourses.length} of {courses.length} courses
                  </span>
                </div>
              </div>
            </div>

            {/* Improved Courses List View */}
            <div className="space-y-6">
              {filteredCourses.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || filterCategory !== "all" 
                      ? "Try adjusting your search or filter criteria." 
                      : "Get started by creating your first course."}
                  </p>

                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {filteredCourses.map((course) => (
                    <div key={course._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
                              <div className="flex flex-wrap gap-2">
                                {course.isPaid ? (
                                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    Paid
                                  </span>
                                ) : (
                                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    Free
                                  </span>
                                )}
                                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                  {course.category}
                                </span>
                                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                  {course.level || "Beginner"}
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-gray-600 mb-4 text-sm" style={{ whiteSpace: 'pre-line', fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: course.description?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') || '' }} />
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="flex items-center text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                                <div>
                                  <div className="text-xs text-gray-500">Price</div>
                                  <div className="font-medium">{course.isPaid ? `₹${course.price}` : "Free"}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                                <div>
                                  <div className="text-xs text-gray-500">Start Date</div>
                                  <div className="font-medium">{course.startDate ? formatDate(course.startDate) : "Flexible"}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                <Users className="w-5 h-5 mr-2 text-purple-600" />
                                <div>
                                  <div className="text-xs text-gray-500">Students</div>
                                  <div className="font-medium">{course.enrolledStudents?.length || 0}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                <MessageSquare className="w-5 h-5 mr-2 text-yellow-600" />
                                <div>
                                  <div className="text-xs text-gray-500">Discussions</div>
                                  <div className="font-medium">{course.discussionCount || 0}</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Curriculum Preview */}
                            <div className="mb-4">
                              <div className="flex items-center text-sm text-gray-700 mb-2">
                                <BookOpen className="w-4 h-4 mr-2 text-orange-600" />
                                <span className="font-medium">Curriculum</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {course.curriculum?.phases?.slice(0, 3).map((phase, index) => (
                                  <span key={index} className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded">
                                    Phase {phase.phaseNumber}: {phase.title}
                                  </span>
                                ))}
                                {course.curriculum?.phases?.length > 3 && (
                                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                    +{course.curriculum.phases.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Instructors Preview */}
                            <div className="mb-4">
                              <div className="flex items-center text-sm text-gray-700 mb-2">
                                <Users className="w-4 h-4 mr-2 text-green-600" />
                                <span className="font-medium">Instructors ({course.instructors?.length || 0})</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {course.instructors?.slice(0, 3).map((instructor, index) => (
                                  <span key={index} className="bg-green-50 text-green-800 text-xs px-2 py-1 rounded">
                                    {instructor.name}
                                  </span>
                                ))}
                                {course.instructors?.length > 3 && (
                                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                    +{course.instructors.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-3">
                            <button
                              onClick={() => startEditing(course)}
                              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </button>
                            <button
                              onClick={() => deleteCourse(course._id)}
                              className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Actions Panel */}
                      <div className="bg-gray-50 border-t border-gray-200 p-4">
                        <div className="flex flex-wrap gap-3">
                          <a 
                            href={`/admin/course/sessions?courseId=${course._id}`}
                            className="flex items-center text-sm bg-white px-4 py-2 rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Manage Sessions
                          </a>
                          <a 
                            href={`/admin/course/discussions?courseId=${course._id}`}
                            className="flex items-center text-sm bg-white px-4 py-2 rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            View Discussions
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {activeTab === "edit" ? "Edit Course" : "Create New Course"}
              </h2>
              <button
                onClick={cancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              {/* Course Creation/Edit Form - Unified UI */}
              <div className="space-y-8">
                {/* Basic Course Information */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Course Title *</label>
                      <input
                        type="text"
                        value={courseData.title}
                        onChange={(e) => handleCourseChange("title", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter course title"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <input
                        type="text"
                        value={courseData.category}
                        onChange={(e) => handleCourseChange("category", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter category"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                      <select
                        value={courseData.level}
                        onChange={(e) => handleCourseChange("level", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (weeks)</label>
                      <input
                        type="number"
                        value={courseData.duration}
                        onChange={(e) => handleCourseChange("duration", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter duration"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      value={courseData.description}
                      onChange={(e) => handleCourseChange("description", e.target.value)}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter course description (supports all characters including emojis and symbols)"
                    />
                  </div>
                </div>
                
                {/* Pricing Information */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                    Pricing
                  </h3>
                  
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="isPaid"
                      checked={courseData.isPaid}
                      onChange={(e) => handleCourseChange("isPaid", e.target.checked)}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isPaid" className="ml-2 block text-sm font-medium text-gray-700">
                      Paid Course
                    </label>
                  </div>
                  
                  {courseData.isPaid && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Course Price (₹) *</label>
                        <input
                          type="number"
                          value={courseData.price}
                          onChange={(e) => handleCourseChange("price", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter price"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Recordings Price (₹)</label>
                        <input
                          type="number"
                          value={courseData.recordingsPrice}
                          onChange={(e) => handleCourseChange("recordingsPrice", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter recordings price"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Schedule Information */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                    Schedule
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={courseData.startDate}
                      onChange={(e) => handleCourseChange("startDate", e.target.value)}
                      className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {/* Outcomes */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-yellow-600" />
                    Learning Outcomes
                  </h3>
                  
                  {courseData.outcomes.map((outcome, index) => (
                    <div key={index} className="flex items-center mb-3">
                      <input
                        type="text"
                        value={outcome}
                        onChange={(e) => handleArrayChange("outcomes", index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter learning outcome"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem("outcomes", index)}
                        className="ml-2 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => addArrayItem("outcomes")}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-5 h-5 mr-1" />
                    Add Outcome
                  </button>
                </div>
                
                {/* Features */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-orange-600" />
                    Course Features
                  </h3>
                  
                  {courseData.features.map((feature, index) => (
                    <div key={index} className="flex items-center mb-3">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleArrayChange("features", index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter course feature"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem("features", index)}
                        className="ml-2 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => addArrayItem("features")}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-5 h-5 mr-1" />
                    Add Feature
                  </button>
                </div>
                
                {/* Curriculum Management */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                    Course Curriculum *
                  </h3>
                  
                  {courseData.curriculum.phases.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No phases added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {courseData.curriculum.phases.map((phase, phaseIndex) => (
                        <div key={phaseIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-gray-900">Phase {phase.phaseNumber}: {phase.title}</h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startEditingPhase(phaseIndex)}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit phase"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removePhase(phaseIndex)}
                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Remove phase"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-gray-500">Goal:</span>
                              <span className="ml-2 font-medium">{phase.goal || "Not specified"}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Weeks:</span>
                              <span className="ml-2 font-medium">{phase.weeks?.length || 0}</span>
                            </div>
                          </div>
                          
                          {phase.description && (
                            <div className="text-xs text-gray-600 mb-3">
                              <span className="text-gray-500">Description:</span>
                              <span className="ml-2" style={{ fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: phase.description?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') || '' }} />
                            </div>
                          )}
                          
                          {/* Weeks preview */}
                          {phase.weeks && phase.weeks.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <h5 className="text-xs font-medium text-gray-700 mb-2">Weeks:</h5>
                              <div className="space-y-2">
                                {phase.weeks.map((week, weekIndex) => (
                                  <div key={weekIndex} className="flex justify-between items-center bg-white p-2 rounded border">
                                    <div>
                                      <span className="font-medium">W{week.weekNumber}: {week.title}</span>
                                      {week.goal && (
                                        <span className="text-xs text-gray-600 ml-2">Goal: {week.goal}</span>
                                      )}
                                    </div>
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => startEditingWeek(phaseIndex, weekIndex)}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                        title="Edit week"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => removeWeekFromPhase(phaseIndex, weekIndex)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        title="Remove week"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add/Edit Phase Form */}
                  <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      {editingPhaseIndex !== null ? "Edit Phase" : "Add New Phase"}
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phase Number *</label>
                          <input
                            type="number"
                            value={newPhase.phaseNumber}
                            onChange={(e) => handleNewPhaseChange("phaseNumber", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter phase number"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phase Title *</label>
                          <input
                            type="text"
                            value={newPhase.title}
                            onChange={(e) => handleNewPhaseChange("title", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter phase title"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
                        <input
                          type="text"
                          value={newPhase.goal}
                          onChange={(e) => handleNewPhaseChange("goal", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter phase goal"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={newPhase.description}
                          onChange={(e) => handleNewPhaseChange("description", e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter phase description"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        {editingPhaseIndex !== null && (
                          <button
                            type="button"
                            onClick={cancelEditPhase}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={editingPhaseIndex !== null ? updatePhase : addPhase}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {editingPhaseIndex !== null ? "Update Phase" : "Add Phase"}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Add/Edit Week Form (only show when a phase is selected for editing) */}
                  {editingPhaseIndex !== null && (
                    <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-blue-50">
                      <h4 className="font-medium text-gray-900 mb-3">
                        {editingWeekIndices.phaseIndex === editingPhaseIndex ? "Edit Week" : "Add New Week to Phase"}
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Week Number *</label>
                            <input
                              type="number"
                              value={newWeek.weekNumber}
                              onChange={(e) => handleNewWeekChange("weekNumber", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter week number"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Week Title *</label>
                            <input
                              type="text"
                              value={newWeek.title}
                              onChange={(e) => handleNewWeekChange("title", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter week title"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
                          <input
                            type="text"
                            value={newWeek.goal}
                            onChange={(e) => handleNewWeekChange("goal", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter week goal"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Topics</label>
                          {newWeek.topics.map((topic, topicIndex) => (
                            <div key={topicIndex} className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={topic.title}
                                onChange={(e) => handleTopicChange(topicIndex, "title", e.target.value)}
                                placeholder="Topic Title"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <input
                                type="text"
                                value={topic.description}
                                onChange={(e) => handleTopicChange(topicIndex, "description", e.target.value)}
                                placeholder="Topic Description"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              {newWeek.topics.length > 1 && (
                                <button
                                  onClick={() => removeTopicFromWeek(topicIndex)}
                                  className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={addTopicToWeek}
                            className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Topic
                          </button>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          {editingWeekIndices.phaseIndex === editingPhaseIndex && (
                            <button
                              type="button"
                              onClick={cancelEditWeek}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={editingWeekIndices.phaseIndex === editingPhaseIndex ? updateWeek : () => addWeekToPhase(editingPhaseIndex)}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            {editingWeekIndices.phaseIndex === editingPhaseIndex ? "Update Week" : "Add Week"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Instructor Management */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-green-600" />
                    Course Instructors *
                  </h3>
                  
                  {courseData.instructors.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No instructors added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {courseData.instructors.map((instructor, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-gray-900">{instructor.name}</h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startEditingInstructor(index)}
                                className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit instructor"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeInstructor(index)}
                                className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Remove instructor"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-600">
                              <span className="font-medium">Expertise:</span> {instructor.expertise || "Not specified"}
                            </div>
                            <div className="text-gray-600">
                              <span className="font-medium">Experience:</span> {instructor.experience || "Not specified"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add/Edit Instructor Form */}
                  <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      {editingInstructorIndex !== null ? "Edit Instructor" : "Add New Instructor"}
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input
                          type="text"
                          value={newInstructor.name}
                          onChange={(e) => handleNewInstructorChange("name", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter instructor name"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expertise</label>
                          <input
                            type="text"
                            value={newInstructor.expertise}
                            onChange={(e) => handleNewInstructorChange("expertise", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter expertise"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                          <input
                            type="text"
                            value={newInstructor.experience}
                            onChange={(e) => handleNewInstructorChange("experience", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter experience"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                          value={newInstructor.bio}
                          onChange={(e) => handleNewInstructorChange("bio", e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter instructor bio (supports all characters including emojis and symbols)"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                        <input
                          type="text"
                          value={newInstructor.photoUrl}
                          onChange={(e) => handleNewInstructorChange("photoUrl", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter photo URL"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        {editingInstructorIndex !== null && (
                          <button
                            type="button"
                            onClick={cancelEditInstructor}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={editingInstructorIndex !== null ? updateInstructor : addInstructor}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {editingInstructorIndex !== null ? "Update Instructor" : "Add Instructor"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={cancelEdit}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={activeTab === "edit" ? updateCourse : () => {}}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {activeTab === "edit" ? "Update Course" : "Create Course"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement;