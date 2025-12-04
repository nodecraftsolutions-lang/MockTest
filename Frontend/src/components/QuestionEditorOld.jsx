import { useState, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { 
  Image as ImageIcon, 
  Save, 
  X, 
  Plus,
  Trash2,
  AlertCircle,
  Eye,
  Edit,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";
import { createSanitizedHtml } from "../utils/sanitize";

const QuestionEditor = ({ testId, sections, onQuestionAdded, onClose }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingOptionImage, setUploadingOptionImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);
  const optionFileInputRefs = useRef([]);

  const [questionData, setQuestionData] = useState({
    questionText: "",
    questionHtml: "",
    questionType: "single",
    section: sections.length > 0 ? sections[0].sectionName : "",
    marks: sections.length > 0 ? sections[0].marksPerQuestion : 1,
    negativeMarks: sections.length > 0 ? sections[0].negativeMarking : 0,
    difficulty: "Medium",
    imageUrl: "",
    imageWidth: 100,
    imageHeight: "auto",
    explanation: "",
    explanationHtml: "",
    options: [
      { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: 100 },
      { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: 100 },
      { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: 100 },
      { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: 100 }
    ],
    tags: []
  });

  // Rich text editor modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'align',
    'blockquote', 'code-block',
    'link'
  ];

  const handleQuestionHtmlChange = (content, delta, source, editor) => {
    setQuestionData(prev => ({
      ...prev,
      questionHtml: content,
      questionText: editor.getText()
    }));
  };

  const handleExplanationHtmlChange = (content, delta, source, editor) => {
    setQuestionData(prev => ({
      ...prev,
      explanationHtml: content,
      explanation: editor.getText()
    }));
  };

  const handleOptionHtmlChange = (index, content, editor) => {
    const newOptions = [...questionData.options];
    newOptions[index] = {
      ...newOptions[index],
      html: content,
      text: editor.getText()
    };
    setQuestionData(prev => ({ ...prev, options: newOptions }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/tests/upload-question-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setQuestionData(prev => ({
          ...prev,
          imageUrl: response.data.data.imageUrl
        }));
        showSuccess('Image uploaded successfully');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSectionChange = (sectionName) => {
    const section = sections.find(s => s.sectionName === sectionName);
    if (section) {
      setQuestionData(prev => ({
        ...prev,
        section: sectionName,
        marks: section.marksPerQuestion,
        negativeMarks: section.negativeMarking
      }));
    }
  };

  const handleCorrectAnswerToggle = (index) => {
    const newOptions = [...questionData.options];
    
    if (questionData.questionType === 'single') {
      // For single choice, only one option can be correct
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === index;
      });
    } else {
      // For multiple choice, toggle the selected option
      newOptions[index].isCorrect = !newOptions[index].isCorrect;
    }
    
    setQuestionData(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    if (questionData.options.length < 6) {
      setQuestionData(prev => ({
        ...prev,
        options: [...prev.options, { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: 100 }]
      }));
    }
  };

  const handleOptionImageUpload = async (index, file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image size should be less than 5MB');
      return;
    }

    setUploadingOptionImage(index);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/tests/upload-question-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const newOptions = [...questionData.options];
        newOptions[index] = {
          ...newOptions[index],
          imageUrl: response.data.data.imageUrl
        };
        setQuestionData(prev => ({ ...prev, options: newOptions }));
        showSuccess('Image uploaded successfully');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingOptionImage(null);
    }
  };

  const removeOption = (index) => {
    if (questionData.options.length > 2) {
      const newOptions = questionData.options.filter((_, i) => i !== index);
      setQuestionData(prev => ({ ...prev, options: newOptions }));
    }
  };

  const validateQuestion = () => {
    if (!questionData.questionText.trim() && !questionData.questionHtml.trim()) {
      showError('Question text is required');
      return false;
    }

    const validOptions = questionData.options.filter(opt => opt.text.trim() || opt.html.trim());
    if (validOptions.length < 2) {
      showError('At least 2 options are required');
      return false;
    }

    const correctOptions = questionData.options.filter(opt => opt.isCorrect);
    if (correctOptions.length === 0) {
      showError('Please mark at least one correct answer');
      return false;
    }

    if (questionData.questionType === 'single' && correctOptions.length > 1) {
      showError('Only one correct answer allowed for single choice questions');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateQuestion()) return;

    setLoading(true);
    try {
      // Filter out empty options
      const validOptions = questionData.options.filter(opt => 
        opt.text.trim() || opt.html.trim()
      );

      // Calculate correct answer
      let correctAnswer;
      if (questionData.questionType === 'single') {
        correctAnswer = validOptions.findIndex(opt => opt.isCorrect) + 1;
      } else {
        correctAnswer = validOptions
          .map((opt, idx) => opt.isCorrect ? idx + 1 : null)
          .filter(idx => idx !== null);
      }

      const payload = {
        ...questionData,
        options: validOptions,
        correctAnswer
      };

      const response = await api.post(`/tests/${testId}/questions`, payload);
      
      if (response.data.success) {
        showSuccess('Question added successfully');
        if (onQuestionAdded) {
          onQuestionAdded(response.data.data);
        }
        // Reset form
        setQuestionData({
          questionText: "",
          questionHtml: "",
          questionType: "single",
          section: sections[0]?.sectionName || "",
          marks: sections[0]?.marksPerQuestion || 1,
          negativeMarks: sections[0]?.negativeMarking || 0,
          difficulty: "Medium",
          imageUrl: "",
          imageWidth: 100,
          imageHeight: "auto",
          explanation: "",
          explanationHtml: "",
          options: [
            { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: 100 },
            { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: 100 },
            { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: 100 },
            { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: 100 }
          ],
          tags: []
        });
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  // Early return if no sections
  if (!sections || sections.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Sections Available</h3>
            <p className="text-gray-600 mb-6">
              Please configure test sections before adding questions.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">
              {showPreview ? 'Preview - Student View' : 'Add New Question'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition"
            >
              {showPreview ? <Edit className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {showPreview ? (
            <PreviewMode questionData={questionData} />
          ) : (
            <EditMode 
              questionData={questionData}
              setQuestionData={setQuestionData}
              sections={sections}
              handleSectionChange={handleSectionChange}
              handleQuestionHtmlChange={handleQuestionHtmlChange}
              handleImageUpload={handleImageUpload}
              handleOptionHtmlChange={handleOptionHtmlChange}
              handleCorrectAnswerToggle={handleCorrectAnswerToggle}
              handleOptionImageUpload={handleOptionImageUpload}
              handleExplanationHtmlChange={handleExplanationHtmlChange}
              addOption={addOption}
              removeOption={removeOption}
              uploadingImage={uploadingImage}
              uploadingOptionImage={uploadingOptionImage}
              fileInputRef={fileInputRef}
              optionFileInputRefs={optionFileInputRefs}
              modules={modules}
              formats={formats}
            />
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition disabled:bg-gray-400"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
          {/* Question Type and Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Question Type *
              </label>
              <select
                value={questionData.questionType}
                onChange={(e) => setQuestionData(prev => ({ ...prev, questionType: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="single">Single Choice</option>
                <option value="multiple">Multiple Choice</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Section *
              </label>
              <select
                value={questionData.section}
                onChange={(e) => handleSectionChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {sections.map((section) => (
                  <option key={section.sectionName} value={section.sectionName}>
                    {section.sectionName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={questionData.difficulty}
                onChange={(e) => setQuestionData(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Marks Configuration */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Marks per Question
              </label>
              <input
                type="number"
                value={questionData.marks}
                onChange={(e) => setQuestionData(prev => ({ ...prev, marks: Number(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0.25"
                step="0.25"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Negative Marks
              </label>
              <input
                type="number"
                value={questionData.negativeMarks}
                onChange={(e) => setQuestionData(prev => ({ ...prev, negativeMarks: Number(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.25"
              />
            </div>
          </div>

          {/* Question Text Editor */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Question Text * (Supports rich formatting, emojis, tables)
            </label>
            <div className="border border-gray-300 rounded-xl overflow-hidden">
              <ReactQuill
                theme="snow"
                value={questionData.questionHtml}
                onChange={handleQuestionHtmlChange}
                modules={modules}
                formats={formats}
                placeholder="Enter your question here. You can use formatting, emojis (😊), and create tables..."
                className="bg-white"
                style={{ height: '200px', marginBottom: '42px' }}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Question Image (Optional)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition disabled:bg-gray-400"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
              </button>
              {questionData.imageUrl && (
                <div className="flex items-center gap-2">
                  <img 
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${questionData.imageUrl}`}
                    alt="Question" 
                    className="h-20 w-20 object-cover rounded-lg border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setQuestionData(prev => ({ ...prev, imageUrl: "" }))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                Options * (Select correct answer{questionData.questionType === 'multiple' ? 's' : ''})
              </label>
              <button
                type="button"
                onClick={addOption}
                disabled={questionData.options.length >= 6}
                className="flex items-center px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:bg-gray-400"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Option
              </button>
            </div>

            <div className="space-y-4">
              {questionData.options.map((option, index) => (
                <div key={index} className="border border-gray-300 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <input
                      type={questionData.questionType === 'single' ? 'radio' : 'checkbox'}
                      checked={option.isCorrect}
                      onChange={() => handleCorrectAnswerToggle(index)}
                      className="mt-2 w-5 h-5 accent-blue-600"
                    />
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Option {String.fromCharCode(65 + index)}
                      </label>
                      <ReactQuill
                        theme="snow"
                        value={option.html}
                        onChange={(content, delta, source, editor) => handleOptionHtmlChange(index, content, editor)}
                        modules={modules}
                        formats={formats}
                        placeholder={`Enter option ${String.fromCharCode(65 + index)}...`}
                        style={{ height: '100px', marginBottom: '42px' }}
                      />
                    </div>
                    {questionData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="mt-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation Editor */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Explanation (Optional)
            </label>
            <div className="border border-gray-300 rounded-xl overflow-hidden">
              <ReactQuill
                theme="snow"
                value={questionData.explanationHtml}
                onChange={handleExplanationHtmlChange}
                modules={modules}
                formats={formats}
                placeholder="Enter explanation for the correct answer..."
                className="bg-white"
                style={{ height: '150px', marginBottom: '42px' }}
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Rich Text Features Available:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Text formatting: bold, italic, underline, colors, fonts, sizes</li>
                  <li>Lists, quotes, code blocks, and text alignment</li>
                  <li>Emojis: Just copy-paste emojis directly (😊 🎯 ✨)</li>
                  <li>Images: Upload images for questions</li>
                  <li>Special symbols: Use your system's symbol picker or copy-paste</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition disabled:bg-gray-400"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;
