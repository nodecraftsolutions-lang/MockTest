import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, FileText, Users, Filter, Search } from 'lucide-react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';

const MockTests = () => {
  const [tests, setTests] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { showError } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [testsResponse, companiesResponse] = await Promise.all([
        api.get('/tests'),
        api.get('/companies')
      ]);

      if (testsResponse.data.success) {
        setTests(testsResponse.data.data.tests);
      }
      if (companiesResponse.data.success) {
        setCompanies(companiesResponse.data.data.companies);
      }
    } catch (error) {
      showError('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = tests.filter(test => {
    const matchesType = filter === 'all' || test.type === filter;
    const matchesCompany = !selectedCompany || test.companyId._id === selectedCompany;
    const matchesSearch = !searchTerm || 
      test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.companyId.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesCompany && matchesSearch;
  });

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Mock Tests</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Practice with real exam patterns from top companies. Choose from free tests 
            or unlock premium test series for comprehensive preparation.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Test Type
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Tests</option>
                <option value="free">Free Tests</option>
                <option value="paid">Paid Tests</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Companies</option>
                {companies.map(company => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Search Tests
              </label>
              <input
                type="text"
                placeholder="Search by test name or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map(test => (
            <div key={test._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{test.companyId.name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        test.type === 'free' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {test.type === 'free' ? 'Free' : `₹${test.price}`}
                      </span>
                    </div>
                  </div>
                </div>

                <h4 className="text-lg font-medium text-gray-900 mb-3">{test.title}</h4>
                
                {test.description && (
                  <p className="text-sm text-gray-600 mb-4">{test.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    {test.totalQuestions} Questions
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {test.duration} Minutes
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {test.difficulty}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Link
                    to={`/tests/${test._id}/preview`}
                    className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Preview
                  </Link>
                  <Link
                    to="/auth"
                    className="flex-1 text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Test
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTests.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or search terms
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-primary-600 rounded-lg p-8 text-center text-white mt-12">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Your Preparation?</h2>
          <p className="text-primary-100 mb-6">
            Join thousands of students who have successfully cleared interviews with our help
          </p>
          <Link 
            to="/auth" 
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            <Play className="w-5 h-5 mr-2" />
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MockTests;