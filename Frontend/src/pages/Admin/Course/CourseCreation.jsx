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
  BarChart3
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
    sections: []
  });

  const [editingSection, setEditingSection] = useState(null);
  const [newSection, setNewSection] = useState({
    title: "",
    description: "",
    lessonsCount: "",
    instructors: [{ name: "", bio: "", experience: "", expertise: "", photoUrl: "" }]
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

  // Section management
  const handleNewSectionChange = (field, value) => {
    setNewSection(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInstructorChange = (index, field, value) => {
    setNewSection(prev => ({
      ...prev,
      instructors: prev.instructors.map((instructor, i) => 
        i === index ? { ...instructor, [field]: value } : instructor
      )
    }));
  };

  const addInstructor = () => {
    setNewSection(prev => ({
      ...prev,
      instructors: [...prev.instructors, { name: "", bio: "", experience: "", expertise: "", photoUrl: "" }]
    }));
  };

  const removeInstructor = (index) => {
    if (newSection.instructors.length > 1) {
      setNewSection(prev => ({
        ...prev,
        instructors: prev.instructors.filter((_, i) => i !== index)
      }));
    }
  };

  const addSection = () => {
    if (!newSection.title || !newSection.lessonsCount) {
      showError("Section title and lessons count are required");
      return;
    }

    setCourseData(prev => ({
      ...prev,
      sections: [...prev.sections, { ...newSection, lessonsCount: parseInt(newSection.lessonsCount) }]
    }));

    // Reset new section form
    setNewSection({
      title: "",
      description: "",
      lessonsCount: "",
      instructors: [{ name: "", bio: "", experience: "", expertise: "", photoUrl: "" }]
    });

    showSuccess("Section added successfully!");
  };

  const removeSection = (index) => {
    setCourseData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const editSection = (index) => {
    setEditingSection(index);
    setNewSection(courseData.sections[index]);
  };

  const updateSection = () => {
    if (!newSection.title || !newSection.lessonsCount) {
      showError("Section title and lessons count are required");
      return;
    }

    setCourseData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === editingSection ? { ...newSection, lessonsCount: parseInt(newSection.lessonsCount) } : section
      )
    }));

    setEditingSection(null);
    setNewSection({
      title: "",
      description: "",
      lessonsCount: "",
      instructors: [{ name: "", bio: "", experience: "", expertise: "", photoUrl: "" }]
    });

    showSuccess("Section updated successfully!");
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setNewSection({
      title: "",
      description: "",
      lessonsCount: "",
      instructors: [{ name: "", bio: "", experience: "", expertise: "", photoUrl: "" }]
    });
  };

  // Calculate totals
  const totalLessons = courseData.sections.reduce((sum, section) => sum + (section.lessonsCount || 0), 0);
  const totalInstructors = courseData.sections.reduce((sum, section) => sum + (section.instructors?.length || 0), 0);

  // Submit course
  const submitCourse = async () => {
    if (!courseData.title || !courseData.description || courseData.sections.length === 0) {
      showError("Title, description, and at least one section are required");
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
        sections: []
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
            Design comprehensive courses with structured sections and expert instructors
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

            {/* Section Management */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Course Sections
                </h2>
              </div>
              <div className="p-6 space-y-6">
                
                {/* Add/Edit Section Form */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingSection !== null ? 'Edit Section' : 'Add New Section'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <input
                        type="text"
                        value={newSection.title}
                        onChange={(e) => handleNewSectionChange("title", e.target.value)}
                        placeholder="Section title (e.g., Week 1 – Quantitative Aptitude Basics)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      
                      <textarea
                        value={newSection.description}
                        onChange={(e) => handleNewSectionChange("description", e.target.value)}
                        placeholder="Section description..."
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      
                      <input
                        type="number"
                        value={newSection.lessonsCount}
                        onChange={(e) => handleNewSectionChange("lessonsCount", e.target.value)}
                        placeholder="Number of lessons"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Instructors */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Instructors
                      </label>
                      <div className="space-y-4">
                        {newSection.instructors.map((instructor, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-medium text-gray-900">Instructor {index + 1}</h4>
                              {newSection.instructors.length > 1 && (
                                <button
                                  onClick={() => removeInstructor(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={instructor.name}
                                onChange={(e) => handleInstructorChange(index, "name", e.target.value)}
                                placeholder="Full Name"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <input
                                type="text"
                                value={instructor.bio}
                                onChange={(e) => handleInstructorChange(index, "bio", e.target.value)}
                                placeholder="Bio"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <input
                                type="text"
                                value={instructor.experience}
                                onChange={(e) => handleInstructorChange(index, "experience", e.target.value)}
                                placeholder="Experience"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <input
                                type="text"
                                value={instructor.expertise}
                                onChange={(e) => handleInstructorChange(index, "expertise", e.target.value)}
                                placeholder="Expertise"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <input
                                type="url"
                                value={instructor.photoUrl}
                                onChange={(e) => handleInstructorChange(index, "photoUrl", e.target.value)}
                                placeholder="Photo URL"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
                              />
                            </div>
                          </div>
                        ))}
                        
                        <button
                          onClick={addInstructor}
                          className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Another Instructor
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      {editingSection !== null ? (
                        <>
                          <button
                            onClick={updateSection}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Update Section
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={addSection}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Section
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Existing Sections List */}
                {courseData.sections.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Sections</h3>
                    <div className="space-y-4">
                      {courseData.sections.map((section, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{section.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => editSection(index)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeSection(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
                              {section.lessonsCount} lessons
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2 text-green-600" />
                              {section.instructors?.length || 0} instructors
                            </div>
                          </div>
                          
                          {section.instructors && section.instructors.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Instructors:</h5>
                              <div className="flex flex-wrap gap-2">
                                {section.instructors.map((instructor, idx) => (
                                  <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                    {instructor.name}
                                  </span>
                                ))}
                              </div>
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
              disabled={loading || courseData.sections.length === 0}
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
                    <span className="text-sm font-medium text-gray-700">Total Sections</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{courseData.sections.length}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Award className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Total Lessons</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{totalLessons}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-purple-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Total Instructors</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{totalInstructors}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-orange-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Duration</span>
                  </div>
                  <span className="text-lg font-bold text-orange-600">{courseData.duration || 0} days</span>
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
                
                <div className={`flex items-center ${courseData.sections.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-3 h-3 rounded-full mr-3 ${courseData.sections.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  At least one section
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