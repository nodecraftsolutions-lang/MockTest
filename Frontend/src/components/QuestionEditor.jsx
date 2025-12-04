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

// Image dimension constants
const IMAGE_DEFAULTS = {
  QUESTION_WIDTH: 100,
  QUESTION_HEIGHT: 300,
  OPTION_WIDTH: 50,
  OPTION_HEIGHT: 200,
  ALIGN: 'left',
  MIN_WIDTH: 10,
  MAX_WIDTH: 100,
  WIDTH_STEP: 5,
  MIN_HEIGHT: 50,
  MAX_HEIGHT: 800,
  HEIGHT_STEP: 50,
};

// Preview Mode Component
const PreviewMode = ({ questionData }) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl">
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Question Preview
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {questionData.section}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {questionData.difficulty}
              </span>
              <span className="text-xs text-gray-600">{questionData.marks} marks</span>
              {questionData.negativeMarks > 0 && (
                <span className="text-xs text-red-600">-{questionData.negativeMarks} for wrong answer</span>
              )}
            </div>
          </div>
        </div>

        {/* Question Text */}
        <div className="text-gray-900 mb-6 leading-relaxed text-lg">
          {questionData.questionHtml ? (
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={createSanitizedHtml(questionData.questionHtml)}
            />
          ) : (
            <p className="font-medium text-gray-500 italic">No question text entered yet...</p>
          )}
        </div>

        {/* Question Image */}
        {questionData.imageUrl && (
          <div className="mb-6">
            <img 
              src={`${apiUrl}${questionData.imageUrl}`}
              alt="Question" 
              style={{
                width: questionData.imageWidth ? `${questionData.imageWidth}%` : '100%',
                height: questionData.imageHeight ? `${questionData.imageHeight}px` : 'auto',
                maxWidth: '100%',
                float: questionData.imageAlign || 'none',
                margin: questionData.imageAlign === 'left' ? '0 1rem 1rem 0' : 
                        questionData.imageAlign === 'right' ? '0 0 1rem 1rem' : 
                        '0 auto',
                display: questionData.imageAlign === 'center' ? 'block' : 'inline'
              }}
              className="rounded-lg border-2 border-gray-200 shadow-md"
            />
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
          {questionData.options.filter(opt => (opt.text && opt.text.trim()) || (opt.html && opt.html.trim()) || opt.imageUrl).map((opt, i) => (
            <label
              key={i}
              className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all shadow-sm
                ${opt.isCorrect
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
                }`}
            >
              <input
                type={questionData.questionType === 'multiple' ? "checkbox" : "radio"}
                checked={opt.isCorrect}
                readOnly
                className="mr-3 accent-blue-600 w-4 h-4 mt-1"
              />
              <div className="text-gray-800 text-base flex-1">
                <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt.html ? (
                  <div 
                    className="inline prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={createSanitizedHtml(opt.html)}
                  />
                ) : (
                  <span>{opt.text || '(Empty option)'}</span>
                )}
                {opt.imageUrl && (
                  <div className="mt-2">
                    <img 
                      src={`${apiUrl}${opt.imageUrl}`}
                      alt={`Option ${String.fromCharCode(65 + i)}`}
                      style={{
                        width: opt.imageWidth ? `${opt.imageWidth}%` : '50%',
                        height: opt.imageHeight ? `${opt.imageHeight}px` : 'auto',
                        maxWidth: '100%',
                        float: opt.imageAlign || 'none',
                        margin: opt.imageAlign === 'left' ? '0 1rem 1rem 0' : 
                                opt.imageAlign === 'right' ? '0 0 1rem 1rem' : 
                                '0 auto',
                        display: opt.imageAlign === 'center' ? 'block' : 'inline'
                      }}
                      className="rounded-lg border border-gray-300"
                    />
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>

        {questionData.options.filter(opt => opt.text.trim() || opt.html.trim() || opt.imageUrl).length === 0 && (
          <p className="text-gray-400 italic text-center py-4">No options added yet...</p>
        )}
      </div>

      {/* Explanation Preview */}
      {(questionData.explanationHtml || questionData.explanation) && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
            Explanation (Shown after test submission)
          </h3>
          <div className="text-gray-700 leading-relaxed">
            {questionData.explanationHtml ? (
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={createSanitizedHtml(questionData.explanationHtml)}
              />
            ) : (
              <p>{questionData.explanation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Edit Mode Component
const EditMode = ({ 
  questionData, 
  setQuestionData, 
  sections, 
  handleSectionChange,
  handleQuestionHtmlChange,
  handleImageUpload,
  handleOptionHtmlChange,
  handleCorrectAnswerToggle,
  handleOptionImageUpload,
  handleExplanationHtmlChange,
  addOption,
  removeOption,
  uploadingImage,
  uploadingOptionImage,
  fileInputRef,
  optionFileInputRefs,
  modules,
  formats
}) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  return (
    <>
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
          Question Text * (Supports rich formatting, emojis, images)
        </label>
        <div className="border border-gray-300 rounded-xl overflow-hidden">
          <ReactQuill
            theme="snow"
            value={questionData.questionHtml}
            onChange={handleQuestionHtmlChange}
            modules={modules}
            formats={formats}
            placeholder="Enter your question here. You can use formatting, emojis (😊), insert images, and more..."
            className="bg-white"
            style={{ height: '200px', marginBottom: '42px' }}
          />
        </div>
      </div>

      {/* Image Upload with Resize Controls */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Question Image (Optional)
        </label>
        <div className="space-y-4">
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
          </div>
          
          {questionData.imageUrl && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-4">
                <img 
                  src={`${apiUrl}${questionData.imageUrl}`}
                  alt="Question" 
                  style={{
                    width: questionData.imageWidth ? `${questionData.imageWidth}%` : '100%',
                    height: questionData.imageHeight ? `${questionData.imageHeight}px` : 'auto',
                    maxWidth: '100%',
                    float: questionData.imageAlign || 'none',
                    margin: questionData.imageAlign === 'left' ? '0 1rem 1rem 0' : 
                            questionData.imageAlign === 'right' ? '0 0 1rem 1rem' : 
                            '0 auto',
                    display: questionData.imageAlign === 'center' ? 'block' : 'inline'
                  }}
                  className="rounded-lg border-2 border-gray-300 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setQuestionData(prev => ({ ...prev, imageUrl: "", imageWidth: IMAGE_DEFAULTS.QUESTION_WIDTH, imageHeight: IMAGE_DEFAULTS.QUESTION_HEIGHT, imageAlign: IMAGE_DEFAULTS.ALIGN }))}
                  className="text-red-500 hover:text-red-700 flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Image Size and Alignment Controls */}
              <div className="mt-4 space-y-4">
                {/* Width Control */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Image Width: {questionData.imageWidth}%
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuestionData(prev => ({ 
                        ...prev, 
                        imageWidth: Math.max(IMAGE_DEFAULTS.MIN_WIDTH, prev.imageWidth - IMAGE_DEFAULTS.WIDTH_STEP) 
                      }))}
                      className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <input
                      type="range"
                      min={IMAGE_DEFAULTS.MIN_WIDTH}
                      max={IMAGE_DEFAULTS.MAX_WIDTH}
                      step={IMAGE_DEFAULTS.WIDTH_STEP}
                      value={questionData.imageWidth}
                      onChange={(e) => setQuestionData(prev => ({ 
                        ...prev, 
                        imageWidth: Number(e.target.value) 
                      }))}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setQuestionData(prev => ({ 
                        ...prev, 
                        imageWidth: Math.min(IMAGE_DEFAULTS.MAX_WIDTH, prev.imageWidth + IMAGE_DEFAULTS.WIDTH_STEP) 
                      }))}
                      className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Height Control */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Image Height: {questionData.imageHeight}px
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuestionData(prev => ({ 
                        ...prev, 
                        imageHeight: Math.max(IMAGE_DEFAULTS.MIN_HEIGHT, prev.imageHeight - IMAGE_DEFAULTS.HEIGHT_STEP) 
                      }))}
                      className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <input
                      type="range"
                      min={IMAGE_DEFAULTS.MIN_HEIGHT}
                      max={IMAGE_DEFAULTS.MAX_HEIGHT}
                      step={IMAGE_DEFAULTS.HEIGHT_STEP}
                      value={questionData.imageHeight}
                      onChange={(e) => setQuestionData(prev => ({ 
                        ...prev, 
                        imageHeight: Number(e.target.value) 
                      }))}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setQuestionData(prev => ({ 
                        ...prev, 
                        imageHeight: Math.min(IMAGE_DEFAULTS.MAX_HEIGHT, prev.imageHeight + IMAGE_DEFAULTS.HEIGHT_STEP) 
                      }))}
                      className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Alignment Control */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Image Position/Alignment
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setQuestionData(prev => ({ ...prev, imageAlign: 'left' }))}
                      className={`px-4 py-2 rounded-lg transition ${
                        questionData.imageAlign === 'left' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      Left
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionData(prev => ({ ...prev, imageAlign: 'center' }))}
                      className={`px-4 py-2 rounded-lg transition ${
                        questionData.imageAlign === 'center' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      Center
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionData(prev => ({ ...prev, imageAlign: 'right' }))}
                      className={`px-4 py-2 rounded-lg transition ${
                        questionData.imageAlign === 'right' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      Right
                    </button>
                  </div>
                </div>
              </div>
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
                  
                  {/* Option Image Upload */}
                  <div className="mt-2">
                    <input
                      type="file"
                      ref={el => optionFileInputRefs.current[index] = el}
                      onChange={(e) => handleOptionImageUpload(index, e.target.files[0])}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => optionFileInputRefs.current[index]?.click()}
                      disabled={uploadingOptionImage === index}
                      className="flex items-center px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400"
                    >
                      <ImageIcon className="w-3 h-3 mr-1" />
                      {uploadingOptionImage === index ? 'Uploading...' : 'Add Image'}
                    </button>
                    
                    {option.imageUrl && (
                      <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <img 
                            src={`${apiUrl}${option.imageUrl}`}
                            alt={`Option ${String.fromCharCode(65 + index)}`}
                            style={{
                              width: option.imageWidth ? `${option.imageWidth}%` : '50%',
                              height: option.imageHeight ? `${option.imageHeight}px` : 'auto',
                              maxWidth: '100%',
                              float: option.imageAlign || 'none',
                              margin: option.imageAlign === 'left' ? '0 1rem 1rem 0' : 
                                      option.imageAlign === 'right' ? '0 0 1rem 1rem' : 
                                      '0 auto',
                              display: option.imageAlign === 'center' ? 'block' : 'inline'
                            }}
                            className="rounded border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newOptions = [...questionData.options];
                              newOptions[index] = { ...newOptions[index], imageUrl: "", imageWidth: IMAGE_DEFAULTS.OPTION_WIDTH, imageHeight: IMAGE_DEFAULTS.OPTION_HEIGHT, imageAlign: IMAGE_DEFAULTS.ALIGN };
                              setQuestionData(prev => ({ ...prev, options: newOptions }));
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Option Image Size and Alignment Controls */}
                        <div className="mt-3 space-y-3">
                          {/* Width Control */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Width: {option.imageWidth}%
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = [...questionData.options];
                                  newOptions[index] = { 
                                    ...newOptions[index], 
                                    imageWidth: Math.max(IMAGE_DEFAULTS.MIN_WIDTH, newOptions[index].imageWidth - IMAGE_DEFAULTS.WIDTH_STEP) 
                                  };
                                  setQuestionData(prev => ({ ...prev, options: newOptions }));
                                }}
                                className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                              >
                                <ZoomOut className="w-3 h-3" />
                              </button>
                              <input
                                type="range"
                                min={IMAGE_DEFAULTS.MIN_WIDTH}
                                max={IMAGE_DEFAULTS.MAX_WIDTH}
                                step={IMAGE_DEFAULTS.WIDTH_STEP}
                                value={option.imageWidth}
                                onChange={(e) => {
                                  const newOptions = [...questionData.options];
                                  newOptions[index] = { 
                                    ...newOptions[index], 
                                    imageWidth: Number(e.target.value) 
                                  };
                                  setQuestionData(prev => ({ ...prev, options: newOptions }));
                                }}
                                className="flex-1 h-2"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = [...questionData.options];
                                  newOptions[index] = { 
                                    ...newOptions[index], 
                                    imageWidth: Math.min(IMAGE_DEFAULTS.MAX_WIDTH, newOptions[index].imageWidth + IMAGE_DEFAULTS.WIDTH_STEP) 
                                  };
                                  setQuestionData(prev => ({ ...prev, options: newOptions }));
                                }}
                                className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                              >
                                <ZoomIn className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Height Control */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Height: {option.imageHeight}px
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = [...questionData.options];
                                  newOptions[index] = { 
                                    ...newOptions[index], 
                                    imageHeight: Math.max(IMAGE_DEFAULTS.MIN_HEIGHT, newOptions[index].imageHeight - IMAGE_DEFAULTS.HEIGHT_STEP) 
                                  };
                                  setQuestionData(prev => ({ ...prev, options: newOptions }));
                                }}
                                className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                              >
                                <ZoomOut className="w-3 h-3" />
                              </button>
                              <input
                                type="range"
                                min={IMAGE_DEFAULTS.MIN_HEIGHT}
                                max={IMAGE_DEFAULTS.MAX_HEIGHT}
                                step={IMAGE_DEFAULTS.HEIGHT_STEP}
                                value={option.imageHeight}
                                onChange={(e) => {
                                  const newOptions = [...questionData.options];
                                  newOptions[index] = { 
                                    ...newOptions[index], 
                                    imageHeight: Number(e.target.value) 
                                  };
                                  setQuestionData(prev => ({ ...prev, options: newOptions }));
                                }}
                                className="flex-1 h-2"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = [...questionData.options];
                                  newOptions[index] = { 
                                    ...newOptions[index], 
                                    imageHeight: Math.min(IMAGE_DEFAULTS.MAX_HEIGHT, newOptions[index].imageHeight + IMAGE_DEFAULTS.HEIGHT_STEP) 
                                  };
                                  setQuestionData(prev => ({ ...prev, options: newOptions }));
                                }}
                                className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                              >
                                <ZoomIn className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Alignment Control */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Position/Alignment
                            </label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = [...questionData.options];
                                  newOptions[index] = { ...newOptions[index], imageAlign: 'left' };
                                  setQuestionData(prev => ({ ...prev, options: newOptions }));
                                }}
                                className={`px-3 py-1 text-xs rounded transition ${
                                  option.imageAlign === 'left' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                              >
                                Left
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = [...questionData.options];
                                  newOptions[index] = { ...newOptions[index], imageAlign: 'center' };
                                  setQuestionData(prev => ({ ...prev, options: newOptions }));
                                }}
                                className={`px-3 py-1 text-xs rounded transition ${
                                  option.imageAlign === 'center' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                              >
                                Center
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = [...questionData.options];
                                  newOptions[index] = { ...newOptions[index], imageAlign: 'right' };
                                  setQuestionData(prev => ({ ...prev, options: newOptions }));
                                }}
                                className={`px-3 py-1 text-xs rounded transition ${
                                  option.imageAlign === 'right' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                              >
                                Right
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
          Explanation (Optional - Shown to students after test submission)
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
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Rich Text Features Available:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Text formatting: bold, italic, underline, strikethrough, colors, fonts, sizes</li>
              <li>Lists: ordered and bullet point formats</li>
              <li>Alignment: left, center, right, and justify text; RTL support</li>
              <li>Special features: quotes, code blocks, subscript, superscript</li>
              <li>Media: Insert links and images directly in text</li>
              <li>Emojis: Just copy-paste emojis directly (😊 🎯 ✨ 📚 💡)</li>
              <li>Images: Upload images with custom width & height controls</li>
              <li>Image positioning: Align images left, center, or right</li>
              <li>Preview: Click the Preview button to see how students will see this question</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

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
    imageWidth: IMAGE_DEFAULTS.QUESTION_WIDTH,
    imageHeight: IMAGE_DEFAULTS.QUESTION_HEIGHT,
    imageAlign: IMAGE_DEFAULTS.ALIGN,
    explanation: "",
    explanationHtml: "",
    options: [
      { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: IMAGE_DEFAULTS.OPTION_WIDTH, imageHeight: IMAGE_DEFAULTS.OPTION_HEIGHT, imageAlign: IMAGE_DEFAULTS.ALIGN },
      { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: IMAGE_DEFAULTS.OPTION_WIDTH, imageHeight: IMAGE_DEFAULTS.OPTION_HEIGHT, imageAlign: IMAGE_DEFAULTS.ALIGN },
      { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: IMAGE_DEFAULTS.OPTION_WIDTH, imageHeight: IMAGE_DEFAULTS.OPTION_HEIGHT, imageAlign: IMAGE_DEFAULTS.ALIGN },
      { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: IMAGE_DEFAULTS.OPTION_WIDTH, imageHeight: IMAGE_DEFAULTS.OPTION_HEIGHT, imageAlign: IMAGE_DEFAULTS.ALIGN }
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
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'blockquote', 'code-block',
    'link', 'image'
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
        options: [...prev.options, { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: IMAGE_DEFAULTS.OPTION_WIDTH, imageHeight: IMAGE_DEFAULTS.OPTION_HEIGHT, imageAlign: IMAGE_DEFAULTS.ALIGN }]
      }));
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

    const validOptions = questionData.options.filter(opt => 
      (opt.text && opt.text.trim()) || (opt.html && opt.html.trim()) || opt.imageUrl
    );
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
        (opt.text && opt.text.trim()) || (opt.html && opt.html.trim()) || opt.imageUrl
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
          imageWidth: IMAGE_DEFAULTS.QUESTION_WIDTH,
          imageHeight: IMAGE_DEFAULTS.QUESTION_HEIGHT,
          imageAlign: IMAGE_DEFAULTS.ALIGN,
          explanation: "",
          explanationHtml: "",
          options: [
            { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: IMAGE_DEFAULTS.OPTION_WIDTH, imageHeight: IMAGE_DEFAULTS.OPTION_HEIGHT, imageAlign: IMAGE_DEFAULTS.ALIGN },
            { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: IMAGE_DEFAULTS.OPTION_WIDTH, imageHeight: IMAGE_DEFAULTS.OPTION_HEIGHT, imageAlign: IMAGE_DEFAULTS.ALIGN },
            { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: IMAGE_DEFAULTS.OPTION_WIDTH, imageHeight: IMAGE_DEFAULTS.OPTION_HEIGHT, imageAlign: IMAGE_DEFAULTS.ALIGN },
            { text: "", html: "", isCorrect: false, imageUrl: "", imageWidth: IMAGE_DEFAULTS.OPTION_WIDTH, imageHeight: IMAGE_DEFAULTS.OPTION_HEIGHT, imageAlign: IMAGE_DEFAULTS.ALIGN }
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
};

export default QuestionEditor;
