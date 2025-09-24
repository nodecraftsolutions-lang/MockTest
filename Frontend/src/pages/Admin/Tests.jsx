import { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, BookOpen, Search, Filter,
  Upload, Eye, Copy, Settings, Clock, FileText
} from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

const ManageTests = () => {
  const [tests, setTests] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [uploadingTest, setUploadingTest] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    companyId: '',
    type: 'free',
    price: 0,
    duration: 60,
    sections: [
      {
        name: 'General',
        questionCount: 20,
        duration: 30,
        negativeMarking: 0.25
      }
    ],
    instructions: [
      'Read all questions carefully before answering',
      'Each question carries equal marks',
      'There is negative marking for wrong answers',
      'You can review and change your answers before submitting'
    ],
    difficulty: 'Medium',
    tags: [],
    isFeatured: false,
    validFrom: '',
    validUntil: ''
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchTests();
    fetchCompanies();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await api.get('/admin/tests');
      if (response.data.success) {
        setTests(response.data.data.tests);
      }
    } catch (error) {
      showError('Failed to load tests');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTest) {
        const response = await api.put(`/admin/tests/${editingTest._id}`, formData);
        if (response.data.success) {
          showSuccess('Test updated successfully');
          fetchTests();
        }
      } else {
        const response = await api.post('/tests', formData);
        if (response.data.success) {
          showSuccess('Test created successfully');
          fetchTests();
        }
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save test');
    }
  };

  const handleDelete = async (testId) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      try {
        const response = await api.delete(`/admin/tests/${testId}`);
        if (response.data.success) {
          showSuccess('Test deleted successfully');
          fetchTests();
        }
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to delete test');
      }
    }
  };

  const handleUploadQuestions = async (e) => {
    e.preventDefault();
    const formDataUpload = new FormData();
    const fileInput = e.target.questionsFile.files[0];
    
    if (!fileInput) {
      showError('Please select a file to upload');
      return;
    }

    formDataUpload.append('questionsFile', fileInput);

    try {
      const response = await api.post(`/tests/${uploadingTest._id}/upload-questions`, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        showSuccess(`Successfully uploaded ${response.data.data.questionsCount} questions`);
        setShowUploadModal(false);
        setUploadingTest(null);
        fetchTests();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to upload questions');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      companyId: '',
      type: 'free',
      price: 0,
      duration: 60,
      sections: [
        {
          name: 'General',
          questionCount: 20,
          duration: 30,
          negativeMarking: 0.25
        }
      ],
      instructions: [
        'Read all questions carefully before answering',
        'Each question carries equal marks',
        'There is negative marking for wrong answers',
        'You can review and change your answers before submitting'
      ],
      difficulty: 'Medium',
      tags: [],
      isFeatured: false,
      validFrom: '',
      validUntil: ''
    });
    setEditingTest(null);
  };

  const openEditModal = (test) => {
    setEditingTest(test);
    setFormData({
      title: test.title,
      description: test.description || '',
      companyId: test.companyId._id,
      type: test.type,
      price: test.price,
      duration: test.duration,
      sections: test.sections || [],
      instructions: test.instructions || [],
      difficulty: test.difficulty,
      tags: test.tags || [],
      isFeatured: test.isFeatured,
      validFrom: test.validFrom ? new Date(test.validFrom).toISOString().split('T')[0] : '',
      validUntil: test.validUntil ? new Date(test.validUntil).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const addSection = () => {
    setFormData({
      ...formData,
      sections: [
        ...formData.sections,
        {
          name: '',
          questionCount: 10,
          duration: 15,
          negativeMarking: 0.25
        }
      ]
    });
  };

  const updateSection = (index, field, value) => {
    const updatedSections = [...formData.sections];
    updatedSections[index][field] = value;
    setFormData({ ...formData, sections: updatedSections });
  };

  const removeSection = (index) => {
    const updatedSections = formData.sections.filter((_, i) => i !== index);
    setFormData({ ...formData, sections: updatedSections });
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || test.type === filterType;
    const matchesCompany = filterCompany === 'all' || test.companyId._id === filterCompany;
    return matchesSearch && matchesType && matchesCompany;
  });

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Tests</h1>
          <p className="text-gray-600">Create and manage mock tests for companies</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Test
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field"
              >
                <option value="all">All Types</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
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
          </div>
        </div>
      </div>

      {/* Tests Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTests.map((test) => (
                <tr key={test._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{test.title}</div>
                      <div className="text-sm text-gray-500">{test.description}</div>
                      {test.isFeatured && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg mr-2"></div>
                      <div className="text-sm text-gray-900">{test.companyId?.name}</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        test.type === 'free' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {test.type === 'free' ? 'Free' : `₹${test.price}`}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{test.totalQuestions}</div>
                    <div className="text-sm text-gray-500">
                      {test.statistics?.totalAttempts || 0} attempts
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Clock className="w-4 h-4 mr-1" />
                      {test.duration} min
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      test.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {test.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(test)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setUploadingTest(test);
                          setShowUploadModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(test._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Test Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTest ? 'Edit Test' : 'Add New Test'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                    placeholder="Enter test title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company *
                  </label>
                  <select
                    required
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
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
                    Test Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                {formData.type === 'paid' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                      className="input-field"
                      placeholder="Enter price"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="input-field"
                    placeholder="Enter duration"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="input-field"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Enter test description"
                />
              </div>

              {/* Test Sections */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Test Sections</h3>
                  <button
                    type="button"
                    onClick={addSection}
                    className="btn-secondary text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Section
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.sections.map((section, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-900">Section {index + 1}</h4>
                        {formData.sections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSection(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Section Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={section.name}
                            onChange={(e) => updateSection(index, 'name', e.target.value)}
                            className="input-field"
                            placeholder="e.g., Quantitative Aptitude"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Questions *
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={section.questionCount}
                            onChange={(e) => updateSection(index, 'questionCount', parseInt(e.target.value))}
                            className="input-field"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration (min) *
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={section.duration}
                            onChange={(e) => updateSection(index, 'duration', parseInt(e.target.value))}
                            className="input-field"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Negative Marking
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            max="1"
                            value={section.negativeMarking}
                            onChange={(e) => updateSection(index, 'negativeMarking', parseFloat(e.target.value))}
                            className="input-field"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isFeatured" className="ml-2 text-sm text-gray-700">
                  Mark as Featured Test
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTest ? 'Update Test' : 'Create Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Questions Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Upload Questions for {uploadingTest?.title}
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadingTest(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUploadQuestions} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Questions File (CSV/JSON/Excel) *
                </label>
                <input
                  type="file"
                  name="questionsFile"
                  accept=".csv,.json,.xlsx,.xls"
                  required
                  className="input-field"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Upload a CSV, JSON, or Excel file with questions. Make sure to include columns for question, options, correct answer, and explanation.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">CSV Format Example:</h4>
                <pre className="text-sm text-gray-600">
{`questionText,option1,option2,option3,option4,correctAnswer,explanation,section,difficulty,marks,negativeMarks
"What is 2+2?","3","4","5","6","2","Basic addition","Aptitude","Easy","1","0.25"`}
                </pre>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadingTest(null);
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

      {/* Empty State */}
      {filteredTests.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== 'all' || filterCompany !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first test'
            }
          </p>
          {!searchTerm && filterType === 'all' && filterCompany === 'all' && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Test
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageTests;