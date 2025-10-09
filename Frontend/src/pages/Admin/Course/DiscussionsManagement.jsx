import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Trash2, 
  Search, 
  Filter, 
  User, 
  BookOpen, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Send,
  Reply,
  ArrowRight
} from "lucide-react";
import api from "../../../api/axios";
import { useToast } from "../../../context/ToastContext";
import LoadingSpinner from "../../../components/LoadingSpinner";

const DiscussionsManagement = () => {
  const { showSuccess, showError } = useToast();
  const [discussions, setDiscussions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [replying, setReplying] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDiscussions, setTotalDiscussions] = useState(0);

  useEffect(() => {
    fetchCourses();
    fetchDiscussions();
  }, [currentPage, filterCourse]);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses");
      if (res.data.success) {
        setCourses(res.data.data || []);
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
      showError("Failed to load courses");
    }
  };

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/courses/discussions/all?page=${currentPage}&limit=20${filterCourse !== "all" ? `&courseId=${filterCourse}` : ""}`);
      if (res.data.success) {
        setDiscussions(res.data.data.messages || []);
        setTotalPages(res.data.data.pagination.pages || 1);
        setTotalDiscussions(res.data.data.pagination.total || 0);
      }
    } catch (error) {
      console.error("Failed to load discussions:", error);
      showError("Failed to load discussions");
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteDiscussion = async (discussionId) => {
    if (!window.confirm("Are you sure you want to delete this discussion?\n\nThis action cannot be undone.")) {
      return;
    }

    setDeleting(discussionId);
    try {
      const res = await api.delete(`/courses/discussions/${discussionId}`);
      if (res.data.success) {
        showSuccess("Discussion deleted successfully");
        fetchDiscussions(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to delete discussion:", error);
      showError("Failed to delete discussion: " + (error.response?.data?.message || "Unknown error"));
    } finally {
      setDeleting(null);
    }
  };

  const deleteReply = async (discussionId, replyId) => {
    if (!window.confirm("Are you sure you want to delete this reply?\n\nThis action cannot be undone.")) {
      return;
    }

    setDeleting(replyId);
    try {
      const res = await api.delete(`/courses/discussions/${discussionId}/reply/${replyId}`);
      if (res.data.success) {
        showSuccess("Reply deleted successfully");
        // Refresh discussions to reflect the deleted reply
        fetchDiscussions();
      }
    } catch (error) {
      console.error("Failed to delete reply:", error);
      showError("Failed to delete reply: " + (error.response?.data?.message || "Unknown error"));
    } finally {
      setDeleting(null);
    }
  };

  const handleReplyChange = (discussionId, text) => {
    setReplyText(prev => ({
      ...prev,
      [discussionId]: text
    }));
  };

  const submitReply = async (discussionId) => {
    const text = replyText[discussionId];
    if (!text || text.trim() === "") {
      showError("Please enter a reply message");
      return;
    }

    setReplying(discussionId);
    try {
      const res = await api.post(`/courses/discussions/${discussionId}/reply`, { message: text.trim() });
      if (res.data.success) {
        showSuccess("Reply added successfully");
        // Clear the reply text
        setReplyText(prev => ({
          ...prev,
          [discussionId]: ""
        }));
        // Refresh discussions to show the new reply
        fetchDiscussions();
      }
    } catch (error) {
      console.error("Failed to add reply:", error);
      showError("Failed to add reply: " + (error.response?.data?.message || "Unknown error"));
    } finally {
      setReplying(null);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const filteredDiscussions = discussions.filter(discussion => {
    const matchesSearch = discussion.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (discussion.studentId?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (discussion.courseId?.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         discussion.replies.some(reply => 
                           reply.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (reply.userId?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
                         );
    return matchesSearch;
  });

  const getCourseName = (courseId) => {
    const course = courses.find(c => c._id === courseId);
    return course ? course.title : "Unknown Course";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <MessageSquare className="w-8 h-8 mr-3 text-blue-600" />
                Student Discussions
              </h1>
              <p className="text-gray-600 mt-2">Monitor, reply to, and manage all student discussions across courses</p>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <div className="flex items-center text-blue-800">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">{totalDiscussions} Total Discussions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Admin Guidance</h3>
              <p className="text-sm text-yellow-700 mt-1">
                This page shows all student discussions across all courses. You can monitor conversations, 
                search for specific topics, reply to student questions, and remove inappropriate content. 
                Discussions are sorted by most recent first.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by message, student, course, or reply..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={filterCourse}
              onChange={(e) => {
                setFilterCourse(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
            
            <div className="flex items-center justify-end">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </div>
        </div>

        {/* Discussions List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : filteredDiscussions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No discussions found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm || filterCourse !== "all" 
                  ? "Try adjusting your search or filter criteria to find discussions." 
                  : "No student discussions have been posted yet. Check back later."}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {filteredDiscussions.map((discussion) => (
                  <div key={discussion._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center flex-wrap">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {discussion.studentId?.name || "Unknown Student"}
                              </h4>
                              <span className="mx-2 text-gray-300 hidden sm:inline">•</span>
                              <span className="text-sm text-gray-500 break-all">
                                {discussion.studentId?.email || "No email provided"}
                              </span>
                            </div>
                            <div className="flex items-center flex-wrap mt-2">
                              <div className="flex items-center bg-blue-50 px-2 py-1 rounded-full mr-3 mb-1">
                                <BookOpen className="w-4 h-4 text-blue-600 mr-1" />
                                <span className="text-sm font-medium text-blue-800">
                                  {getCourseName(discussion.courseId?._id || discussion.courseId)}
                                </span>
                              </div>
                              <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full mb-1">
                                <Calendar className="w-4 h-4 text-gray-600 mr-1" />
                                <span className="text-sm text-gray-700">
                                  {new Date(discussion.createdAt).toLocaleDateString()} at {new Date(discussion.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => deleteDiscussion(discussion._id)}
                            disabled={deleting === discussion._id}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-2"
                            title="Delete discussion"
                          >
                            {deleting === discussion._id ? (
                              <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        
                        <div className="mt-4">
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="text-gray-800 whitespace-pre-wrap">{discussion.message}</p>
                          </div>
                        </div>

                        {/* Replies Section */}
                        {discussion.replies && discussion.replies.length > 0 && (
                          <div className="mt-4 space-y-3">
                            {discussion.replies.map((reply, index) => (
                              <div key={index} className="flex items-start ml-4">
                                <div className="flex-shrink-0 mr-3 mt-1">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    reply.userType === "Admin" 
                                      ? "bg-purple-100" 
                                      : "bg-green-100"
                                  }`}>
                                    <Reply className={`w-4 h-4 ${
                                      reply.userType === "Admin" 
                                        ? "text-purple-600" 
                                        : "text-green-600"
                                    }`} />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                                    <div className="flex items-center">
                                      <span className={`text-sm font-medium ${
                                        reply.userType === "Admin" 
                                          ? "text-purple-700" 
                                          : "text-green-700"
                                      }`}>
                                        {reply.userId?.name || "Unknown User"} 
                                        {reply.userType === "Admin" && (
                                          <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded">
                                            Admin
                                          </span>
                                        )}
                                      </span>
                                      <span className="mx-2 text-gray-300">•</span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(reply.createdAt).toLocaleDateString()} at {new Date(reply.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                      <button
                                        onClick={() => deleteReply(discussion._id, reply._id)}
                                        disabled={deleting === reply._id}
                                        className="ml-2 p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                                        title="Delete reply"
                                      >
                                        {deleting === reply._id ? (
                                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                          <Trash2 className="w-4 h-4" />
                                        )}
                                      </button>
                                    </div>
                                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{reply.message}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Form */}
                        <div className="mt-4 flex items-start ml-4">
                          <div className="flex-shrink-0 mr-3 mt-1">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <Send className="w-4 h-4 text-purple-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex">
                              <input
                                type="text"
                                value={replyText[discussion._id] || ""}
                                onChange={(e) => handleReplyChange(discussion._id, e.target.value)}
                                placeholder="Type your reply..."
                                className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    submitReply(discussion._id);
                                  }
                                }}
                              />
                              <button
                                onClick={() => submitReply(discussion._id)}
                                disabled={replying === discussion._id || !replyText[discussion._id]?.trim()}
                                className={`px-4 py-2 rounded-r-lg flex items-center ${
                                  replying === discussion._id || !replyText[discussion._id]?.trim()
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-purple-600 text-white hover:bg-purple-700"
                                }`}
                              >
                                {replying === discussion._id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <>
                                    <Send className="w-4 h-4 mr-1" />
                                    Reply
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{Math.min(filteredDiscussions.length, 20)} </span> 
                    of <span className="font-medium">{totalDiscussions}</span> discussions
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                        currentPage === 1 
                          ? "text-gray-400 cursor-not-allowed" 
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </button>
                    
                    <div className="flex items-center px-3 py-1 text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                        currentPage === totalPages 
                          ? "text-gray-400 cursor-not-allowed" 
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscussionsManagement;