import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Zap, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Award,
  Clock,
  BookOpen,
  Building,
  Users,
  BarChart3,
  Sparkles
} from "lucide-react";
import api from "../../../api/axios";
import { useToast } from "../../../context/ToastContext";

const DynamicGenerateQuestions = () => {
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(searchParams.get('testId') || "");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [testDetails, setTestDetails] = useState(null);

  // Fetch all tests dynamically
  useEffect(() => {
    const fetchTests = async () => {
      setLoading(true);
      try {
        const res = await api.get("/tests");
        setTests(res.data.data?.tests || []);
        
        // If testId is in URL, set it as selected
        const testIdFromUrl = searchParams.get('testId');
        if (testIdFromUrl) {
          setSelectedTest(testIdFromUrl);
        }
      } catch (error) {
        console.error("Failed to fetch tests:", error);
        setTests([]);
        showError("Failed to load tests");
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [showError, searchParams]);

  // Fetch test details when selected
  useEffect(() => {
    const fetchTestDetails = async () => {
      if (!selectedTest) {
        setTestDetails(null);
        return;
      }

      try {
        const response = await api.get(`/tests/${selectedTest}`);
        setTestDetails(response.data.data?.test);
      } catch (error) {
        console.error("Failed to fetch test details:", error);
        setTestDetails(null);
      }
    };

    fetchTestDetails();
  }, [selectedTest]);

  // Generate questions for the selected test
  const generateQuestions = async () => {
    if (!selectedTest) return;

    setGenerating(true);
    setResult(null);

    try {
      const response = await api.post(`/tests/${selectedTest}/generate-questions`);
      const data = response.data.data;
      showSuccess(`Successfully generated ${data.totalQuestions} questions!`);
      setResult(data);
      
      // Refresh test details to show updated status
      const updatedResponse = await api.get(`/tests/${selectedTest}`);
      setTestDetails(updatedResponse.data.data?.test);
    } catch (error) {
      console.error(error);
      showError(error.response?.data?.message || "Failed to generate questions");
    }

    setGenerating(false);
  };

  // Quick stats
  const stats = {
    totalTests: tests.length,
    generatedTests: tests.filter(test => test.isGenerated).length,
    freeTests: tests.filter(test => test.type === 'free').length,
    paidTests: tests.filter(test => test.type === 'paid').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Generate Test Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Automatically generate questions for your tests from available question banks
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Test Selection Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Select Test
                </h2>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Choose a Test to Generate Questions
                  </label>
                  <select
                    value={selectedTest}
                    onChange={(e) => setSelectedTest(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={loading}
                  >
                    <option value="">
                      {loading ? "Loading tests..." : "Select a test..."}
                    </option>
                    {tests.map((test) => (
                      <option key={test._id} value={test._id}>
                        {test.title} - {test.companyId?.name || 'Unknown Company'} 
                        {test.isGenerated && ' ✓'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Test Count */}
                <div className="text-sm text-gray-600 text-center">
                  {tests.length} tests available
                </div>
              </div>
            </div>

            {/* Test Preview */}
            {testDetails && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Test Preview
                    </h2>
                    {testDetails.isGenerated && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Questions Generated
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  
                  {/* Test Header */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{testDetails.title}</h3>
                    <p className="text-gray-600 mb-4">{testDetails.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        testDetails.type === 'paid' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {testDetails.type === 'paid' ? 'Paid' : 'Free'}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {testDetails.difficulty || 'Medium'}
                      </span>
                      {testDetails.isFeatured && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Test Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold text-gray-900">{testDetails.totalQuestions}</div>
                      <div className="text-sm text-gray-600">Questions</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <Award className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold text-gray-900">{testDetails.totalMarks}</div>
                      <div className="text-sm text-gray-600">Total Marks</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold text-gray-900">{testDetails.duration}</div>
                      <div className="text-sm text-gray-600">Minutes</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-xl">
                      <Building className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {testDetails.companyId?.name}
                      </div>
                      <div className="text-sm text-gray-600">Company</div>
                    </div>
                  </div>

                  {/* Sections Preview */}
                  {testDetails.sections && testDetails.sections.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Test Sections</h4>
                      <div className="space-y-3">
                        {testDetails.sections.map((section, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <BookOpen className="w-4 h-4 text-blue-600 mr-3" />
                              <span className="font-medium text-gray-900">{section.sectionName}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {section.questionCount} questions • {section.duration} min
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={generateQuestions}
                    disabled={generating || !selectedTest}
                    className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        {testDetails.isGenerated ? 'Regenerate Questions' : 'Generate Questions'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Results Section */}
            {result && (
              <div className="bg-white rounded-2xl shadow-lg border border-green-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Generation Complete!
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold text-gray-900">{result.totalQuestions}</div>
                      <div className="text-sm text-gray-600">Questions Generated</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <Award className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold text-gray-900">{result.totalMarks}</div>
                      <div className="text-sm text-gray-600">Total Marks</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold text-gray-900">{result.sectionsGenerated}</div>
                      <div className="text-sm text-gray-600">Sections</div>
                    </div>
                  </div>

                  {result.generatedAt && (
                    <div className="text-center text-sm text-gray-600">
                      Generated on {new Date(result.generatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                Quick Stats
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Total Tests</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{stats.totalTests}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Generated</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{stats.generatedTests}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-purple-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Free Tests</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{stats.freeTests}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center">
                    <Award className="w-5 h-5 text-orange-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Paid Tests</span>
                  </div>
                  <span className="text-lg font-bold text-orange-600">{stats.paidTests}</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5 flex-shrink-0">1</div>
                  <span>Select a test from the dropdown</span>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5 flex-shrink-0">2</div>
                  <span>Review test details and sections</span>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5 flex-shrink-0">3</div>
                  <span>Click Generate Questions to create the test</span>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5 flex-shrink-0">4</div>
                  <span>Questions are automatically shuffled and organized</span>
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            {generating && (
              <div className="bg-white rounded-2xl shadow-lg border border-blue-200 p-6">
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mr-3" />
                  <div>
                    <div className="font-semibold text-gray-900">Generating Questions</div>
                    <div className="text-sm text-gray-600">Please wait while we create your test...</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicGenerateQuestions;