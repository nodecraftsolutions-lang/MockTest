import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Plus, 
  Trash2, 
  Edit, 
  ArrowLeft,
  BookOpen,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import api from "../../../api/axios";
import { useToast } from "../../../context/ToastContext";
import QuestionEditor from "../../../components/QuestionEditor";
import { createSanitizedHtml } from "../../../utils/sanitize";
import { getImageStyles } from "../../../utils/imageHelpers";

const QuestionManagement = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedSection, setSelectedSection] = useState("all");

  useEffect(() => {
    fetchTestAndQuestions();
  }, [testId]);

  const fetchTestAndQuestions = async () => {
    setLoading(true);
    try {
      // Fetch test details
      const testResponse = await api.get(`/tests/${testId}`);
      if (testResponse.data.success) {
        setTest(testResponse.data.data.test);
      }

      // Fetch questions
      const questionsResponse = await api.get(`/tests/${testId}/questions`);
      if (questionsResponse.data.success) {
        setQuestions(questionsResponse.data.data.questions);
      }
    } catch (error) {
      showError('Failed to load test data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionAdded = (data) => {
    showSuccess('Question added successfully');
    fetchTestAndQuestions();
    // Don't close the editor, allow adding multiple questions
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const response = await api.delete(`/tests/${testId}/questions/${questionId}`);
      if (response.data.success) {
        showSuccess('Question deleted successfully');
        fetchTestAndQuestions();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete question');
    }
  };

  const getFilteredQuestions = () => {
    if (selectedSection === "all") {
      return questions;
    }
    return questions.filter(q => q.section === selectedSection);
  };

  const getSectionStats = (sectionName) => {
    const sectionQuestions = questions.filter(q => q.section === sectionName);
    return sectionQuestions.length;
  };

  const renderQuestionContent = (question) => {
    if (question.questionHtml) {
      return (
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={createSanitizedHtml(question.questionHtml)}
        />
      );
    }
    return <p className="text-gray-900">{question.questionText}</p>;
  };

  // Helper function to construct image URL
  const constructImageUrl = (url) => {
    if (!url) return '';
    // If it's already a full URL, return as is
    if (url.startsWith('http')) {
      return url;
    }
    // Otherwise prepend the API URL
    const apiUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.host);
    return `${apiUrl}${url}`;
  };

  const renderOptionContent = (option) => {
    return (
      <div>
        {option.html ? (
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={createSanitizedHtml(option.html)}
          />
        ) : (
          <span>{option.text || '(No text)'}</span>
        )}
        {option.imageUrl && (
          <div className="mt-2">
            <img 
              src={constructImageUrl(option.imageUrl)}
              alt="Option"
              style={getImageStyles(option.imageAlign, option.imageWidth, option.imageHeight)}
              className="rounded border border-gray-300"
            />
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  const filteredQuestions = getFilteredQuestions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gray-900">Manage Questions</h1>
              <p className="text-gray-600 mt-1">{test?.title}</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{questions.length}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              {test?.sections.map((section) => (
                <div key={section.sectionName} className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {getSectionStats(section.sectionName)}/{section.questionCount}
                  </div>
                  <div className="text-sm text-gray-600">{section.sectionName}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSection("all")}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedSection === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 hover:bg-blue-50"
                }`}
              >
                All Questions ({questions.length})
              </button>
              {test?.sections.map((section) => (
                <button
                  key={section.sectionName}
                  onClick={() => setSelectedSection(section.sectionName)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    selectedSection === section.sectionName
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-blue-50"
                  }`}
                >
                  {section.sectionName} ({getSectionStats(section.sectionName)})
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowEditor(true)}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Question
            </button>
          </div>
        </div>

        {/* Questions List */}
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Questions Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start adding questions to this test using the "Add Question" button above.
            </p>
            <button
              onClick={() => setShowEditor(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add First Question
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question, index) => (
              <div
                key={question.questionId}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-700 font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                          {question.section}
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                          {question.difficulty}
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          {question.marks} marks
                        </span>
                        {question.negativeMarks > 0 && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                            -{question.negativeMarks} negative
                          </span>
                        )}
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                          {question.questionType === 'single' ? 'Single Choice' : 'Multiple Choice'}
                        </span>
                      </div>
                      
                      {/* Question Content */}
                      <div className="mb-4">
                        {renderQuestionContent(question)}
                      </div>

                      {/* Question Image */}
                      {question.imageUrl && (
                        <div className="mb-4">
                          <img 
                            src={constructImageUrl(question.imageUrl)}
                            alt="Question" 
                            style={getImageStyles(question.imageAlign, question.imageWidth, question.imageHeight)}
                            className="rounded-lg border-2 border-gray-200"
                          />
                        </div>
                      )}

                      {/* Options */}
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`flex items-start p-3 rounded-lg border-2 ${
                              option.isCorrect
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <span className="flex-shrink-0 font-semibold mr-3 text-gray-700">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <div className="flex-1">
                              {renderOptionContent(option)}
                            </div>
                            {option.isCorrect && (
                              <CheckCircle className="w-5 h-5 text-green-600 ml-2 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Explanation */}
                      {(question.explanation || question.explanationHtml) && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-semibold text-blue-800 mb-2">Explanation:</p>
                          {question.explanationHtml ? (
                            <div 
                              className="prose prose-sm max-w-none text-blue-900"
                              dangerouslySetInnerHTML={createSanitizedHtml(question.explanationHtml)}
                            />
                          ) : (
                            <p className="text-sm text-blue-900">{question.explanation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleDeleteQuestion(question.questionId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Question"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Question Editor Modal */}
      {showEditor && test && (
        <QuestionEditor
          testId={testId}
          sections={test.sections}
          onQuestionAdded={handleQuestionAdded}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
};

export default QuestionManagement;
