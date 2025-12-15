import { useRef, useMemo, useCallback } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../utils/quill-setup"; // Must come before ImageResize
import ImageResize from 'quill-image-resize-module';
import { Info } from "lucide-react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

// Register custom fonts and sizes (singleton pattern for hot reload safety)
const initializeQuillFormats = () => {
  try {
    // Register ImageResize
    Quill.register('modules/imageResize', ImageResize);

    const Font = Quill.import('formats/font');
    const Size = Quill.import('formats/size');

    // Only register if not already registered
    if (!Font.whitelist || !Font.whitelist.includes('arial')) {
      Font.whitelist = ['sans-serif', 'serif', 'monospace', 'arial', 'times-new-roman', 'courier', 'georgia', 'verdana'];
      Quill.register(Font, true);
    }

    if (!Size.whitelist || !Size.whitelist.includes('10px')) {
      Size.whitelist = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '42px', '48px', '56px', '64px', '72px'];
      Quill.register(Size, true);
    }
  } catch (error) {
    // Formats already registered or registration error
    console.warn('Quill format registration skipped:', error.message);
  }
};

// Initialize on module load
initializeQuillFormats();

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
  const imageHandlerRef = useRef(null);

  const performImageUpload = async () => {
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

        // Upload to the new database-backed endpoint
        const response = await api.post('/images/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          // The backend returns a relative URL like /api/v1/images/:id
          // We need to prepend the backend base URL to make it absolute for the editor
          let backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

          // If explicitly running on localhost dev port, allow overriding to localhost:8000
          // effectively behaving like the default. 
          // But if on VPS (e.g. 195.35.6.57:5173), we want 195.35.6.57:8000
          if (!import.meta.env.VITE_API_URL && window.location.port === '5173') {
            backendUrl = `${window.location.protocol}//${window.location.hostname}:8000`;
          }
          // If we are in production (same origin), use the current hostname with port 8000
          if (!import.meta.env.VITE_API_URL && window.location.port !== '5173') {
            backendUrl = `${window.location.protocol}//${window.location.hostname}:8000`;
          }

          const imageUrl = `${backendUrl}${response.data.data.imageUrl}`;

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
  };

  // Update ref on every render
  imageHandlerRef.current = performImageUpload;

  // Stable handler for modules
  const imageHandler = useCallback(() => {
    imageHandlerRef.current?.();
  }, []);

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
    imageResize: {
      parchment: Quill.import('parchment'),
      displaySize: true,
      handles: ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'],
      handleStyles: {
        backgroundColor: 'black',
        border: 'none',
        color: 'white'
      },
      modules: ['Resize', 'DisplaySize', 'Toolbar']
    },
    clipboard: {
      matchVisual: false
    }
  }), [imageHandler]);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'blockquote', 'code-block',
    'link', 'image', 'video',
    'width', 'height', 'style' // Added for image resize support
  ];

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && '*'}
      </label>

      {/* Rich Text Editor */}
      <div className="border border-gray-300 rounded-xl mb-4 description-editor">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="bg-white"
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
    </div>
  );
};

export default DescriptionEditor;
