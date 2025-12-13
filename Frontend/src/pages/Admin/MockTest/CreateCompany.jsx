import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Trash2, 
  Building, 
  Upload, 
  Save, 
  ArrowLeft, 
  Target, 
  FileText, 
  BarChart3, 
  Settings, 
  Award, 
  Shield, 
  Info 
} from "lucide-react";
import api from "../../../api/axios";
import { useToast } from "../../../context/ToastContext";
import DescriptionEditor from "../../../components/DescriptionEditor";

const CreateCompany = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    logoUrl: "",
    description: "",
    descriptionHtml: "",
    descriptionImageUrl: "",
    descriptionImageWidth: 100,
    descriptionImageHeight: 300,
    descriptionImageAlign: "left",
    category: "IT Services",
    difficulty: "Medium",
    defaultPattern: [
      {
        sectionName: "Aptitude",
        questionCount: 15,
        duration: 25,
        marksPerQuestion: 1,
        negativeMarking: 0.25,
      },
    ],
    metadata: {
      cutoffPercentage: 60,
      passingCriteria: "Overall percentage",
      instructions: [
        "No negative marking unless mentioned",
        "No gadgets allowed",
      ],
    },
  });

  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState(null);
  const [activeSection, setActiveSection] = useState("basic");
  const [uploadingDescriptionImage, setUploadingDescriptionImage] = useState(false);

  // Handle basic input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle section change
  const handleSectionChange = (index, field, value) => {
    const updated = [...formData.defaultPattern];
    updated[index][field] = field === 'sectionName' ? value : Number(value);
    setFormData({ ...formData, defaultPattern: updated });
  };

  // Add section
  const addSection = () => {
    setFormData({
      ...formData,
      defaultPattern: [
        ...formData.defaultPattern,
        {
          sectionName: "New Section",
          questionCount: 10,
          duration: 20,
          marksPerQuestion: 1,
          negativeMarking: 0,
        },
      ],
    });
  };

  // Remove section
  const removeSection = (index) => {
    if (formData.defaultPattern.length > 1) {
      const updated = [...formData.defaultPattern];
      updated.splice(index, 1);
      setFormData({ ...formData, defaultPattern: updated });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponseMsg(null);

    try {
      const res = await api.post("/companies", formData);
      if (res.data.success) {
        showSuccess("✅ Company created successfully");
        setResponseMsg({
          type: "success",
          text: "Company created successfully!",
        });
        
        // Reset form
        setFormData({
          name: "",
          logoUrl: "",
          description: "",
          descriptionHtml: "",
          descriptionImageUrl: "",
          descriptionImageWidth: 100,
          descriptionImageHeight: 300,
          descriptionImageAlign: "left",
          category: "IT Services",
          difficulty: "Medium",
          defaultPattern: [
            {
              sectionName: "Aptitude",
              questionCount: 15,
              duration: 25,
              marksPerQuestion: 1,
              negativeMarking: 0.25,
            },
          ],
          metadata: {
            cutoffPercentage: 60,
            passingCriteria: "Overall percentage",
            instructions: [
              "No negative marking unless mentioned",
              "No gadgets allowed",
            ],
          },
        });
        setActiveSection("basic");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "❌ Failed to create company";
      showError(errorMsg);
      setResponseMsg({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800 border-green-200";
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Hard": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

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
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Company</h1>
              <p className="text-gray-600 mt-1">Set up company profile and test patterns</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mb-8">
            {["basic", "pattern", "settings"].map((step, index) => (
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
                      <Building className="w-5 h-5 mr-2" />
                      Basic Information
                    </h2>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          placeholder="e.g., Delta X"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Logo URL
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="logoUrl"
                            placeholder="https://example.com/logo.png"
                            value={formData.logoUrl}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                          <Upload className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="IT Services">IT Services</option>
                          <option value="Product">Product</option>
                          <option value="Consulting">Consulting</option>
                          <option value="Banking">Banking</option>
                          <option value="Government">Government</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Difficulty Level
                        </label>
                        <select
                          name="difficulty"
                          value={formData.difficulty}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    <DescriptionEditor
                      value={formData.descriptionHtml}
                      onChange={(content) => setFormData({ ...formData, descriptionHtml: content })}
                      placeholder="Describe the company and hiring process... Use toolbar for rich formatting, fonts, sizes, colors, and images."
                      label="Company Description"
                      required={true}
                      imageUrl={formData.descriptionImageUrl}
                      imageWidth={formData.descriptionImageWidth}
                      imageHeight={formData.descriptionImageHeight}
                      imageAlign={formData.descriptionImageAlign}
                      onImageUpdate={(imageData) => setFormData({ 
                        ...formData, 
                        descriptionImageUrl: imageData.imageUrl,
                        descriptionImageWidth: imageData.imageWidth,
                        descriptionImageHeight: imageData.imageHeight,
                        descriptionImageAlign: imageData.imageAlign
                      })}
                      uploadingImage={uploadingDescriptionImage}
                      onUploadingChange={setUploadingDescriptionImage}
                    />
                  </div>
                </div>
              )}

              {/* Test Pattern */}
              {activeSection === "pattern" && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Test Pattern Configuration
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-gray-600">Configure sections and question patterns</p>
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
                      {formData.defaultPattern.map((section, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50/50">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              <Target className="w-5 h-5 mr-2 text-blue-500" />
                              Section {index + 1}
                            </h3>
                            {formData.defaultPattern.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSection(index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Section Name
                              </label>
                              <input
                                type="text"
                                value={section.sectionName}
                                onChange={(e) => handleSectionChange(index, 'sectionName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Aptitude"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Questions
                              </label>
                              <input
                                type="number"
                                value={section.questionCount}
                                onChange={(e) => handleSectionChange(index, 'questionCount', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (min)
                              </label>
                              <input
                                type="number"
                                value={section.duration}
                                onChange={(e) => handleSectionChange(index, 'duration', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Marks per Question
                              </label>
                              <input
                                type="number"
                                min="0.25"
                                value={section.marksPerQuestion}
                                onChange={(e) => handleSectionChange(index, 'marksPerQuestion', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Negative Marking
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={section.negativeMarking}
                                onChange={(e) => handleSectionChange(index, 'negativeMarking', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0 for no negative marking"
                              />
                            </div>
                          </div>

                          {/* Info Note */}
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start">
                              <Info className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-blue-700">
                                Questions will be randomly selected from the question bank based on the section name and difficulty level.
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Settings */}
              {activeSection === "settings" && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Test Settings & Metadata
                    </h2>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Cutoff Percentage
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name="cutoffPercentage"
                            placeholder="60"
                            value={formData.metadata.cutoffPercentage}
                            onChange={(e) => setFormData({
                              ...formData,
                              metadata: {
                                ...formData.metadata,
                                cutoffPercentage: parseInt(e.target.value)
                              }
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                          <span className="absolute right-3 top-3.5 text-gray-500">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Passing Criteria
                        </label>
                        <input
                          type="text"
                          name="passingCriteria"
                          placeholder="Overall percentage"
                          value={formData.metadata.passingCriteria}
                          onChange={(e) => setFormData({
                            ...formData,
                            metadata: {
                              ...formData.metadata,
                              passingCriteria: e.target.value
                            }
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Tags Section */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
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
                    const steps = ["basic", "pattern", "settings"];
                    const currentIndex = steps.indexOf(activeSection);
                    if (currentIndex > 0) setActiveSection(steps[currentIndex - 1]);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center"
                  disabled={activeSection === "basic"}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>

                {activeSection !== "settings" ? (
                  <button
                    type="button"
                    onClick={() => {
                      const steps = ["basic", "pattern", "settings"];
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
                    {loading ? "Creating Company..." : "Create Company"}
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
                Preview
              </h3>
              
              <div className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="w-16 h-16 mx-auto mb-2 rounded-lg object-contain" />
                  ) : (
                    <div className="w-16 h-16 mx-auto mb-2 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="w-8 h-8 text-blue-600" />
                    </div>
                  )}
                  <h4 className="font-semibold text-gray-900">{formData.name || "Company Name"}</h4>
                  <p className="text-sm text-gray-600">{formData.category || "Category"}</p>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(formData.difficulty)}`}>
                    {formData.difficulty}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Questions:</span>
                    <span className="font-semibold">
                      {formData.defaultPattern.reduce((sum, section) => sum + section.questionCount, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Duration:</span>
                    <span className="font-semibold">
                      {formData.defaultPattern.reduce((sum, section) => sum + section.duration, 0)} min
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sections:</span>
                    <span className="font-semibold">{formData.defaultPattern.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cutoff:</span>
                    <span className="font-semibold">{formData.metadata.cutoffPercentage}%</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Sections:</h5>
                  <div className="space-y-2">
                    {formData.defaultPattern.map((section, index) => (
                      <div key={index} className="flex justify-between text-xs bg-gray-50 p-2 rounded">
                        <span className="font-medium">{section.sectionName}</span>
                        <span>{section.questionCount} Q • {section.duration} min</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700">
                    <strong>Note:</strong> Questions will be randomly selected from the question bank matching the section and difficulty.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCompany;