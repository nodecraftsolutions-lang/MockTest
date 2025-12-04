import { useState, useEffect } from "react";
import { 
  Building, 
  BookOpen, 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  FileText,
  Zap,
  Users,
  Clock,
  Award,
  Filter,
  Search,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import { useToast } from "../../../context/ToastContext";

const CompanyTestManagement = () => {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // State management
  const [companies, setCompanies] = useState([]);
  const [tests, setTests] = useState([]);
  const [questionBanks, setQuestionBanks] = useState([]);
  const [loading, setLoading] = useState({
    companies: true,
    tests: true,
    questionBanks: true
  });
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [expandedCompanies, setExpandedCompanies] = useState(new Set());
  
  // Modals
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editingTest, setEditingTest] = useState(null);
  
  // Forms
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    logoUrl: "",
    description: "",
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
  
  const [testFormData, setTestFormData] = useState({
    title: "",
    description: "",
    companyId: "",
    type: "free",
    price: 0,
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

  // Fetch all data on component mount
  useEffect(() => {
    fetchCompanies();
    fetchTests();
    fetchQuestionBanks();
  }, []);

  // Fetch companies
  const fetchCompanies = async () => {
    try {
      setLoading(prev => ({ ...prev, companies: true }));
      const response = await api.get('/companies');
      if (response.data.success) {
        setCompanies(response.data.data.companies || []);
      }
    } catch (error) {
      showError('Failed to load companies');
    } finally {
      setLoading(prev => ({ ...prev, companies: false }));
    }
  };

  // Fetch tests
  const fetchTests = async () => {
    try {
      setLoading(prev => ({ ...prev, tests: true }));
      const response = await api.get('/tests');
      if (response.data.success) {
        setTests(response.data.data.tests || []);
      }
    } catch (error) {
      showError('Failed to load tests');
    } finally {
      setLoading(prev => ({ ...prev, tests: false }));
    }
  };

  // Fetch question banks
  const fetchQuestionBanks = async () => {
    try {
      setLoading(prev => ({ ...prev, questionBanks: true }));
      const response = await api.get('/question-banks');
      if (response.data.success) {
        setQuestionBanks(response.data.data.questionBanks || []);
      }
    } catch (error) {
      showError('Failed to load question banks');
    } finally {
      setLoading(prev => ({ ...prev, questionBanks: false }));
    }
  };

  // Handle company form changes
  const handleCompanyChange = (e) => {
    setCompanyFormData({ ...companyFormData, [e.target.name]: e.target.value });
  };

  // Handle test form changes
  const handleTestChange = (e) => {
    setTestFormData({ ...testFormData, [e.target.name]: e.target.value });
  };

  // Handle section changes for company pattern
  const handleCompanySectionChange = (index, field, value) => {
    const updated = [...companyFormData.defaultPattern];
    updated[index][field] = field === 'sectionName' ? value : Number(value);
    setCompanyFormData({ ...companyFormData, defaultPattern: updated });
  };

  // Handle section changes for test
  const handleTestSectionChange = (index, field, value) => {
    const updated = [...testFormData.sections];
    updated[index][field] = field === 'sectionName' ? value : Number(value);
    setTestFormData({ ...testFormData, sections: updated });
  };

  // Add section to company pattern
  const addCompanySection = () => {
    setCompanyFormData({
      ...companyFormData,
      defaultPattern: [
        ...companyFormData.defaultPattern,
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

  // Add section to test
  const addTestSection = () => {
    setTestFormData({
      ...testFormData,
      sections: [
        ...testFormData.sections,
        {
          sectionName: "Reasoning",
          questionCount: 15,
          duration: 20,
          marksPerQuestion: 1,
          negativeMarking: 0.25
        }
      ]
    });
  };

  // Remove section from company pattern
  const removeCompanySection = (index) => {
    if (companyFormData.defaultPattern.length > 1) {
      const updated = [...companyFormData.defaultPattern];
      updated.splice(index, 1);
      setCompanyFormData({ ...companyFormData, defaultPattern: updated });
    }
  };

  // Remove section from test
  const removeTestSection = (index) => {
    if (testFormData.sections.length > 1) {
      const updated = [...testFormData.sections];
      updated.splice(index, 1);
      setTestFormData({ ...testFormData, sections: updated });
    }
  };

  // Submit company form
  const submitCompanyForm = async (e) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        const response = await api.put(`/companies/${editingCompany._id}`, companyFormData);
        if (response.data.success) {
          showSuccess("Company updated successfully");
        }
      } else {
        const response = await api.post("/companies", companyFormData);
        if (response.data.success) {
          showSuccess("Company created successfully");
        }
      }
      setShowCompanyModal(false);
      resetCompanyForm();
      fetchCompanies();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to save company";
      showError(errorMsg);
    }
  };

  // Submit test form
  const submitTestForm = async (e) => {
    e.preventDefault();
    try {
      if (editingTest) {
        const response = await api.put(`/tests/${editingTest._id}`, testFormData);
        if (response.data.success) {
          showSuccess("Test updated successfully");
        }
      } else {
        const response = await api.post("/tests", testFormData);
        if (response.data.success) {
          showSuccess("Test created successfully");
        }
      }
      setShowTestModal(false);
      resetTestForm();
      fetchTests();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to save test";
      showError(errorMsg);
    }
  };

  // Reset company form
  const resetCompanyForm = () => {
    setCompanyFormData({
      name: "",
      logoUrl: "",
      description: "",
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
    setEditingCompany(null);
  };

  // Reset test form
  const resetTestForm = () => {
    setTestFormData({
      title: "",
      description: "",
      companyId: "",
      type: "free",
      price: 0,
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
    setEditingTest(null);
  };

  // Open company edit modal
  const openEditCompanyModal = (company) => {
    setEditingCompany(company);
    setCompanyFormData({
      name: company.name,
      logoUrl: company.logoUrl || "",
      description: company.description || "",
      category: company.category || "IT Services",
      difficulty: company.difficulty || "Medium",
      defaultPattern: company.defaultPattern || [
        {
          sectionName: "Aptitude",
          questionCount: 15,
          duration: 25,
          marksPerQuestion: 1,
          negativeMarking: 0.25,
        },
      ],
      metadata: company.metadata || {
        cutoffPercentage: 60,
        passingCriteria: "Overall percentage",
        instructions: [
          "No negative marking unless mentioned",
          "No gadgets allowed",
        ],
      },
    });
    setShowCompanyModal(true);
  };

  // Open test edit modal
  const openEditTestModal = (test) => {
    setEditingTest(test);
    setTestFormData({
      title: test.title,
      description: test.description || "",
      companyId: test.companyId?._id || test.companyId || "",
      type: test.type,
      price: test.price,
      sections: test.sections || [
        {
          sectionName: "Aptitude",
          questionCount: 10,
          duration: 10,
          marksPerQuestion: 1,
          negativeMarking: 0.25
        }
      ]
    });
    setShowTestModal(true);
  };

  // Delete company
  const deleteCompany = async (companyId) => {
    if (window.confirm("Are you sure you want to delete this company? This will also delete all associated tests and question banks.")) {
      try {
        const response = await api.delete(`/companies/${companyId}`);
        if (response.data.success) {
          showSuccess("Company and associated tests/question banks deleted successfully");
          fetchCompanies();
          fetchTests();
          fetchQuestionBanks();
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || "Failed to delete company";
        showError(errorMsg);
      }
    }
  };

  // Delete test
  const deleteTest = async (testId) => {
    if (window.confirm("Are you sure you want to delete this test? This action cannot be undone.")) {
      try {
        const response = await api.delete(`/tests/${testId}`);
        if (response.data.success) {
          showSuccess("Test deleted successfully");
          fetchTests();
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || "Failed to delete test";
        showError(errorMsg);
      }
    }
  };

  // Generate questions for test
  const generateTestQuestions = async (testId) => {
    // Find the test to check if it was already generated
    const test = tests.find(t => t._id === testId);
    const wasAlreadyGenerated = test && test.isGenerated;
    
    try {
      const response = await api.post(`/tests/${testId}/generate-questions`);
      if (response.data.success) {
        const message = wasAlreadyGenerated 
          ? "Questions regenerated successfully" 
          : "Questions generated successfully";
        showSuccess(message);
        fetchTests();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to generate questions";
      showError(errorMsg);
    }
  };

  // Toggle company expansion
  const toggleCompanyExpansion = (companyId) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedCompanies(newExpanded);
  };

  // Filter companies based on search
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesFilter = filterCompany === "all" || company._id === filterCompany;
    return matchesSearch && matchesFilter;
  });

  // Get tests for a specific company
  const getCompanyTests = (companyId) => {
    return tests.filter(test => 
      test.companyId && 
      (typeof test.companyId === 'string' ? 
        test.companyId === companyId : 
        test.companyId._id === companyId)
    );
  };

  // Get question banks for a specific company
  const getCompanyQuestionBanks = (companyId) => {
    return questionBanks.filter(bank => 
      bank.companyId && 
      (typeof bank.companyId === 'string' ? 
        bank.companyId === companyId : 
        bank.companyId._id === companyId)
    );
  };

  // Calculate totals for company pattern
  const calculateCompanyPatternTotals = (pattern) => {
    const totalQuestions = pattern.reduce((sum, section) => sum + (section.questionCount || 0), 0);
    const totalDuration = pattern.reduce((sum, section) => sum + (section.duration || 0), 0);
    return { totalQuestions, totalDuration };
  };

  // Calculate totals for test
  const calculateTestTotals = (sections) => {
    const totalQuestions = sections.reduce((sum, section) => sum + (section.questionCount || 0), 0);
    const totalDuration = sections.reduce((sum, section) => sum + (section.duration || 0), 0);
    const totalMarks = sections.reduce((sum, section) => sum + ((section.questionCount || 0) * (section.marksPerQuestion || 1)), 0);
    return { totalQuestions, totalDuration, totalMarks };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mock Test Management</h1>
              <p className="text-gray-600 mt-1">Manage companies, tests, and question banks in one place</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  resetCompanyForm();
                  setShowCompanyModal(true);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </button>
              <button
                onClick={() => {
                  resetTestForm();
                  setShowTestModal(true);
                }}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Test
              </button>
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
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Companies</option>
              {companies.map(company => (
                <option key={company._id} value={company._id}>
                  {company.name}
                </option>
              ))}
            </select>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Test Types</option>
              <option value="free">Free Tests</option>
              <option value="paid">Paid Tests</option>
            </select>
          </div>
        </div>

        {/* Companies List */}
        <div className="space-y-6">
          {filteredCompanies.length > 0 ? (
            filteredCompanies.map(company => {
              const companyTests = getCompanyTests(company._id);
              const companyQuestionBanks = getCompanyQuestionBanks(company._id);
              const { totalQuestions, totalDuration } = calculateCompanyPatternTotals(company.defaultPattern || []);
              const isExpanded = expandedCompanies.has(company._id);
              
              // Filter tests based on type filter
              const filteredTests = companyTests.filter(test => {
                return filterType === "all" || test.type === filterType;
              });
              
              return (
                <div key={company._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Company Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          {company.logoUrl ? (
                            <img src={company.logoUrl} alt={company.name} className="w-8 h-8 object-contain" />
                          ) : (
                            <Building className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{company.name}</h2>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-600">{company.category}</span>
                            <span className="text-sm text-gray-600">•</span>
                            <span className="text-sm text-gray-600">{company.difficulty}</span>
                            <span className="text-sm text-gray-600">•</span>
                            <span className="text-sm text-gray-600">{totalQuestions} questions</span>
                            <span className="text-sm text-gray-600">•</span>
                            <span className="text-sm text-gray-600">{totalDuration} min</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleCompanyExpansion(company._id)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditCompanyModal(company)}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                          title="Edit Company"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCompany(company._id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                          title="Delete Company"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            resetTestForm();
                            setTestFormData(prev => ({ ...prev, companyId: company._id }));
                            setShowTestModal(true);
                          }}
                          className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Test
                        </button>
                      </div>
                    </div>
                    
                    {company.description && (
                      <p className="mt-3 text-gray-600 text-sm" style={{ whiteSpace: 'pre-line', fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: company.description?.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-lg">$1</strong>').replace(/\*\*‍\*(.*?)\*\*‍\*/g, '<strong class="font-bold text-lg">$1</strong>') || '' }} />
                    )}
                    
                    {/* Show company sections below the description */}
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Company Sections:</h4>
                      <div className="flex flex-wrap gap-2">
                        {company.defaultPattern?.map((section, index) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {section.sectionName} ({section.questionCount} Qs, {section.duration} min)
                          </span>
                        )) || <span className="text-xs text-blue-600">No sections available</span>}
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-6">
                      {/* Tests Section */}
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                            Tests ({filteredTests.length})
                          </h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => navigate(`/admin/mocktest/question-bank-upload?companyId=${company._id}`)}
                              className="flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <Upload className="w-4 h-4 mr-1" />
                              Upload Questions
                            </button>
                          </div>
                        </div>
                        
                        {filteredTests.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTests.map(test => {
                              const { totalQuestions, totalDuration, totalMarks } = calculateTestTotals(test.sections || []);
                              return (
                                <div key={test._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <h4 className="font-medium text-gray-900">{test.title}</h4>
                                      <div className="flex items-center mt-1">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          test.type === 'free' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                          {test.type === 'free' ? 'Free' : `₹${test.price}`}
                                        </span>
                                        {test.isFeatured && (
                                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Featured
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => openEditTestModal(test)}
                                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                        title="Edit Test"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => deleteTest(test._id)}
                                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                                        title="Delete Test"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-2 mb-3">
                                    <div className="text-center p-2 bg-blue-50 rounded">
                                      <div className="text-sm font-medium text-gray-900">{totalQuestions}</div>
                                      <div className="text-xs text-gray-600">Questions</div>
                                    </div>
                                    <div className="text-center p-2 bg-green-50 rounded">
                                      <div className="text-sm font-medium text-gray-900">{totalMarks}</div>
                                      <div className="text-xs text-gray-600">Marks</div>
                                    </div>
                                    <div className="text-center p-2 bg-purple-50 rounded">
                                      <div className="text-sm font-medium text-gray-900">{totalDuration}</div>
                                      <div className="text-xs text-gray-600">Minutes</div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {(test.sections || []).slice(0, 3).map((section, idx) => (
                                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {section.sectionName} ({section.questionCount})
                                      </span>
                                    ))}
                                    {(test.sections || []).length > 3 && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        +{(test.sections || []).length - 3} more
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                                    <div className="flex items-center">
                                      {test.isGenerated ? (
                                        <span className="flex items-center text-green-600 text-sm">
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          {test.totalQuestions || 0} Questions
                                        </span>
                                      ) : (
                                        <span className="flex items-center text-yellow-600 text-sm">
                                          <AlertCircle className="w-4 h-4 mr-1" />
                                          No Questions
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => navigate(`/admin/mocktest/questions/${test._id}`)}
                                        className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                        title="Add/Manage Questions"
                                      >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Questions
                                      </button>
                                      <button
                                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                                        title="Preview Test"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">
                              {filterType === "all" 
                                ? "No tests created for this company yet" 
                                : `No ${filterType} tests found for this company`}
                            </p>
                            <button
                              onClick={() => {
                                resetTestForm();
                                setTestFormData(prev => ({ ...prev, companyId: company._id }));
                                setShowTestModal(true);
                              }}
                              className="mt-3 inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Create Test
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Question Banks Section */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Database className="w-5 h-5 mr-2 text-purple-600" />
                          Question Banks ({companyQuestionBanks.length})
                        </h3>
                        
                        {companyQuestionBanks.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {companyQuestionBanks.map(bank => (
                              <div key={bank._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-gray-900">{bank.title}</h4>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {bank.section}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div className="text-center p-2 bg-blue-50 rounded">
                                    <div className="text-sm font-medium text-gray-900">{bank.totalQuestions || 0}</div>
                                    <div className="text-xs text-gray-600">Questions</div>
                                  </div>
                                  <div className="text-center p-2 bg-green-50 rounded">
                                    <div className="text-sm font-medium text-gray-900">{bank.questions?.length || 0}</div>
                                    <div className="text-xs text-gray-600">Uploaded</div>
                                  </div>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500">
                                    Created {new Date(bank.createdAt).toLocaleDateString()}
                                  </span>
                                  <button
                                    onClick={() => navigate(`/admin/mocktest/question-bank-upload?bankId=${bank._id}`)}
                                    className="flex items-center text-sm text-purple-600 hover:text-purple-800"
                                  >
                                    <Upload className="w-4 h-4 mr-1" />
                                    Add More
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Database className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">No question banks created for this company yet</p>
                            <button
                              onClick={() => navigate(`/admin/mocktest/question-bank-upload?companyId=${company._id}`)}
                              className="mt-3 inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Upload Questions
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Companies Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterCompany !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by adding your first company"}
              </p>
              <button
                onClick={() => {
                  resetCompanyForm();
                  setShowCompanyModal(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Company
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Company Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCompany ? "Edit Company" : "Add New Company"}
                </h2>
                <button
                  onClick={() => {
                    setShowCompanyModal(false);
                    resetCompanyForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <form onSubmit={submitCompanyForm} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={companyFormData.name}
                    onChange={handleCompanyChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="text"
                    name="logoUrl"
                    value={companyFormData.logoUrl}
                    onChange={handleCompanyChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    required
                    value={companyFormData.category}
                    onChange={handleCompanyChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    name="difficulty"
                    value={companyFormData.difficulty}
                    onChange={handleCompanyChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  name="description"
                  value={companyFormData.description}
                  onChange={handleCompanyChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter company description"
                />
              </div>
              
              {/* Test Pattern */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Test Pattern</h3>
                  <button
                    type="button"
                    onClick={addCompanySection}
                    className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Section
                  </button>
                </div>
                
                <div className="space-y-4">
                  {companyFormData.defaultPattern.map((section, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-900">Section {index + 1}</h4>
                        {companyFormData.defaultPattern.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCompanySection(index)}
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
                            onChange={(e) => handleCompanySectionChange(index, 'sectionName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Aptitude"
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
                            onChange={(e) => handleCompanySectionChange(index, 'questionCount', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            onChange={(e) => handleCompanySectionChange(index, 'duration', e.target.value)}
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
                            step="0.25"
                            value={section.marksPerQuestion}
                            onChange={(e) => handleCompanySectionChange(index, 'marksPerQuestion', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    name="cutoffPercentage"
                    min="0"
                    max="100"
                    value={companyFormData.metadata.cutoffPercentage}
                    onChange={(e) => setCompanyFormData({
                      ...companyFormData,
                      metadata: {
                        ...companyFormData.metadata,
                        cutoffPercentage: parseInt(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passing Criteria
                  </label>
                  <input
                    type="text"
                    name="passingCriteria"
                    value={companyFormData.metadata.passingCriteria}
                    onChange={(e) => setCompanyFormData({
                      ...companyFormData,
                      metadata: {
                        ...companyFormData.metadata,
                        passingCriteria: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Overall percentage"
                  />
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCompanyModal(false);
                    resetCompanyForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCompany ? "Update Company" : "Create Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingTest ? "Edit Test" : "Create New Test"}
                </h2>
                <button
                  onClick={() => {
                    setShowTestModal(false);
                    resetTestForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <form onSubmit={submitTestForm} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={testFormData.title}
                    onChange={handleTestChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter test title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company *
                  </label>
                  <select
                    name="companyId"
                    required
                    value={testFormData.companyId}
                    onChange={handleTestChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Company</option>
                    {companies.map(company => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  
                  {/* Show company sections when a company is selected */}
                  {testFormData.companyId && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Company Sections:</h4>
                      <div className="flex flex-wrap gap-2">
                        {companies
                          .find(company => company._id === testFormData.companyId)
                          ?.defaultPattern?.map((section, index) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {section.sectionName} ({section.questionCount} Qs, {section.duration} min)
                            </span>
                          )) || <span className="text-xs text-blue-600">No sections available</span>}
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Type *
                  </label>
                  <select
                    name="type"
                    required
                    value={testFormData.type}
                    onChange={handleTestChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                
                {testFormData.type === "paid" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      required
                      min="1"
                      value={testFormData.price}
                      onChange={handleTestChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  name="description"
                  value={testFormData.description}
                  onChange={handleTestChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter test description"
                />
              </div>
              
              {/* Test Sections */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Test Sections</h3>
                  <button
                    type="button"
                    onClick={addTestSection}
                    className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Section
                  </button>
                </div>
                
                <div className="space-y-4">
                  {testFormData.sections.map((section, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-900">Section {index + 1}</h4>
                        {testFormData.sections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTestSection(index)}
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
                            onChange={(e) => handleTestSectionChange(index, 'sectionName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Aptitude"
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
                            onChange={(e) => handleTestSectionChange(index, 'questionCount', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            onChange={(e) => handleTestSectionChange(index, 'duration', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            onChange={(e) => handleTestSectionChange(index, 'marksPerQuestion', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowTestModal(false);
                    resetTestForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingTest ? "Update Test" : "Create Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyTestManagement;