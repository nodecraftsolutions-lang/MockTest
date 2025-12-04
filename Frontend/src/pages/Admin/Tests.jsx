import { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, BookOpen, Search, Filter,
  Eye, Settings, Clock, FileText, AlertCircle, CheckCircle, ListPlus
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

const ManageTests = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const companyIdFromUrl = searchParams.get('company');
  
  const [tests, setTests] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCompany, setFilterCompany] = useState(companyIdFromUrl || 'all');
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    companyId: companyIdFromUrl || '',
    type: 'free',
    price: 0,
    sections: [
      {
        sectionName: 'Aptitude',
        questionCount: 20,
        duration: 30,
        marksPerQuestion: 1,
        negativeMarking: 0.25,
        difficultyDistribution: {
          easy: 30,
          medium: 50,
          hard: 20
        }
      }
    ],
    instructions: [
      'Read all questions carefully before answering',
      'Each question carries equal marks unless specified',
      'There is negative marking for wrong answers',
      'You can review and change your answers before submitting',
      'Manage your time wisely across all sections'
    ],
    difficulty: 'Medium',
    tags: [],
    isFeatured: false,
    validFrom: '',
    validUntil: ''
  });
  const [availableSections, setAvailableSections] = useState({});
  const { showSuccess, showError } = useToast();

  const sectionTypes = ['Aptitude', 'Reasoning', 'Technical', 'English', 'General Knowledge', 'Programming'];

  useEffect(() => {
    fetchTests();
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (companyIdFromUrl && companyIdFromUrl !== 'all') {
      setFilterCompany(companyIdFromUrl);
      setFormData(prev => ({
        ...prev,
        companyId: companyIdFromUrl
      }));
    }
  }, [companyIdFromUrl]);

  useEffect(() => {
    // Update URL when filter changes
    if (filterCompany && filterCompany !== 'all') {
      navigate(`/admin/tests?company=${filterCompany}`, { replace: true });
    } else if (filterCompany === 'all' && companyIdFromUrl) {
      navigate('/admin/tests', { replace: true });
    }
  }, [filterCompany, navigate]);

  useEffect(() => {
    if (formData.companyId) {
      fetchAvailableSections(formData.companyId);
    }
  }, [formData.companyId]);

  const fetchTests = async () => {
    try {
      // Changed from /admin/tests to /tests to match backend API endpoint
      const params = new URLSearchParams();
      params.append('fetchAll', 'true'); // Fetch all tests
      
      const response = await api.get(`/tests?${params.toString()}`);
      if (response.data.success) {
        // Handle different response structures
        const testsData = response.data.data.tests || response.data.data || [];
        setTests(testsData);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      showError('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      if (response.data.success) {
        setCompanies(response.data.data.companies || response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
      showError('Failed to load companies');
      setCompanies([]);
    }
  };

  const fetchAvailableSections = async (companyId) => {
    try {
      const response = await api.get(`/question-banks/company/${companyId}/sections`);
      if (response.data.success) {
        const sectionsData = {};
        response.data.data.sections.forEach(section => {
          sectionsData[section.section] = section;
        });
        setAvailableSections(sectionsData);
      }
    } catch (error) {
      console.error('Failed to load available sections:', error);
      setAvailableSections({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate that all sections have question banks
      const missingSections = formData.sections.filter(section => 
        !availableSections[section.sectionName] || 
        availableSections[section.sectionName].totalQuestions < section.questionCount
      );

      if (missingSections.length > 0) {
        showError(`Missing or insufficient question banks for: ${missingSections.map(s => s.sectionName).join(', ')}`);
        return;
      }

      if (editingTest) {
        const response = await api.put(`/tests/${editingTest._id}`, formData);
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
        const response = await api.delete(`/tests/${testId}`);
        if (response.data.success) {
          showSuccess('Test deleted successfully');
          fetchTests();
        }
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to delete test');
      }
    }
  };

  const generateTestQuestions = async (testId) => {
    try {
      const response = await api.post(`/tests/${testId}/generate-questions`);
      if (response.data.success) {
        showSuccess('Test questions generated successfully');
        fetchTests();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to generate questions');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      companyId: filterCompany !== 'all' ? filterCompany : '',
      type: 'free',
      price: 0,
      sections: [
        {
          sectionName: 'Aptitude',
          questionCount: 20,
          duration: 30,
          marksPerQuestion: 1,
          negativeMarking: 0.25,
          difficultyDistribution: {
            easy: 30,
            medium: 50,
            hard: 20
          }
        }
      ],
      instructions: [
        'Read all questions carefully before answering',
        'Each question carries equal marks unless specified',
        'There is negative marking for wrong answers',
        'You can review and change your answers before submitting',
        'Manage your time wisely across all sections'
      ],
      difficulty: 'Medium',
      tags: [],
      isFeatured: false,
      validFrom: '',
      validUntil: ''
    });
    setEditingTest(null);
    setAvailableSections({});
  };

  const openEditModal = (test) => {
    setEditingTest(test);
    setFormData({
      title: test.title,
      description: test.description || '',
      companyId: test.companyId?._id || test.companyId,
      type: test.type,
      price: test.price,
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
          sectionName: 'Reasoning',
          questionCount: 15,
          duration: 20,
          marksPerQuestion: 1,
          negativeMarking: 0.25,
          difficultyDistribution: {
            easy: 30,
            medium: 50,
            hard: 20
          }
        }
      ]
    });
  };

  const updateSection = (index, field, value) => {
    const updatedSections = [...formData.sections];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updatedSections[index][parent][child] = value;
    } else {
      updatedSections[index][field] = value;
    }
    setFormData({ ...formData, sections: updatedSections });
  };

  const removeSection = (index) => {
    const updatedSections = formData.sections.filter((_, i) => i !== index);
    setFormData({ ...formData, sections: updatedSections });
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesType = filterType === 'all' || test.type === filterType;
    const matchesCompany = filterCompany === 'all' || 
                          (test.companyId && 
                          (typeof test.companyId === 'string' ? 
                            test.companyId === filterCompany : 
                            test.companyId._id === filterCompany));
    return matchesSearch && matchesType && matchesCompany;
  });

  // Get company name for header display
  const getSelectedCompanyName = () => {
    if (filterCompany === 'all') return null;
    const company = companies.find(c => c._id === filterCompany);
    return company ? company.name : null;
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getSelectedCompanyName() ? `${getSelectedCompanyName()} Tests` : 'Manage Tests'}
          </h1>
          <p className="text-gray-600">Create dynamic tests with section-wise question banks</p>
          <p className="text-sm text-blue-600 mt-1">
            Try the new <a href="/admin/mocktest" className="underline">consolidated management interface</a> for easier workflow
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Test
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field"
          >
            <option value="all">All Types</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>

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

          <button className="btn-secondary flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Export Tests
          </button>
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
                  Sections
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questions
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
              {filteredTests.length > 0 ? (
                filteredTests.map((test) => (
                  <tr key={test._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{test.title}</div>
                        <div className="text-sm text-gray-500" style={{ whiteSpace: 'pre-line', fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: test.description?.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-lg">$1</strong>') || '' }} />
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            test.type === 'free' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {test.type === 'free' ? 'Free' : `₹${test.price}`}
                          </span>
                          {test.isFeatured && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg mr-2">
                          {typeof test.companyId === 'object' && test.companyId?.logoUrl && (
                            <img 
                              src={test.companyId.logoUrl} 
                              alt={test.companyId.name} 
                              className="w-8 h-8 rounded-lg object-contain"
                              onError={(e) => {e.target.style.display = 'none'}}
                            />
                          )}
                        </div>
                        <div className="text-sm text-gray-900">
                          {typeof test.companyId === 'object' 
                            ? test.companyId?.name 
                            : companies.find(c => c._id === test.companyId)?.name || 'Unknown Company'}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {test.sections && test.sections.length > 0 ? (
                          test.sections.map((section, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {section.sectionName} ({section.questionCount})
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">No sections</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{test.totalQuestions || 0}</div>
                      <div className="text-sm text-gray-500">
                        {test.isGenerated ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Generated
                          </span>
                        ) : (
                          <span className="flex items-center text-yellow-600">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Not Generated
                          </span>
                        )}
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
                          onClick={() => navigate(`/admin/mocktest/questions/${test._id}`)}
                          className="text-green-600 hover:text-green-900"
                          title="Manage Questions"
                        >
                          <ListPlus className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => openEditModal(test)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit Test"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        {!test.isGenerated && (
                          <button
                            onClick={() => generateTestQuestions(test._id)}
                            className="text-green-600 hover:text-green-900"
                            title="Generate Questions"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Preview Test"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(test._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Test"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No tests found. Create your first test by clicking the "Create Test" button.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Test Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTest ? 'Edit Test' : 'Create New Test'}
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

                <div className="space-y-6">
                  {formData.sections.map((section, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
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

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Section Type *
                          </label>
                          <select
                            required
                            value={section.sectionName}
                            onChange={(e) => updateSection(index, 'sectionName', e.target.value)}
                            className="input-field"
                          >
                            <option value="">Select Section</option>
                            {sectionTypes.map(sectionType => (
                              <option key={sectionType} value={sectionType}>
                                {sectionType}
                              </option>
                            ))}
                          </select>
                          {availableSections[section.sectionName] && (
                            <p className="text-xs text-green-600 mt-1">
                              {availableSections[section.sectionName].totalQuestions} questions available
                            </p>
                          )}
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
                            Marks per Question
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="0.25"
                            value={section.marksPerQuestion}
                            onChange={(e) => updateSection(index, 'marksPerQuestion', parseFloat(e.target.value))}
                            className="input-field"
                          />
                        </div>
                      </div>

                      {/* Difficulty Distribution */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Difficulty Distribution (%)
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Easy</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={section.difficultyDistribution.easy}
                              onChange={(e) => updateSection(index, 'difficultyDistribution.easy', parseInt(e.target.value))}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Medium</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={section.difficultyDistribution.medium}
                              onChange={(e) => updateSection(index, 'difficultyDistribution.medium', parseInt(e.target.value))}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Hard</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={section.difficultyDistribution.hard}
                              onChange={(e) => updateSection(index, 'difficultyDistribution.hard', parseInt(e.target.value))}
                              className="input-field"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Total: {section.difficultyDistribution.easy + section.difficultyDistribution.medium + section.difficultyDistribution.hard}%
                        </p>
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

      {/* Empty State */}
      {filteredTests.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== 'all' || filterCompany !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first dynamic test with section-wise question banks'
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