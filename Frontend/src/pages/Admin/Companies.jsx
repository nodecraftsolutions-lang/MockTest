import { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Building, Search, Filter,
  Eye, Settings, Users, BookOpen, Clock, CheckCircle, FileText
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

const ManageCompanies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [previewCompany, setPreviewCompany] = useState(null);
  const [companyTests, setCompanyTests] = useState({});
  const [companyPatterns, setCompanyPatterns] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    description: '',
    category: 'IT Services',
    difficulty: 'Medium',
    defaultPattern: [
      {
        sectionName: 'Quantitative Aptitude',
        questionCount: 20,
        duration: 30,
        negativeMarking: 0.25,
        marksPerQuestion: 1
      }
    ],
    tags: [],
    metadata: {
      cutoffPercentage: 60,
      passingCriteria: 'Overall percentage',
      instructions: []
    }
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      if (response.data.success) {
        // Handle different response structures
        const companiesData = response.data.data.companies || response.data.data || [];
        setCompanies(companiesData);
        
        // Fetch detailed information for each company
        companiesData.forEach(company => {
          fetchCompanyDetails(company._id);
        });
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      showError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyDetails = async (companyId) => {
    try {
      // Fetch company pattern
      const patternRes = await api.get(`/companies/${companyId}/pattern`);
      if (patternRes.data.success) {
        setCompanyPatterns(prev => ({
          ...prev,
          [companyId]: patternRes.data.data
        }));
      }

      // Fetch company tests
      const testsRes = await api.get(`/tests?companyId=${companyId}`);
      if (testsRes.data.success) {
        setCompanyTests(prev => ({
          ...prev,
          [companyId]: testsRes.data.data.tests || []
        }));
      }
    } catch (error) {
      console.error(`Error fetching details for company ${companyId}:`, error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        const response = await api.put(`/companies/${editingCompany._id}`, formData);
        if (response.data.success) {
          showSuccess('Company updated successfully');
          fetchCompanies();
        }
      } else {
        const response = await api.post('/companies', formData);
        if (response.data.success) {
          showSuccess('Company created successfully');
          fetchCompanies();
        }
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving company:', error);
      showError(error.response?.data?.message || 'Failed to save company');
    }
  };

  const handleDelete = async (companyId) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        const response = await api.delete(`/companies/${companyId}`);
        if (response.data.success) {
          showSuccess('Company deleted successfully');
          fetchCompanies();
        }
      } catch (error) {
        console.error('Error deleting company:', error);
        showError(error.response?.data?.message || 'Failed to delete company');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      logoUrl: '',
      description: '',
      category: 'IT Services',
      difficulty: 'Medium',
      defaultPattern: [
        {
          sectionName: 'Quantitative Aptitude',
          questionCount: 20,
          duration: 30,
          negativeMarking: 0.25,
          marksPerQuestion: 1
        }
      ],
      tags: [],
      metadata: {
        cutoffPercentage: 60,
        passingCriteria: 'Overall percentage',
        instructions: []
      }
    });
    setEditingCompany(null);
  };

  const openEditModal = (company) => {
    setEditingCompany(company);
    
    // Make sure we map the pattern correctly
    const mappedPattern = (company.defaultPattern || []).map(section => ({
      sectionName: section.sectionName,
      questionCount: section.questionCount || section.questions, // Handle both field names
      duration: section.duration,
      negativeMarking: section.negativeMarking || 0,
      marksPerQuestion: section.marksPerQuestion || 1
    }));
    
    setFormData({
      name: company.name,
      logoUrl: company.logoUrl || '',
      description: company.description || '',
      category: company.category || 'IT Services',
      difficulty: company.difficulty || 'Medium',
      defaultPattern: mappedPattern.length > 0 ? mappedPattern : [
        {
          sectionName: 'Quantitative Aptitude',
          questionCount: 20,
          duration: 30,
          negativeMarking: 0.25,
          marksPerQuestion: 1
        }
      ],
      tags: company.tags || [],
      metadata: company.metadata || {
        cutoffPercentage: 60,
        passingCriteria: 'Overall percentage',
        instructions: []
      }
    });
    setShowModal(true);
  };

  const navigateToTests = (companyId) => {
    navigate(`/admin/tests?company=${companyId}`);
  };

  const addSection = () => {
    setFormData({
      ...formData,
      defaultPattern: [
        ...formData.defaultPattern,
        {
          sectionName: '',
          questionCount: 10,
          duration: 15,
          negativeMarking: 0.25,
          marksPerQuestion: 1
        }
      ]
    });
  };

  const updateSection = (index, field, value) => {
    const updatedPattern = [...formData.defaultPattern];
    updatedPattern[index][field] = value;
    setFormData({ ...formData, defaultPattern: updatedPattern });
  };

  const removeSection = (index) => {
    const updatedPattern = formData.defaultPattern.filter((_, i) => i !== index);
    setFormData({ ...formData, defaultPattern: updatedPattern });
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesCategory = filterCategory === 'all' || company.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const openCompanyDetails = (company) => {
    setPreviewCompany(company);
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Companies</h1>
          <p className="text-gray-600">Add and manage companies for mock tests</p>
          <p className="text-sm text-blue-600 mt-1">
            Try the new <a href="/admin/mocktest" className="underline">consolidated management interface</a> for easier workflow
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Company
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
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input-field"
              >
                <option value="all">All Categories</option>
                <option value="IT Services">IT Services</option>
                <option value="Product">Product</option>
                <option value="Consulting">Consulting</option>
                <option value="Banking">Banking</option>
                <option value="Government">Government</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredCompanies.length > 0 ? (
          filteredCompanies.map((company) => {
            const pattern = companyPatterns[company._id];
            const tests = companyTests[company._id] || [];
            const freeTests = tests.filter(t => t.type === 'free');
            const paidTests = tests.filter(t => t.type === 'paid');
            
            return (
              <div key={company._id} className="card hover:shadow-md transition-shadow">
                {/* Company Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      {company.logoUrl ? (
                        <img src={company.logoUrl} alt={company.name} className="w-8 h-8 object-contain" />
                      ) : (
                        <Building className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{company.name}</h3>
                      <p className="text-sm text-gray-600">{company.category} • {company.difficulty}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(company)}
                      className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100"
                      title="Edit Company"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(company._id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                      title="Delete Company"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigateToTests(company._id)}
                      className="btn-secondary text-sm flex items-center"
                    >
                      <BookOpen className="w-4 h-4 mr-1" />
                      Manage Tests
                    </button>
                  </div>
                </div>

                {company.description && (
                  <p className="text-sm text-gray-600 mb-4">{company.description}</p>
                )}

                {/* Pattern Overview */}
                {pattern && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Exam Pattern</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg flex items-center">
                        <FileText className="w-5 h-5 text-blue-600 mr-3" />
                        <div>
                          <div className="text-lg font-bold text-blue-600">{pattern.totalQuestions}</div>
                          <div className="text-xs text-gray-600">Total Questions</div>
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg flex items-center">
                        <Clock className="w-5 h-5 text-green-600 mr-3" />
                        <div>
                          <div className="text-lg font-bold text-green-600">{pattern.totalDuration} min</div>
                          <div className="text-xs text-gray-600">Duration</div>
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg flex items-center">
                        <CheckCircle className="w-5 h-5 text-purple-600 mr-3" />
                        <div>
                          <div className="text-lg font-bold text-purple-600">{pattern.cutoffPercentage}%</div>
                          <div className="text-xs text-gray-600">Passing Criteria</div>
                        </div>
                      </div>
                    </div>

                    {/* Section Breakdown */}
                    <div className="overflow-x-auto bg-gray-50 p-3 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Section</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Questions</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Duration</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Marks/Question</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {pattern.pattern.map((section, idx) => (
                            <tr key={idx} className="hover:bg-gray-100">
                              <td className="px-3 py-2 text-sm">{section.sectionName}</td>
                              <td className="px-3 py-2 text-sm">{section.questionCount || section.questions}</td>
                              <td className="px-3 py-2 text-sm">{section.duration} min</td>
                              <td className="px-3 py-2 text-sm">{section.marksPerQuestion || 1}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tests Overview */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Tests Created</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Free Tests ({freeTests.length})</h5>
                      {freeTests.length > 0 ? (
                        <ul className="space-y-2">
                          {freeTests.map(test => (
                            <li key={test._id} className="bg-primary-50 p-3 rounded-lg flex justify-between items-center">
                              <span className="text-sm font-medium">{test.title}</span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {test.totalQuestions} Qs
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No free tests created yet</p>
                      )}
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Paid Tests ({paidTests.length})</h5>
                      {paidTests.length > 0 ? (
                        <ul className="space-y-2">
                          {paidTests.map(test => (
                            <li key={test._id} className="bg-primary-50 p-3 rounded-lg flex justify-between items-center">
                              <span className="text-sm font-medium">{test.title}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  ₹{test.price}
                                </span>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {test.totalQuestions} Qs
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No paid tests created yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Companies Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first company'
              }
            </p>
            {!searchTerm && filterCategory === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Company
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Company Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCompany ? 'Edit Company' : 'Add New Company'}
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
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="input-field"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
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
                  placeholder="Enter company description"
                />
              </div>

              {/* Exam Pattern */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Exam Pattern</h3>
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
                  {formData.defaultPattern.map((section, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-900">Section {index + 1}</h4>
                        {formData.defaultPattern.length > 1 && (
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
                            value={section.sectionName}
                            onChange={(e) => updateSection(index, 'sectionName', e.target.value)}
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

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cutoff Percentage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.metadata.cutoffPercentage}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: {
                        ...formData.metadata,
                        cutoffPercentage: parseInt(e.target.value)
                      }
                    })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passing Criteria
                  </label>
                  <input
                    type="text"
                    value={formData.metadata.passingCriteria}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: {
                        ...formData.metadata,
                        passingCriteria: e.target.value
                      }
                    })}
                    className="input-field"
                    placeholder="Overall percentage"
                  />
                </div>
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
                  {editingCompany ? 'Update Company' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCompanies;