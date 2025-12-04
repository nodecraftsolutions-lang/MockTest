import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  Save, 
  ArrowLeft, 
  Target, 
  FileText, 
  DollarSign,
  Clock,
  Users,
  Award,
  Shield,
  Info,
  Building,
  Eye
} from "lucide-react";
import api from "../../../api/axios";
import { useToast } from "../../../context/ToastContext";

const TestCreation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState(null);
  const [activeSection, setActiveSection] = useState("basic");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    companyId: searchParams.get('companyId') || "",
    type: "free",
    price: 0,
    currency: "INR",
    duration: 30,
    sections: [
      {
        sectionName: "Aptitude",
        questionCount: 10,
        duration: 10,
        marksPerQuestion: 1,
        negativeMarking: 0.25
      }
    ]
  });

  useEffect(() => {
    fetchCompanies();
    
    // If companyId is in URL, set it in form
    const companyIdFromUrl = searchParams.get('companyId');
    if (companyIdFromUrl) {
      setFormData(prev => ({
        ...prev,
        companyId: companyIdFromUrl
      }));
    }
  }, [searchParams]);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      if (response.data.success) {
        setCompanies(response.data.data.companies || []);
      }
    } catch (error) {
      showError('Failed to load companies');
    }
  };

  // Handle basic input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'duration' ? Number(value) : value
    }));
  };

  // Handle section change
  const handleSectionChange = (index, field, value) => {
    const updated = [...formData.sections];
    updated[index][field] = field === 'sectionName' ? value : Number(value);
    setFormData({ ...formData, sections: updated });
  };

  // Add section
  const addSection = () => {
    setFormData({
      ...formData,
      sections: [
        ...formData.sections,
        {
          sectionName: "New Section",
          questionCount: 10,
          duration: 10,
          marksPerQuestion: 1,
          negativeMarking: 0.25
        }
      ]
    });
  };

  // Remove section
  const removeSection = (index) => {
    if (formData.sections.length > 1) {
      const updated = [...formData.sections];
      updated.splice(index, 1);
      setFormData({ ...formData, sections: updated });
    }
  };

  const calculateTotals = () => {
    const totalQuestions = formData.sections.reduce((sum, section) => sum + section.questionCount, 0);
    const totalMarks = formData.sections.reduce((sum, section) => sum + (section.questionCount * section.marksPerQuestion), 0);
    const totalDuration = formData.sections.reduce((sum, section) => sum + section.duration, 0);
    
    return { totalQuestions, totalMarks, totalDuration };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponseMsg(null);

    try {
      const res = await api.post("/tests", formData);
      if (res.data.success) {
        showSuccess("✅ Test created successfully");
        setResponseMsg({
          type: "success",
          text: "Test created successfully!",
          testId: res.data.data.test._id
        });
        
        // Navigate to question management after 1.5 seconds
        setTimeout(() => {
          navigate(`/admin/mocktest/questions/${res.data.data.test._id}`);
        }, 1500);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "❌ Failed to create test";
      showError(errorMsg);
      setResponseMsg({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const { totalQuestions, totalMarks, totalDuration } = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Test</h1>
              <p className="text-gray-600 mt-1">Set up test details and sections for company</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mb-8">
            {["basic", "sections", "review"].map((step, index) => (
              <button
                key={step}
                onClick={() => setActiveSection(step)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeSection === step
                    ? "bg-white shadow-md border border-blue-200 text-blue-700"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  activeSection === step 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {index + 1}
                </div>
                <span className="capitalize">{step}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              {activeSection === "basic" && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Basic Information
                    </h2>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Test Title *
                        </label>
                        <input
                          type="text"
                          name="title"
                          placeholder="e.g., Delta X Full Mock Test"
                          value={formData.title}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description *
                        </label>
                        <textarea
                          name="description"
                          placeholder="Describe the test content and purpose..."
                          value={formData.description}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Company *
                        </label>
                        <select
                          name="companyId"
                          value={formData.companyId}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        >
                          <option value="">Select a company</option>
                          {companies.map((company) => (
                            <option key={company._id} value={company._id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                        
                        {/* Show company sections when a company is selected */}
                        {formData.companyId && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            {(() => {
                              const selectedCompany = companies.find(company => company._id === formData.companyId);
                              if (!selectedCompany) return null;
                              
                              // Calculate totals for the company pattern
                              const { totalQuestions, totalDuration } = selectedCompany.defaultPattern?.reduce((totals, section) => ({
                                totalQuestions: totals.totalQuestions + (section.questionCount || 0),
                                totalDuration: totals.totalDuration + (section.duration || 0)
                              }), { totalQuestions: 0, totalDuration: 0 }) || { totalQuestions: 0, totalDuration: 0 };
                              
                              return (
                                <>
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium text-blue-800">Company Information:</h4>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {selectedCompany.category}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                    <span>{selectedCompany.difficulty}</span>
                                    <span>•</span>
                                    <span>{totalQuestions} questions</span>
                                    <span>•</span>
                                    <span>{totalDuration} min</span>
                                  </div>
                                  
                                  <h4 className="text-sm font-medium text-blue-800 mb-2">Company Sections:</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedCompany.defaultPattern?.map((section, index) => (
                                      <span 
                                        key={index} 
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                      >
                                        {section.sectionName} ({section.questionCount} Qs, {section.duration} min)
                                      </span>
                                    )) || <span className="text-xs text-blue-600">No sections available</span>}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Test Type *
                        </label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="free">Free</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>

                      {formData.type === "paid" && (
                        <>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Price *
                            </label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                              <input
                                type="number"
                                name="price"
                                min="0"
                                placeholder="0"
                                value={formData.price}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Currency *
                            </label>
                            <select
                              name="currency"
                              value={formData.currency}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                              <option value="INR">INR</option>
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                            </select>
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Total Duration (min) *
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            name="duration"
                            min="1"
                            placeholder="30"
                            value={formData.duration}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sections Configuration */}
              {activeSection === "sections" && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Test Sections Configuration
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-gray-600">Configure test sections and scoring</p>
                      <button
                        type="button"
                        onClick={addSection}
                        className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Section
                      </button>
                    </div>

                    <div className="space-y-6">
                      {formData.sections.map((section, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50/50">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
                              Section {index + 1}
                            </h3>
                            {formData.sections.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSection(index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Section Name *
                              </label>
                              <input
                                type="text"
                                value={section.sectionName}
                                onChange={(e) => handleSectionChange(index, 'sectionName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Aptitude"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Questions *
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={section.questionCount}
                                onChange={(e) => handleSectionChange(index, 'questionCount', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (min) *
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={section.duration}
                                onChange={(e) => handleSectionChange(index, 'duration', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Marks per Question
                              </label>
                              <input
                                type="number"
                                min="0.25"
                                step="0.25"
                                value={section.marksPerQuestion}
                                onChange={(e) => handleSectionChange(index, 'marksPerQuestion', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Negative Marking
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                value={section.negativeMarking}
                                onChange={(e) => handleSectionChange(index, 'negativeMarking', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Review & Submit */}
              {activeSection === "review" && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <Eye className="w-5 h-5 mr-2" />
                      Review & Submit
                    </h2>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <h3 className="text-lg font-semibold text-blue-900 mb-3">Test Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
                            <div className="text-sm text-blue-800">Total Questions</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{totalMarks}</div>
                            <div className="text-sm text-green-800">Total Marks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{totalDuration}</div>
                            <div className="text-sm text-purple-800">Section Duration</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{formData.duration}</div>
                            <div className="text-sm text-orange-800">Total Duration</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Test Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Title:</span>
                            <span className="font-medium">{formData.title || "Not set"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span className={`font-medium ${formData.type === 'paid' ? 'text-green-600' : 'text-blue-600'}`}>
                              {formData.type.toUpperCase()}
                            </span>
                          </div>
                          {formData.type === 'paid' && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Price:</span>
                              <span className="font-medium text-green-600">
                                {formData.currency} {formData.price}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Sections</h4>
                        <div className="space-y-2">
                          {formData.sections.map((section, index) => (
                            <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                              <span className="font-medium">{section.sectionName}</span>
                              <span>{section.questionCount} Q</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={() => {
                    const steps = ["basic", "sections", "review"];
                    const currentIndex = steps.indexOf(activeSection);
                    if (currentIndex > 0) setActiveSection(steps[currentIndex - 1]);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center"
                  disabled={activeSection === "basic"}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>

                {activeSection !== "review" ? (
                  <button
                    type="button"
                    onClick={() => {
                      const steps = ["basic", "sections", "review"];
                      const currentIndex = steps.indexOf(activeSection);
                      if (currentIndex < steps.length - 1) setActiveSection(steps[currentIndex + 1]);
                    }}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {loading ? "Creating Test..." : "Create Test"}
                  </button>
                )}
              </div>
            </form>

            {responseMsg && (
              <div
                className={`mt-6 p-4 rounded-xl border ${
                  responseMsg.type === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-center">
                  {responseMsg.type === "success" ? (
                    <Award className="w-5 h-5 mr-2" />
                  ) : (
                    <Shield className="w-5 h-5 mr-2" />
                  )}
                  {responseMsg.text}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-blue-500" />
                Test Preview
              </h3>
              
              <div className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">{formData.title || "Test Title"}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {formData.description || "Test description will appear here"}
                  </p>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full border ${
                    formData.type === 'paid' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-blue-100 text-blue-800 border-blue-200'
                  }`}>
                    {formData.type === 'paid' ? `PAID - ${formData.currency} ${formData.price}` : 'FREE'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Questions:</span>
                    <span className="font-semibold">{totalQuestions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Marks:</span>
                    <span className="font-semibold">{totalMarks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Duration:</span>
                    <span className="font-semibold">{formData.duration} min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sections:</span>
                    <span className="font-semibold">{formData.sections.length}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Section Breakdown:</h5>
                  <div className="space-y-2">
                    {formData.sections.map((section, index) => (
                      <div key={index} className="flex justify-between text-xs bg-gray-50 p-2 rounded">
                        <span className="font-medium">{section.sectionName}</span>
                        <div className="text-right">
                          <div>{section.questionCount} Q</div>
                          <div className="text-gray-500">{section.duration} min</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCreation;