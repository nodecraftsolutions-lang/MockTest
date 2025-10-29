import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Upload, 
  Save, 
  ArrowLeft, 
  FileText, 
  Database,
  CheckCircle,
  AlertCircle,
  Building,
  Award,
  Shield,
  Info,
  Download
} from "lucide-react";
import api from "../../../api/axios";
import { useToast } from "../../../context/ToastContext";

const QuestionBankUpload = () => {
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [responseMsg, setResponseMsg] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    companyId: searchParams.get('companyId') || "",
    section: "",
    questionFile: null
  });

  const [uploadHistory, setUploadHistory] = useState([]);
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
    fetchCompanies();
    fetchUploadHistory();
    
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

  const fetchUploadHistory = async () => {
    try {
      const response = await api.get('/question-banks');
      if (response.data.success) {
        setUploadHistory(response.data.data.questionBanks || []);
      }
    } catch (error) {
      // Silently fail for history
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If company changes, reset the section
    if (name === 'companyId') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        section: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        questionFile: file
      }));

      // Preview file info
      setFilePreview({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2), // MB
        type: file.type,
        extension: file.name.split('.').pop().toLowerCase()
      });

      // Validate file type
      const extension = file.name.split('.').pop().toLowerCase();
      if (!['json', 'csv'].includes(extension)) {
        showError('Please upload a valid JSON or CSV file');
        return;
      }

      // For CSV files, show format info
      if (extension === 'csv') {
        showSuccess('CSV file detected. Make sure it follows the required format.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);
    setResponseMsg(null);

    if (!formData.questionFile) {
      showError('Please select a question file');
      setLoading(false);
      return;
    }

    // Validate form
    if (!formData.title || formData.title.length < 3 || formData.title.length > 100) {
      showError('Title must be between 3 and 100 characters');
      setLoading(false);
      return;
    }

    if (!formData.companyId) {
      showError('Please select a company');
      setLoading(false);
      return;
    }

    if (!formData.section) {
      showError('Please select a section');
      setLoading(false);
      return;
    }

    try {
      const uploadData = new FormData();
      uploadData.append('questionFile', formData.questionFile);
      uploadData.append('companyId', formData.companyId);
      uploadData.append('section', formData.section);
      uploadData.append('title', formData.title);
      
      if (formData.description) {
        uploadData.append('description', formData.description);
      }

      const response = await api.post('/question-banks/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        }
      });

      if (response.data.success) {
        showSuccess('✅ Question bank uploaded successfully');
        setResponseMsg({
          type: "success",
          text: response.data.message,
          data: response.data.data
        });
        
        // Reset form
        setFormData({
          title: "",
          description: "",
          companyId: "",
          section: "Aptitude",
          questionFile: null
        });
        setFilePreview(null);
        setUploadProgress(0);
        
        // Refresh history
        fetchUploadHistory();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "❌ Failed to upload question bank";
      showError(errorMsg);
      setResponseMsg({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSampleJSON = () => {
    const sampleQuestions = [
      {
        "questionText": "What is the capital of France?",
        "option1": "London",
        "option2": "Berlin", 
        "option3": "Paris",
        "option4": "Madrid",
        "correctAnswer": "3",
        "explanation": "Paris is the capital city of France.",
        "difficulty": "easy",
        "tags": "geography,capitals",
        "marks": 1,
        "negativeMarks": 0
      },
      {
        "questionText": "Which of the following is not a programming language?",
        "option1": "Python",
        "option2": "Java",
        "option3": "HTML",
        "option4": "C++",
        "correctAnswer": "3",
        "explanation": "HTML is a markup language, not a programming language.",
        "difficulty": "medium",
        "tags": "programming,web",
        "marks": 1,
        "negativeMarks": 0.25
      },
      {
        "questionText": "Which of the following are programming languages? (Select all that apply)",
        "questionType": "multiple",
        "option1": "Python",
        "option2": "HTML",
        "option3": "JavaScript",
        "option4": "CSS",
        "correctAnswer": [1, 3],
        "explanation": "Python and JavaScript are programming languages, while HTML and CSS are markup/styling languages.",
        "difficulty": "medium",
        "tags": "programming,web",
        "marks": 2,
        "negativeMarks": 0.5
      }
    ];

    const blob = new Blob([JSON.stringify(sampleQuestions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-questions.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateSampleCSV = () => {
    const csvContent = `questionText,questionType,option1,option2,option3,option4,correctAnswer,explanation,difficulty,tags,marks,negativeMarks
"What is the capital of France?","","London","Berlin","Paris","Madrid","3","Paris is the capital city of France.","easy","geography,capitals",1,0
"Which of the following is not a programming language?","","Python","Java","HTML","C++","3","HTML is a markup language, not a programming language.","medium","programming,web",1,0.25
"Which of the following are programming languages? (Select all that apply)","multiple","Python","HTML","JavaScript","CSS","1,3","Python and JavaScript are programming languages, while HTML and CSS are markup/styling languages.","medium","programming,web",2,0.5
"What does CPU stand for?","","Central Processing Unit","Computer Personal Unit","Central Processor Unit","Central Process Unit","1","CPU stands for Central Processing Unit.","easy","computer,hardware",1,0`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-questions.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Default section options if no company selected or company has no sections
  const defaultSectionOptions = [
    "Aptitude",
    "Reasoning", 
    "Technical",
    "English",
    "General Knowledge",
    "Programming"
  ];

  // Get company sections based on selected company
  const getCompanySections = (companyId) => {
    const company = companies.find(c => c._id === companyId);
    if (company && company.defaultPattern) {
      return company.defaultPattern.map(section => section.sectionName);
    }
    return [];
  };

  // Get available sections for the selected company
  const availableSections = formData.companyId 
    ? getCompanySections(formData.companyId)
    : defaultSectionOptions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Upload Question Bank</h1>
              <p className="text-gray-600 mt-1">Upload questions in JSON or CSV format</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Questions
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Question Bank Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        placeholder="e.g., Technical Questions 2024"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                        minLength={3}
                        maxLength={100}
                      />
                      <p className="text-xs text-gray-500 mt-1">3-100 characters</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        placeholder="Describe the question bank content..."
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Section *
                      </label>
                      <select
                        name="section"
                        value={formData.section}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                        disabled={!formData.companyId}
                      >
                        <option value="">Select a section</option>
                        {availableSections.map(section => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                      </select>
                      {!formData.companyId && (
                        <p className="text-xs text-gray-500 mt-1">Showing default sections. Select a company to see company-specific sections.</p>
                      )}
                      {formData.companyId && availableSections.length === 0 && (
                        <p className="text-xs text-yellow-600 mt-1">No sections defined for this company</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Question File (JSON or CSV) *
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                        <input
                          type="file"
                          accept=".json,.csv"
                          onChange={handleFileChange}
                          className="hidden"
                          id="questionFile"
                        />
                        <label
                          htmlFor="questionFile"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <Upload className="w-12 h-12 text-gray-400 mb-3" />
                          <span className="text-lg font-medium text-gray-700">
                            {filePreview ? filePreview.name : 'Choose JSON or CSV file'}
                          </span>
                          <span className="text-sm text-gray-500 mt-1">
                            {filePreview ? `${filePreview.size} MB` : 'or drag and drop'}
                          </span>
                          <span className="text-xs text-gray-400 mt-2">
                            JSON or CSV format only
                          </span>
                        </label>
                      </div>

                      {filePreview && (
                        <div className={`mt-3 p-3 rounded-lg flex items-center ${
                          filePreview.extension === 'csv' 
                            ? 'bg-blue-50 border border-blue-200 text-blue-800'
                            : 'bg-green-50 border border-green-200 text-green-800'
                        }`}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">
                            {filePreview.name} ({filePreview.extension.toUpperCase()})
                          </span>
                        </div>
                      )}

                      <div className="mt-4 flex space-x-4">
                        <button
                          type="button"
                          onClick={generateSampleJSON}
                          className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download JSON Sample
                        </button>
                        <button
                          type="button"
                          onClick={generateSampleCSV}
                          className="flex items-center text-green-600 hover:text-green-700 text-sm"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download CSV Sample
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* File Format Requirements */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-2">File Format Requirements:</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="font-semibold mb-1">JSON Format:</p>
                            <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
{`[
  {
    "questionText": "Question?",
    "option1": "Option 1",
    "option2": "Option 2", 
    "option3": "Option 3",
    "option4": "Option 4",
    "correctAnswer": "1-4",
    "explanation": "...",
    "difficulty": "easy",
    "tags": "tag1,tag2",
    "marks": 1,
    "negativeMarks": 0
  },
  {
    "questionText": "Multiple choice question?",
    "questionType": "multiple",
    "option1": "Option 1",
    "option2": "Option 2", 
    "option3": "Option 3",
    "option4": "Option 4",
    "correctAnswer": [1, 3],
    "explanation": "...",
    "difficulty": "medium",
    "tags": "tag1,tag2",
    "marks": 2,
    "negativeMarks": 0.5
  }
]`}
                            </pre>
                          </div>
                          
                          <div>
                            <p className="font-semibold mb-1">CSV Format:</p>
                            <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
{`questionText,questionType,option1,option2,option3,option4,correctAnswer,...
"What is...?","","Opt1","Opt2","Opt3","Opt4","1",...
"Multiple...?","multiple","Opt1","Opt2","Opt3","Opt4","1,3",...`}
                            </pre>
                          </div>
                        </div>
                        
                        <p className="mt-2 text-xs">
                          <strong>Note:</strong> 
                          <ul className="list-disc pl-4 mt-1 space-y-1">
                            <li>For single choice: correctAnswer should be 1, 2, 3, or 4</li>
                            <li>For multiple choice: correctAnswer should be comma-separated numbers like "1,3" or [1,3]</li>
                          </ul>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {loading ? "Uploading..." : "Upload Question Bank"}
                </button>
              </div>
            </form>

            {/* Upload Progress */}
            {loading && uploadProgress > 0 && (
              <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Uploading...</span>
                  <span className="text-sm font-medium text-blue-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

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
                  <div>
                    <div className="font-medium">{responseMsg.text}</div>
                    {responseMsg.data && (
                      <div className="text-sm mt-2 space-y-1">
                        <div>Question Bank ID: {responseMsg.data.questionBankId}</div>
                        <div>Section: {responseMsg.data.section}</div>
                        <div>Questions Uploaded: {responseMsg.data.questionsCount}</div>
                        <div>Total in Bank: {responseMsg.data.totalQuestionsInBank}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Preview & History */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Stats */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-blue-500" />
                Upload Stats
              </h3>
              
              <div className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <Database className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-gray-900">{uploadHistory.length}</div>
                  <div className="text-sm text-gray-600">Total Uploads</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Recent Upload:</span>
                    <span className="font-medium">
                      {uploadHistory[0] ? new Date(uploadHistory[0].createdAt).toLocaleDateString() : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Questions:</span>
                    <span className="font-medium">
                      {uploadHistory.reduce((sum, bank) => sum + (bank.questionsCount || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Uploads */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Uploads</h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {uploadHistory.slice(0, 5).map((upload) => (
                  <div key={upload._id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {upload.title}


                        
                      </div>
                      <div className="text-xs text-gray-500">
                        {upload.questionsCount} questions • {upload.section}
                      </div>
                    </div>
                  </div>
                ))}
                {uploadHistory.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No uploads yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionBankUpload;