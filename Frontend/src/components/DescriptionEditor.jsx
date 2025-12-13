import { useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { 
  Image as ImageIcon, 
  X,
  ZoomIn,
  ZoomOut,
  Info
} from "lucide-react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";
import { getImageStyles } from "../utils/imageHelpers";

// Image dimension constants
const IMAGE_DEFAULTS = {
  WIDTH: 100,
  HEIGHT: 300,
  ALIGN: 'left',
  MIN_WIDTH: 10,
  MAX_WIDTH: 100,
  WIDTH_STEP: 5,
  MIN_HEIGHT: 50,
  MAX_HEIGHT: 800,
  HEIGHT_STEP: 50,
};

const DescriptionEditor = ({ 
  value, 
  onChange, 
  placeholder = "Enter description...",
  label = "Description",
  required = false,
  imageUrl = "",
  imageWidth = IMAGE_DEFAULTS.WIDTH,
  imageHeight = IMAGE_DEFAULTS.HEIGHT,
  imageAlign = IMAGE_DEFAULTS.ALIGN,
  onImageUpdate,
  uploadingImage = false,
  onUploadingChange
}) => {
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Rich text editor modules configuration
  const modules = {
    toolbar: {
      container: [
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
    },
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

    onUploadingChange(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/tests/upload-question-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        onImageUpdate({
          imageUrl: response.data.data.imageUrl,
          imageWidth: IMAGE_DEFAULTS.WIDTH,
          imageHeight: IMAGE_DEFAULTS.HEIGHT,
          imageAlign: IMAGE_DEFAULTS.ALIGN
        });
        showSuccess('Image uploaded successfully');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to upload image');
    } finally {
      onUploadingChange(false);
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      
      {/* Rich Text Editor */}
      <div className="border border-gray-300 rounded-xl overflow-hidden mb-4">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="bg-white"
          style={{ height: '200px', marginBottom: '42px' }}
        />
      </div>

      {/* Image Upload Section */}
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
        
        {imageUrl && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-start gap-4 mb-4">
              <img 
                src={`${apiUrl}${imageUrl}`}
                alt="Description" 
                style={getImageStyles(imageAlign, imageWidth, imageHeight)}
                className="rounded-lg border-2 border-gray-300 shadow-sm"
              />
              <button
                type="button"
                onClick={() => onImageUpdate({
                  imageUrl: "",
                  imageWidth: IMAGE_DEFAULTS.WIDTH,
                  imageHeight: IMAGE_DEFAULTS.HEIGHT,
                  imageAlign: IMAGE_DEFAULTS.ALIGN
                })}
                className="text-red-500 hover:text-red-700 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Image Size and Alignment Controls */}
            <div className="space-y-4">
              {/* Width Control */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Image Width: {imageWidth}%
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onImageUpdate({
                      imageUrl,
                      imageWidth: Math.max(IMAGE_DEFAULTS.MIN_WIDTH, imageWidth - IMAGE_DEFAULTS.WIDTH_STEP),
                      imageHeight,
                      imageAlign
                    })}
                    className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min={IMAGE_DEFAULTS.MIN_WIDTH}
                    max={IMAGE_DEFAULTS.MAX_WIDTH}
                    step={IMAGE_DEFAULTS.WIDTH_STEP}
                    value={imageWidth}
                    onChange={(e) => onImageUpdate({
                      imageUrl,
                      imageWidth: Number(e.target.value),
                      imageHeight,
                      imageAlign
                    })}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => onImageUpdate({
                      imageUrl,
                      imageWidth: Math.min(IMAGE_DEFAULTS.MAX_WIDTH, imageWidth + IMAGE_DEFAULTS.WIDTH_STEP),
                      imageHeight,
                      imageAlign
                    })}
                    className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Height Control */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Image Height: {imageHeight}px
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onImageUpdate({
                      imageUrl,
                      imageWidth,
                      imageHeight: Math.max(IMAGE_DEFAULTS.MIN_HEIGHT, imageHeight - IMAGE_DEFAULTS.HEIGHT_STEP),
                      imageAlign
                    })}
                    className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min={IMAGE_DEFAULTS.MIN_HEIGHT}
                    max={IMAGE_DEFAULTS.MAX_HEIGHT}
                    step={IMAGE_DEFAULTS.HEIGHT_STEP}
                    value={imageHeight}
                    onChange={(e) => onImageUpdate({
                      imageUrl,
                      imageWidth,
                      imageHeight: Number(e.target.value),
                      imageAlign
                    })}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => onImageUpdate({
                      imageUrl,
                      imageWidth,
                      imageHeight: Math.min(IMAGE_DEFAULTS.MAX_HEIGHT, imageHeight + IMAGE_DEFAULTS.HEIGHT_STEP),
                      imageAlign
                    })}
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
                    onClick={() => onImageUpdate({
                      imageUrl,
                      imageWidth,
                      imageHeight,
                      imageAlign: 'left'
                    })}
                    className={`px-4 py-2 rounded-lg transition ${
                      imageAlign === 'left' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => onImageUpdate({
                      imageUrl,
                      imageWidth,
                      imageHeight,
                      imageAlign: 'center'
                    })}
                    className={`px-4 py-2 rounded-lg transition ${
                      imageAlign === 'center' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() => onImageUpdate({
                      imageUrl,
                      imageWidth,
                      imageHeight,
                      imageAlign: 'right'
                    })}
                    className={`px-4 py-2 rounded-lg transition ${
                      imageAlign === 'right' 
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

      {/* Info Box */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Rich Text Features Available:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Text formatting: bold, italic, underline, strikethrough, colors, fonts, sizes</li>
              <li>Lists: ordered and bullet point formats</li>
              <li>Alignment: left, center, right, and justify text</li>
              <li>Special features: quotes, code blocks, subscript, superscript</li>
              <li>Media: Insert links and images directly in text using the toolbar</li>
              <li>Images: Upload images with custom width & height controls</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DescriptionEditor;
