import { useState, useEffect } from "react";
import { 
  BookOpen, 
  Clock, 
  Users, 
  DollarSign, 
  Calendar,
  Star,
  Play,
  BarChart3,
  Filter,
  Search,
  Award,
  Video,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import api from "../../../api/axios";
import { useToast } from "../../../context/ToastContext";

const CoursesList = () => {
  const { showError } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [expandedCourse, setExpandedCourse] = useState(null);

  // Fetch all courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get("/courses");
        setCourses(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        showError("Failed to load courses");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [showError]);

  // Get unique categories for filter
  const categories = [...new Set(courses.map(course => course.category))];
  const levels = [...new Set(courses.map(course => course.level || "Beginner"))];

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || course.category === filterCategory;
    const matchesLevel = filterLevel === "all" || (course.level || "Beginner") === filterLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  // Calculate course stats
  const courseStats = {
    total: courses.length,
    totalLessons: courses.reduce((sum, course) => 
      sum + (course.sections?.reduce((secSum, section) => secSum + (section.lessonsCount || 0), 0) || 0), 0
    ),
    totalInstructors: courses.reduce((sum, course) => 
      sum + (course.sections?.reduce((secSum, section) => secSum + (section.instructors?.length || 0), 0) || 0), 0
    ),
    paidCourses: courses.filter(course => course.isPaid).length,
    freeCourses: courses.filter(course => !course.isPaid).length,
  };

  // Toggle course expansion
  const toggleCourseExpansion = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate total lessons for a course
  const getTotalLessons = (course) => {
    return course.sections?.reduce((sum, section) => sum + (section.lessonsCount || 0), 0) || 0;
  };

  // Calculate total instructors for a course
  const getTotalInstructors = (course) => {
    const instructorSet = new Set();
    course.sections?.forEach(section => {
      section.instructors?.forEach(instructor => {
        instructorSet.add(instructor.name);
      });
    });
    return instructorSet.size;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            All Courses
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover comprehensive training programs designed for your career growth
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <div className="relative">
                    <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Level Filter */}
                <div>
                  <div className="relative">
                    <Award className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    >
                      <option value="all">All Levels</option>
                      {levels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
                <span>
                  Showing {filteredCourses.length} of {courses.length} courses
                </span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>

            {/* Courses Grid */}
            <div className="space-y-6">
              {filteredCourses.map((course) => (
                <div key={course._id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  
                  {/* Course Header */}
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleCourseExpansion(course._id)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <h2 className="text-2xl font-bold text-gray-900 pr-4">
                            {course.title}
                          </h2>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {course.isPaid ? (
                              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />
                                {course.price} {course.currency}
                              </span>
                            ) : (
                              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                Free
                              </span>
                            )}
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                              {course.level || "Beginner"}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-600 text-xs mb-4" style={{ whiteSpace: 'pre-line', fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: course.description?.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-lg">$1</strong>') || '' }} />

                        {/* Course Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
                            {getTotalLessons(course)} lessons
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Users className="w-4 h-4 mr-2 text-green-600" />
                            {getTotalInstructors(course)} instructors
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock className="w-4 h-4 mr-2 text-purple-600" />
                            {course.duration} days
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 text-orange-600" />
                            Starts {formatDate(course.startDate)}
                          </div>
                        </div>

                        {/* Outcomes & Features */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          {course.outcomes?.slice(0, 3).map((outcome, index) => (
                            <span key={index} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
                              {outcome}
                            </span>
                          ))}
                          {course.features?.slice(0, 2).map((feature, index) => (
                            <span key={index} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Expand Button */}
                      <div className="flex-shrink-0">
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          {expandedCourse === course._id ? (
                            <ChevronUp className="w-6 h-6" />
                          ) : (
                            <ChevronDown className="w-6 h-6" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedCourse === course._id && (
                    <div className="border-t border-gray-200">
                      
                      {/* Full Outcomes & Features */}
                      <div className="p-6 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <Award className="w-5 h-5 mr-2 text-green-600" />
                              Learning Outcomes
                            </h3>
                            <ul className="space-y-2">
                              {course.outcomes?.map((outcome, index) => (
                                <li key={index} className="flex items-start text-sm text-gray-600">
                                  <Star className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {outcome}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <Video className="w-5 h-5 mr-2 text-blue-600" />
                              Course Features
                            </h3>
                            <ul className="space-y-2">
                              {course.features?.map((feature, index) => (
                                <li key={index} className="flex items-start text-sm text-gray-600">
                                  <Play className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Course Sections */}
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Course Curriculum</h3>
                        <div className="space-y-4">
                          {course.sections?.map((section, index) => (
                            <div key={section._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900 text-lg">
                                    Week {index + 1} – {section.title}
                                  </h4>
                                  <p className="text-gray-600 mt-2 text-xs" style={{ whiteSpace: 'pre-line', fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: section.description?.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-lg">$1</strong>') || '' }} />
                                </div>
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                                  <FileText className="w-4 h-4 mr-1" />
                                  {section.lessonsCount} lessons
                                </span>
                              </div>

                              {/* Instructors */}
                              {section.instructors && section.instructors.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">Instructors:</h5>
                                  <div className="flex flex-wrap gap-3">
                                    {section.instructors.map((instructor, idx) => (
                                      <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                                        {instructor.photoUrl && !instructor.photoUrl.includes('RAT To GOAT') ? (
                                          <img 
                                            src={instructor.photoUrl} 
                                            alt={instructor.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                            {instructor.name.charAt(0)}
                                          </div>
                                        )}
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">{instructor.name}</div>
                                          <div className="text-xs text-gray-500">{instructor.expertise}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Empty State */}
              {filteredCourses.length === 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filterCategory !== "all" || filterLevel !== "all" 
                      ? "Try adjusting your search or filters"
                      : "No courses available at the moment"
                    }
                  </p>
                  {(searchTerm || filterCategory !== "all" || filterLevel !== "all") && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilterCategory("all");
                        setFilterLevel("all");
                      }}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Course Stats */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                Course Statistics
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <BookOpen className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Total Courses</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{courseStats.total}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Total Lessons</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{courseStats.totalLessons}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-purple-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Total Instructors</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{courseStats.totalInstructors}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <DollarSign className="w-6 h-6 mx-auto mb-1 text-orange-600" />
                    <div className="font-semibold">{courseStats.paidCourses}</div>
                    <div className="text-gray-600 text-xs">Paid</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <BookOpen className="w-6 h-6 mx-auto mb-1 text-green-600" />
                    <div className="font-semibold">{courseStats.freeCourses}</div>
                    <div className="text-gray-600 text-xs">Free</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => setFilterCategory("all")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    filterCategory === "all" 
                      ? "bg-blue-100 text-blue-700 font-medium" 
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  All Categories ({courses.length})
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setFilterCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      filterCategory === category 
                        ? "bg-blue-100 text-blue-700 font-medium" 
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {category} ({courses.filter(c => c.category === category).length})
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="w-full flex items-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Search className="w-4 h-4 mr-3" />
                  Search Courses
                </button>
                
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterCategory("all");
                    setFilterLevel("all");
                  }}
                  className="w-full flex items-center px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Filter className="w-4 h-4 mr-3" />
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesList;