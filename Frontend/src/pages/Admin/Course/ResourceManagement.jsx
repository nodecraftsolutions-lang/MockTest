import { useEffect, useState, useCallback } from "react";
import api from "../../../api/axios";
import { useToast } from "../../../context/ToastContext";

const ResourceManagement = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ title: "", link: "" });
  const [editingId, setEditingId] = useState(null);
  const { showToast } = useToast();

  // ✅ Fetch all courses for dropdown
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/courses");
      setCourses(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      showToast("Failed to load courses", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // ✅ Fetch resources for selected course - Fixed to handle consistent API response structure
  const fetchResources = useCallback(async (courseId) => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await api.get(`/courses/${courseId}/resources`);
      
      // Assuming consistent structure: res.data.data for array, fallback to res.data
      setResources(res.data.data || res.data || []);
    } catch (err) {
      console.error("Failed to fetch resources:", err);
      setResources([]);
      showToast("Failed to load resources", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (selectedCourse) {
      fetchResources(selectedCourse);
    } else {
      setResources([]);
    }
  }, [selectedCourse, fetchResources]);

  // ✅ Handle input change
  const handleChange = useCallback((e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  }, [form]);

  // ✅ Reset form state
  const resetForm = useCallback(() => {
    setForm({ title: "", link: "" });
    setEditingId(null);
    setFormLoading(false);
  }, []);

  // ✅ Add or Update Resource - Enhanced with better loading and error handling
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedCourse) {
      showToast("Please select a course first", "error");
      return;
    }
    if (!form.title.trim() || !form.link.trim()) {
      showToast("Please fill in all fields", "error");
      return;
    }

    setFormLoading(true);
    try {
      if (editingId) {
        await api.put(`/courses/${selectedCourse}/resources/${editingId}`, form);
        window.location.reload();
        showToast("Resource updated successfully", "success");
      } else {
        await api.post(`/courses/${selectedCourse}/resources`, form);
        window.location.reload();
        showToast("Resource added successfully", "success");
      }

      resetForm();
      // Force refresh to ensure UI sync
      await fetchResources(selectedCourse);
    } catch (err) {
      console.error("Error saving resource:", err);
      showToast("Error saving resource", "error");
      // Fallback refresh even on error to sync state
      await fetchResources(selectedCourse);
    } finally {
      setFormLoading(false);
    }
  }, [selectedCourse, form, editingId, showToast, resetForm, fetchResources]);

  // ✅ Delete resource - Enhanced with confirmation and better error handling
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return window.location.reload();
    if (!selectedCourse) return window.location.reload();

    setFormLoading(true);
    try {
      await api.delete(`/courses/${selectedCourse}/resources/${id}`);
      window.location.reload();
      showToast("Resource deleted successfully", "success");
      // Force refresh to ensure UI sync
      await fetchResources(selectedCourse);
    } catch (err) {
      console.error("Error deleting resource:", err);
      showToast("Error deleting resource", "error");
      // Fallback refresh even on error to sync state
      await fetchResources(selectedCourse);
    } finally {
      setFormLoading(false);
    }
  }, [selectedCourse, showToast, fetchResources]);

  // ✅ Edit resource
  const handleEdit = useCallback((resource) => {
    setForm({ title: resource.title || "", link: resource.link || "" });
    setEditingId(resource._id);
    // ✅ Scroll to form for better UX
    setTimeout(() => {
      document.getElementById('resource-form')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  }, []);

  // ✅ Cancel editing
  const handleCancel = useCallback(() => {
    resetForm();
  }, [resetForm]);

  // ✅ Refresh resources manually
  const handleRefresh = useCallback(() => {
    if (selectedCourse) {
      fetchResources(selectedCourse);
      showToast("Resources refreshed", "info");
    } else {
      showToast("Please select a course first", "warning");
    }
  }, [selectedCourse, fetchResources, showToast]);

  // ✅ Handle course selection change
  const handleCourseChange = useCallback((e) => {
    const value = e.target.value;
    setSelectedCourse(value);
    if (value) {
      // Reset form when switching courses
      resetForm();
    }
  }, [resetForm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Manage Course Resources</h1>
          <p className="text-gray-600">Manage learning resources for your courses</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Course Selection & Form */}
          <div className="lg:col-span-1 space-y-6">
            {/* Course Selection Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Select Course</h2>
                </div>
                
                {selectedCourse && (
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh Resources"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </div>
              
              <select
                value={selectedCourse}
                onChange={handleCourseChange}
                disabled={loading}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Choose a Course --</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>

              {loading && (
                <div className="flex items-center justify-center mt-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading courses...</span>
                </div>
              )}

              {selectedCourse && !loading && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm font-medium">
                    ✓ Course selected. You can now manage resources.
                  </p>
                </div>
              )}
            </div>

            {/* Resource Form Card */}
            {selectedCourse && (
              <div id="resource-form" className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingId ? "Edit Resource" : "Add New Resource"}
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resource Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="Enter resource title"
                      required
                      disabled={formLoading}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resource Link
                    </label>
                    <input
                      type="url"
                      name="link"
                      value={form.link}
                      onChange={handleChange}
                      placeholder="https://example.com/resource"
                      required
                      disabled={formLoading}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {formLoading ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </span>
                      ) : editingId ? (
                        <span className="flex items-center justify-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Update Resource
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Resource
                        </span>
                      )}
                    </button>
                    
                    {editingId && (
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={formLoading}
                        className="px-4 bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Content - Resource List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Course Resources</h2>
                    <p className="text-gray-600 text-sm">
                      {selectedCourse 
                        ? `${resources.length} resource${resources.length !== 1 ? 's' : ''} available`
                        : "Select a course to view resources"
                      }
                    </p>
                  </div>
                </div>
                
                {selectedCourse && resources.length > 0 && (
                  <button
                    onClick={handleRefresh}
                    disabled={loading || formLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>
                )}
              </div>

              {!selectedCourse ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Course Selected</h3>
                  <p className="text-gray-500">Please select a course from the dropdown to manage resources</p>
                </div>
              ) : loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  <span className="ml-4 text-gray-600">Loading resources...</span>
                </div>
              ) : resources.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Resources Yet</h3>
                  <p className="text-gray-500 mb-4">Start by adding your first resource using the form</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {resources.map((res, index) => (
                    <div
                      key={res._id}
                      className="border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-md transition-all duration-200 bg-white"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                            </div>
                            <h3 className="font-bold text-gray-800 text-lg">{res.title}</h3>
                          </div>
                          
                          <a
                            href={res.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 ml-11"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            {res.link.length > 50 ? `${res.link.substring(0, 50)}...` : res.link}
                          </a>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(res)}
                            disabled={formLoading}
                            className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transform hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            title="Edit Resource"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={() => handleDelete(res._id)}
                            disabled={formLoading}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transform hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            title="Delete Resource"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceManagement;