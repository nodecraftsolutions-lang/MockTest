import { useRef, useMemo, useCallback } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Info } from "lucide-react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

// Register custom fonts
const Font = Quill.import('formats/font');
Font.whitelist = ['sans-serif', 'serif', 'monospace', 'arial', 'times-new-roman', 'courier', 'georgia', 'verdana'];
Quill.register(Font, true);

// Register custom sizes
const Size = Quill.import('attributors/style/size');
Size.whitelist = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '42px', '48px', '56px', '64px', '72px'];
Quill.register(Size, true);

const DescriptionEditor = ({ 
  value, 
  onChange, 
  placeholder = "Enter description...",
  label = "Description",
  required = false,
}) => {
  const { showSuccess, showError } = useToast();
  const quillRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Image upload handler
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
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

      try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await api.post('/tests/upload-question-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          const imageUrl = `${apiUrl}${response.data.data.imageUrl}`;
          
          // Get the editor instance
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            
            // Insert the image at cursor position
            quill.insertEmbed(range?.index || 0, 'image', imageUrl);
            
            // Move cursor after the image
            quill.setSelection((range?.index || 0) + 1);
          }
          
          showSuccess('Image uploaded and inserted successfully');
        }
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to upload image');
      }
    };
  }, [showError, showSuccess, apiUrl]);

  // Rich text editor modules configuration with custom image handler
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': ['sans-serif', 'serif', 'monospace', 'arial', 'times-new-roman', 'courier', 'georgia', 'verdana'] }],
        [{ 'size': ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '42px', '48px', '56px', '64px', '72px'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
  }), [imageHandler]);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      
      {/* Rich Text Editor */}
      <div className="border border-gray-300 rounded-xl overflow-hidden mb-4 description-editor">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="bg-white"
          style={{ minHeight: '300px' }}
        />
      </div>

      {/* Info Box */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Rich Text Editor Features:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Multiple Images:</strong> Click the image icon in the toolbar to upload and insert images anywhere in your text</li>
              <li><strong>Font Styles:</strong> Choose from 8 different font families (sans-serif, serif, monospace, arial, times new roman, courier, georgia, verdana)</li>
              <li><strong>Font Sizes:</strong> Select from 15 different sizes ranging from 10px to 72px</li>
              <li><strong>Text Formatting:</strong> Bold, italic, underline, strikethrough, colors, and background colors</li>
              <li><strong>Advanced Features:</strong> Headers (H1-H6), lists, alignment, quotes, code blocks, subscript, superscript</li>
              <li><strong>Media:</strong> Insert images, videos, and links directly within your content</li>
              <li><strong>Flexible Layout:</strong> Place images anywhere - text can flow above, below, or around images</li>
            </ul>
            <p className="mt-2 text-xs text-blue-700">
              <strong>Tip:</strong> You can resize images after inserting them by clicking and dragging the image corners.
              The formatted content will display exactly the same way for students.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .description-editor .ql-container {
          min-height: 300px;
        }
        .description-editor .ql-editor {
          min-height: 300px;
        }
        .description-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 10px 0;
        }
      `}</style>
    </div>
  );
};

export default DescriptionEditor;
