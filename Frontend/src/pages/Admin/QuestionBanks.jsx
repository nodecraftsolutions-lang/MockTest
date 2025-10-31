import { useState, useEffect } from 'react';
import { 
  Plus, Upload, Eye, Trash2, BookOpen, Search, Filter,
  FileText, Download, AlertCircle, CheckCircle
} from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

const QuestionBanks = () => {
  const [questionBanks, setQuestionBanks] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [uploadData, setUploadData] = useState({
    companyId: '',
    section: '',
    title: '',
    description: ''
  });
  const { showSuccess, showError } = useToast();

  const sections = ['Aptitude', 'Reasoning', 'Technical', 'English', 'General Knowledge', 'Programming'];

  useEffect(() => {
    fetchQuestionBanks();
    fetchCompanies();
  }, []);

  const fetchQuestionBanks = async () => {
    try {
      const params = new URLSearchParams();
      params.append('fetchAll', 'true'); // Fetch all question banks
      
      const response = await api.get(`/question-banks?${params.toString()}`);
      if (response.data.success) {
        setQuestionBanks(response.data.data.questionBanks);
      }
    } catch (error) {
      showError('Failed to load question banks');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      if (response.data.success) {
        setCompanies(response.data.data.companies);
      }
    } catch (error) {
      console.error('Failed to load companies');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const fileInput = e.target.questionFile.files[0];
    
    if (!fileInput) {
      showError('Please select a file to upload');
      return;
    }

    formData.append('questionFile', fileInput);
    formData.append('companyId', uploadData.companyId);
    formData.append('section', uploadData.section);
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);

    try {
      const response = await api.post('/question-banks/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        showSuccess(`Successfully uploaded ${response.data.data.questionsCount} questions`);
        setShowUploadModal(false);
        setUploadData({ companyId: '', section: '', title: '', description: '' });
        fetchQuestionBanks();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to upload questions');
    }
  };

  const handlePreview = async (questionBankId) => {
    try {
      const response = await api.get(`/question-banks/${questionBankId}/preview`);
      if (response.data.success) {
        setPreviewData(response.data.data);
        setShowPreviewModal(true);
      }
    } catch (error) {
      showError('Failed to load preview');
    }
  };

  const handleDelete = async (questionBankId) => {
    if (window.confirm('Are you sure you want to delete this question bank?')) {
      try {
        const response = await api.delete(`/question-banks/${questionBankId}`);
        if (response.data.success) {
          showSuccess('Question bank deleted successfully');
          fetchQuestionBanks();
        }
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to delete question bank');
      }
    }
  };

  const filteredQuestionBanks = questionBanks.filter(bank => {
    const matchesSearch = bank.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bank.section.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = filterCompany === 'all' || bank.companyId._id === filterCompany;
    const matchesSection = filterSection === 'all' || bank.section === filterSection;
    return matchesSearch && matchesCompany && matchesSection;
  });

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Banks</h1>
          <p className="text-gray-600">Manage section-wise question banks for dynamic test generation</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary flex items-center"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Questions
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search question banks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="input-field"
          >
            <option value="all">All Companies</option>
            {companies.map(company => (
              <option key={company._id} value={company._id}>
                {company.name}
              </option>
            ))}
          </select>

          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="input-field"
          >
            <option value="all">All Sections</option>
            {sections.map(section => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>

          <button className="btn-secondary flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export Template
          </button>
        </div>
      </div>

      {/* Question Banks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuestionBanks.map((bank) => (
          <div key={bank._id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{bank.title}</h3>
                  <p className="text-sm text-gray-600">{bank.companyId?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePreview(bank._id)}
                  className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(bank._id)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Section</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {bank.section}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Questions</span>
                <span className="text-sm text-gray-900">{bank.totalQuestions}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Difficulty</span>
                <span className="text-sm text-gray-900">{bank.difficulty}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Uploaded</span>
                <span className="text-sm text-gray-900">
                  {new Date(bank.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {bank.description && (
              <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200">
                {bank.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Upload Question Bank</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadData({ companyId: '', section: '', title: '', description: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company *
                  </label>
                  <select
                    required
                    value={uploadData.companyId}
                    onChange={(e) => setUploadData({ ...uploadData, companyId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Company</option>
                    {companies.map(company => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section *
                  </label>
                  <select
                    required
                    value={uploadData.section}
                    onChange={(e) => setUploadData({ ...uploadData, section: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Section</option>
                    {sections.map(section => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  className="input-field"
                  placeholder="e.g., TCS Aptitude Questions 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Brief description of this question bank"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Questions File (CSV/JSON) *
                </label>
                <input
                  type="file"
                  name="questionFile"
                  accept=".csv,.json"
                  required
                  className="input-field"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Upload CSV or JSON file with questions for this section
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">CSV Format Example:</h4>
                <pre className="text-sm text-gray-600 overflow-x-auto">
{`questionText,option1,option2,option3,option4,correctAnswer,explanation,difficulty,marks,negativeMarks,tags
"What is 2+2?","3","4","5","6","2","Basic addition","Easy","1","0.25","math,basic"
"Find the next number: 2,4,6,?","7","8","9","10","2","Even number sequence","Medium","2","0.5","sequence,pattern"`}
                </pre>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadData({ companyId: '', section: '', title: '', description: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Upload Questions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Preview: {previewData.questionBank.title}
              </h2>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewData(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="font-semibold text-blue-800">{previewData.questionBank.section}</div>
                  <div className="text-blue-600">Section</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="font-semibold text-green-800">{previewData.questionBank.totalQuestions}</div>
                  <div className="text-green-600">Total Questions</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="font-semibold text-purple-800">{previewData.questionBank.company?.name}</div>
                  <div className="text-purple-600">Company</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg text-center">
                  <div className="font-semibold text-orange-800">Preview</div>
                  <div className="text-orange-600">Sample Questions</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {previewData.sampleQuestions.map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty}
                      </span>
                      <span className="text-sm text-gray-600">{question.marks} marks</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-800 mb-4">
                    {question.questionText.split('\n').map((line, index) => (
                      <span key={index}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="p-2 bg-gray-50 rounded border">
                        {String.fromCharCode(65 + optIndex)}. {option.text}
                      </div>
                    ))}
                  </div>

                  {question.tags && question.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {question.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewData(null);
                }}
                className="btn-primary"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredQuestionBanks.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Question Banks Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterCompany !== 'all' || filterSection !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Upload your first question bank to get started'
            }
          </p>
          {!searchTerm && filterCompany === 'all' && filterSection === 'all' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload First Question Bank
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionBanks;