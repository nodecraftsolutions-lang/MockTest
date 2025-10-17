import { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  BookOpen,
  Upload,
  DollarSign,
  Calendar,
  Clock,
  Users,
  Award,
  FileText,
  BarChart3,
  List
} from "lucide-react";
import api from "../../../api/axios";
import { useToast } from "../../../context/ToastContext";

const CourseCreation = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
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

  // Phase management
  const [editingPhase, setEditingPhase] = useState(null);
  const [newPhase, setNewPhase] = useState({
    phaseNumber: "",
    title: "",
    description: "",
    goal: "",
    weeks: []
  });

  // Week management
  const [editingWeek, setEditingWeek] = useState(null);
  const [newWeek, setNewWeek] = useState({
    weekNumber: "",
    title: "",
    topics: [{ title: "", description: "" }],
    goal: ""
  });

  // Topic management
  const [newTopic, setNewTopic] = useState({ title: "", description: "" });

  // Instructor management
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [newInstructor, setNewInstructor] = useState({
    name: "",
    bio: "",
    experience: "",
    expertise: "",
    photoUrl: ""
  });

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

  const editPhase = (index) => {
    setEditingPhase(index);
    setNewPhase(courseData.curriculum.phases[index]);
  };

  const updatePhase = () => {
    if (!newPhase.phaseNumber || !newPhase.title) {
      showError("Phase number and title are required");
      return;
    }

    // Check if phase number already exists (excluding current editing phase)
    const phaseExists = courseData.curriculum.phases.some(
      (phase, i) => phase.phaseNumber === parseInt(newPhase.phaseNumber) && i !== editingPhase
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
          i === editingPhase ? { ...newPhase, phaseNumber: parseInt(newPhase.phaseNumber) } : phase
        )
      }
    }));

    setEditingPhase(null);
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
    setEditingPhase(null);
    setNewPhase({
      phaseNumber: "",
      title: "",
      description: "",
      goal: "",
      weeks: []
    });
  };

  // Week management
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

  // Instructor management
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

  const editInstructor = (index) => {
    setEditingInstructor(index);
    setNewInstructor(courseData.instructors[index]);
  };

  const updateInstructor = () => {
    if (!newInstructor.name) {
      showError("Instructor name is required");
      return;
    }

    setCourseData(prev => ({
      ...prev,
      instructors: prev.instructors.map((instructor, i) => 
        i === editingInstructor ? newInstructor : instructor
      )
    }));

    setEditingInstructor(null);
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
    setEditingInstructor(null);
    setNewInstructor({
      name: "",
      bio: "",
      experience: "",
      expertise: "",
      photoUrl: ""
    });
  };

  // Calculate totals
  const totalPhases = courseData.curriculum.phases.length;
  const totalWeeks = courseData.curriculum.phases.reduce((sum, phase) => sum + (phase.weeks?.length || 0), 0);
  const totalTopics = courseData.curriculum.phases.reduce((sum, phase) => 
    sum + phase.weeks.reduce((weekSum, week) => weekSum + (week.topics?.length || 0), 0), 0);
  const totalInstructors = courseData.instructors.length;

  // Submit course
  const submitCourse = async () => {
    if (!courseData.title || !courseData.description || courseData.curriculum.phases.length === 0) {
      showError("Title, description, and at least one phase are required");
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

    setLoading(true);
    try {
      const response = await api.post("/courses", courseData);
      showSuccess("Course created successfully!");
      console.log("Course created:", response.data);
      
      // Reset form
      setCourseData({
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
    } catch (error) {
      console.error("Course creation error:", error);
      showError(error.response?.data?.message || "Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Create New Course
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Design comprehensive courses with structured curriculum and expert instructors
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Basic Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Course Information
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Title & Description */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={courseData.title}
                      onChange={(e) => handleCourseChange("title", e.target.value)}
                      placeholder="e.g., Campus2Corporate Training"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={courseData.description}
                      onChange={(e) => handleCourseChange("description", e.target.value)}
                      placeholder="Detailed course description..."
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Outcomes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Learning Outcomes
                  </label>
                  <div className="space-y-2">
                    {courseData.outcomes.map((outcome, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={outcome}
                          onChange={(e) => handleArrayChange("outcomes", index, e.target.value)}
                          placeholder="What will students learn?"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => removeArrayItem("outcomes", index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addArrayItem("outcomes")}
                      className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Outcome
                    </button>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Course Features
                  </label>
                  <div className="space-y-2">
                    {courseData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleArrayChange("features", index, e.target.value)}
                          placeholder="e.g., Live sessions, Assignments"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => removeArrayItem("features", index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addArrayItem("features")}
                      className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Feature
                    </button>
                  </div>
                </div>

                {/* Pricing & Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <input
                      type="text"
                      value={courseData.category}
                      onChange={(e) => handleCourseChange("category", e.target.value)}
                      placeholder="e.g., Aptitude, Programming"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Level *
                    </label>
                    <select
                      value={courseData.level}
                      onChange={(e) => handleCourseChange("level", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price ({courseData.currency}) *
                    </label>
                    <input
                      type="number"
                      value={courseData.price}
                      onChange={(e) => handleCourseChange("price", e.target.value)}
                      placeholder="999"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Recordings Price ({courseData.currency})
                    </label>
                    <input
                      type="number"
                      value={courseData.recordingsPrice}
                      onChange={(e) => handleCourseChange("recordingsPrice", e.target.value)}
                      placeholder="499"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={courseData.startDate}
                      onChange={(e) => handleCourseChange("startDate", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Duration (days) *
                    </label>
                    <input
                      type="number"
                      value={courseData.duration}
                      onChange={(e) => handleCourseChange("duration", e.target.value)}
                      placeholder="30"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Curriculum Management */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Course Curriculum
                </h2>
              </div>
              <div className="p-6 space-y-6">
                
                {/* Phases */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Phases</h3>
                  
                  {/* Add/Edit Phase Form */}
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 mb-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">
                      {editingPhase !== null ? 'Edit Phase' : 'Add New Phase'}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="number"
                        value={newPhase.phaseNumber}
                        onChange={(e) => handleNewPhaseChange("phaseNumber", e.target.value)}
                        placeholder="Phase Number (e.g., 1)"
                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      
                      <input
                        type="text"
                        value={newPhase.title}
                        onChange={(e) => handleNewPhaseChange("title", e.target.value)}
                        placeholder="Phase Title (e.g., Foundation Skills)"
                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 mb-4">
                      <input
                        type="text"
                        value={newPhase.goal}
                        onChange={(e) => handleNewPhaseChange("goal", e.target.value)}
                        placeholder="Phase Goal (e.g., Build strong aptitude, reasoning, and English basics)"
                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      
                      <textarea
                        value={newPhase.description}
                        onChange={(e) => handleNewPhaseChange("description", e.target.value)}
                        placeholder="Phase Description..."
                        rows="3"
                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {editingPhase !== null ? (
                        <>
                          <button
                            onClick={updatePhase}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Update Phase
                          </button>
                          <button
                            onClick={cancelEditPhase}
                            className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={addPhase}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Phase
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Existing Phases List */}
                  {courseData.curriculum.phases.length > 0 && (
                    <div className="space-y-4">
                      {courseData.curriculum.phases.map((phase, phaseIndex) => (
                        <div key={phaseIndex} className="border border-gray-200 rounded-xl overflow-hidden">
                          <div className="bg-gray-50 p-4 border-b">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-semibold text-gray-900">Phase {phase.phaseNumber}: {phase.title}</h4>
                                {phase.goal && (
                                  <p className="text-sm text-gray-600 mt-1">Goal: {phase.goal}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => editPhase(phaseIndex)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => removePhase(phaseIndex)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            {phase.description && (
                              <p className="text-sm text-gray-600 mt-2">{phase.description}</p>
                            )}
                          </div>
                          
                          <div className="p-4">
                            <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                              <List className="w-4 h-4 mr-2" />
                              Weeks in this Phase
                            </h5>
                            
                            {/* Add Week Form */}
                            <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                              <h6 className="font-medium text-gray-800 mb-3">Add Week</h6>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <input
                                  type="number"
                                  value={newWeek.weekNumber}
                                  onChange={(e) => handleNewWeekChange("weekNumber", e.target.value)}
                                  placeholder="Week Number (e.g., 1)"
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                
                                <input
                                  type="text"
                                  value={newWeek.title}
                                  onChange={(e) => handleNewWeekChange("title", e.target.value)}
                                  placeholder="Week Title (e.g., Quantitative Aptitude Basics)"
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              
                              <div className="mb-3">
                                <input
                                  type="text"
                                  value={newWeek.goal}
                                  onChange={(e) => handleNewWeekChange("goal", e.target.value)}
                                  placeholder="Week Goal (optional)"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              
                              <div className="mb-3">
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
                              
                              <button
                                onClick={() => addWeekToPhase(phaseIndex)}
                                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Week to Phase
                              </button>
                            </div>
                            
                            {/* Weeks List */}
                            {phase.weeks && phase.weeks.length > 0 ? (
                              <div className="space-y-3">
                                {phase.weeks.map((week, weekIndex) => (
                                  <div key={weekIndex} className="border border-gray-200 rounded-lg p-3">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h6 className="font-medium text-gray-900">Week {week.weekNumber}: {week.title}</h6>
                                        {week.goal && (
                                          <p className="text-xs text-gray-600 mt-1">Goal: {week.goal}</p>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => removeWeekFromPhase(phaseIndex, weekIndex)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                    
                                    {week.topics && week.topics.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Topics:</p>
                                        <ul className="text-xs text-gray-600 space-y-1">
                                          {week.topics.map((topic, topicIndex) => (
                                            <li key={topicIndex} className="flex">
                                              <span className="mr-2">•</span>
                                              <span>{topic.title}{topic.description ? ` - ${topic.description}` : ''}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic">No weeks added yet</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Instructor Management */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Course Instructors
                </h2>
              </div>
              <div className="p-6 space-y-6">
                
                {/* Add/Edit Instructor Form */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingInstructor !== null ? 'Edit Instructor' : 'Add New Instructor'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <input
                        type="text"
                        value={newInstructor.name}
                        onChange={(e) => handleNewInstructorChange("name", e.target.value)}
                        placeholder="Full Name *"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      
                      <textarea
                        value={newInstructor.bio}
                        onChange={(e) => handleNewInstructorChange("bio", e.target.value)}
                        placeholder="Bio"
                        rows="2"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      
                      <input
                        type="text"
                        value={newInstructor.experience}
                        onChange={(e) => handleNewInstructorChange("experience", e.target.value)}
                        placeholder="Experience (e.g., 5 years in Software Development)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      
                      <input
                        type="text"
                        value={newInstructor.expertise}
                        onChange={(e) => handleNewInstructorChange("expertise", e.target.value)}
                        placeholder="Expertise (e.g., Java, Python, Data Structures)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      
                      <input
                        type="url"
                        value={newInstructor.photoUrl}
                        onChange={(e) => handleNewInstructorChange("photoUrl", e.target.value)}
                        placeholder="Photo URL"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      {editingInstructor !== null ? (
                        <>
                          <button
                            onClick={updateInstructor}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Update Instructor
                          </button>
                          <button
                            onClick={cancelEditInstructor}
                            className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={addInstructor}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Instructor
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Existing Instructors List */}
                {courseData.instructors.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Instructors</h3>
                    <div className="space-y-4">
                      {courseData.instructors.map((instructor, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{instructor.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{instructor.bio}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => editInstructor(index)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeInstructor(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>Experience: {instructor.experience}</div>
                            <div>Expertise: {instructor.expertise}</div>
                          </div>
                          
                          {instructor.photoUrl && (
                            <div className="mt-3">
                              <img 
                                src={instructor.photoUrl} 
                                alt={instructor.name} 
                                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?background=random&color=fff&name=${encodeURIComponent(instructor.name)}`;
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={submitCourse}
              disabled={loading || courseData.curriculum.phases.length === 0}
              className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Course...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Create Course
                </>
              )}
            </button>
          </div>

          {/* Sidebar - Course Preview */}
          <div className="space-y-8">
            
            {/* Course Stats */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                Course Summary
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <BookOpen className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Total Phases</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{totalPhases}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Award className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Total Weeks</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{totalWeeks}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <List className="w-5 h-5 text-purple-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Total Topics</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{totalTopics}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-orange-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Total Instructors</span>
                  </div>
                  <span className="text-lg font-bold text-orange-600">{totalInstructors}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-gray-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Duration</span>
                  </div>
                  <span className="text-lg font-bold text-gray-600">{courseData.duration || 0} days</span>
                </div>
              </div>
            </div>

            {/* Quick Preview */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Preview</h3>
              
              {courseData.title ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{courseData.title}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{courseData.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Level:</span>
                      <div className="font-medium">{courseData.level}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Category:</span>
                      <div className="font-medium">{courseData.category}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Price:</span>
                      <div className="font-medium">{courseData.price} {courseData.currency}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Start Date:</span>
                      <div className="font-medium">{courseData.startDate || 'Not set'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Course preview will appear here</p>
                </div>
              )}
            </div>

            {/* Validation Status */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation</h3>
              
              <div className="space-y-3">
                <div className={`flex items-center ${courseData.title ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-3 h-3 rounded-full mr-3 ${courseData.title ? 'bg-green-500' : 'bg-gray-300'}`} />
                  Course Title
                </div>
                
                <div className={`flex items-center ${courseData.description ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-3 h-3 rounded-full mr-3 ${courseData.description ? 'bg-green-500' : 'bg-gray-300'}`} />
                  Description
                </div>
                
                <div className={`flex items-center ${courseData.category ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-3 h-3 rounded-full mr-3 ${courseData.category ? 'bg-green-500' : 'bg-gray-300'}`} />
                  Category
                </div>
                
                <div className={`flex items-center ${courseData.curriculum.phases.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-3 h-3 rounded-full mr-3 ${courseData.curriculum.phases.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  At least one phase
                </div>
                
                <div className={`flex items-center ${courseData.instructors.length > 0 && courseData.instructors[0].name ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-3 h-3 rounded-full mr-3 ${courseData.instructors.length > 0 && courseData.instructors[0].name ? 'bg-green-500' : 'bg-gray-300'}`} />
                  At least one instructor
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCreation;