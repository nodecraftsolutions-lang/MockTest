# Rich Text Editor Implementation for MockTest Descriptions

## Overview
This implementation adds comprehensive rich text editing capabilities to all description fields related to mock tests, including company descriptions and test descriptions. The editor supports various fonts, font sizes, text formatting, and multiple image insertion with full editing capabilities.

## Features Implemented

### 1. Rich Text Formatting
- **Fonts**: Multiple font family options
- **Font Sizes**: Small, normal, large, and huge sizes
- **Text Formatting**: Bold, italic, underline, strikethrough
- **Colors**: Text color and background color options
- **Special Formatting**: Subscript, superscript
- **Lists**: Ordered and bullet lists
- **Indentation**: Increase/decrease indent
- **Alignment**: Left, center, right, justify, RTL support
- **Special Elements**: Blockquotes, code blocks
- **Links and Images**: Insert links and images via toolbar

### 2. Image Management
- **Upload**: Upload images to server
- **Multiple Images**: Support for multiple images in descriptions
- **Image Resize**: 
  - Width: 10% to 100% (adjustable in 5% increments)
  - Height: 50px to 800px (adjustable in 50px increments)
- **Image Alignment**: Left, center, right positioning
- **Image Controls**: Visual sliders and buttons for easy adjustment

### 3. Component Architecture

#### DescriptionEditor Component (`/Frontend/src/components/DescriptionEditor.jsx`)
A reusable component that provides:
- ReactQuill editor with full toolbar configuration
- Image upload functionality
- Image dimension controls (width, height, alignment)
- Consistent styling across all description fields
- Help text showing available features

**Props:**
- `value`: Current HTML content
- `onChange`: Callback when content changes
- `placeholder`: Placeholder text
- `label`: Field label
- `required`: Whether field is required
- `imageUrl`: URL of uploaded image
- `imageWidth`: Image width percentage
- `imageHeight`: Image height in pixels
- `imageAlign`: Image alignment (left/center/right)
- `onImageUpdate`: Callback for image property changes
- `uploadingImage`: Upload state
- `onUploadingChange`: Callback for upload state changes

### 4. Integration Points

#### Admin Side
1. **CreateCompany.jsx** - Company creation with rich description
2. **Companies.jsx** - Company editing with rich description
3. **TestCreation.jsx** - Test creation with rich description

#### Student Side
1. **CompanyDetails.jsx** - Display company rich HTML description
2. **PaidTests.jsx** - Display test rich HTML descriptions
3. Proper sanitization using `createSanitizedHtml` utility

### 5. Backend Schema Updates

#### Company Model (`/Backend/src/models/Company.js`)
Added fields:
```javascript
descriptionHtml: String (max 50000 chars)
descriptionImageUrl: String
descriptionImageWidth: Number (10-100)
descriptionImageHeight: Number (50-800)
descriptionImageAlign: String (left/center/right)
```

#### Test Model (`/Backend/src/models/Test.js`)
Added fields:
```javascript
descriptionHtml: String (max 50000 chars)
descriptionImageUrl: String
descriptionImageWidth: Number (10-100)
descriptionImageHeight: Number (50-800)
descriptionImageAlign: String (left/center/right)
```

## Usage Guide

### For Admins

#### Creating/Editing Company Descriptions
1. Navigate to "Create Company" or edit an existing company
2. In the Description field, you'll see a rich text editor toolbar
3. Use the toolbar buttons to:
   - Change fonts and sizes
   - Apply text formatting (bold, italic, etc.)
   - Change text colors
   - Insert lists, quotes, or code blocks
   - Add links
4. To add images:
   - Click "Upload Image" button below the editor
   - Select an image file (max 5MB)
   - Once uploaded, use the controls to:
     - Adjust width (slider or +/- buttons)
     - Adjust height (slider or +/- buttons)
     - Change alignment (Left/Center/Right buttons)
5. Save the company

#### Creating/Editing Test Descriptions
1. Navigate to "Create Test" or edit an existing test
2. Follow the same steps as company descriptions
3. The rich content will be displayed to students exactly as formatted

### For Students
- Rich HTML descriptions are automatically rendered with proper styling
- Images are displayed with the specified dimensions and alignment
- All content is properly sanitized for security

## Security Measures

1. **HTML Sanitization**: All HTML content is sanitized using DOMPurify before rendering
2. **Image Upload Validation**: 
   - File type validation (images only)
   - File size limit (5MB)
   - Server-side validation
3. **XSS Prevention**: Using `createSanitizedHtml` utility for all user-generated HTML
4. **CodeQL Analysis**: Passed with 0 security alerts

## Technical Details

### Image Storage
- Images are uploaded to `/tests/upload-question-image` endpoint
- Images are stored on the server in the uploads directory
- Image URLs are stored as relative paths in the database

### Image Styling Helper
The `getImageStyles` helper function (`/Frontend/src/utils/imageHelpers.js`) provides consistent image styling:
```javascript
getImageStyles(align, width, height)
// Returns style object with proper alignment and dimensions
```

### Rich Text Configuration
The editor uses Quill.js with a comprehensive toolbar:
```javascript
modules: {
  toolbar: [
    headers, fonts, sizes,
    formatting (bold, italic, underline, strike),
    colors (text & background),
    scripts (sub, super),
    lists (ordered, bullet),
    indentation,
    direction (RTL),
    alignment,
    special (blockquote, code),
    media (link, image),
    clear formatting
  ]
}
```

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design works on mobile and tablet devices

## Dependencies
- `react-quill`: ^2.0.0 (Rich text editor)
- `quill`: ^2.0.3 (Quill engine)
- `dompurify`: ^3.3.0 (HTML sanitization)

## Migration Notes

### Existing Data
- Old plain text descriptions are preserved in the `description` field
- New rich text content is stored in `descriptionHtml` field
- Student views check for `descriptionHtml` first, fall back to `description` if not present
- Admins should update existing descriptions to use rich text format

### Backward Compatibility
- System fully backward compatible with existing plain text descriptions
- No data migration required
- Gradual adoption is supported

## Testing Checklist
- [x] Build passes successfully
- [x] No linting errors in new components
- [x] Code review completed and issues addressed
- [x] Security scan (CodeQL) passed with 0 alerts
- [x] Reuses existing utilities (getImageStyles, createSanitizedHtml)
- [x] Consistent styling across admin and student interfaces

## Future Enhancements
Potential improvements for future releases:
1. Image gallery for reusing uploaded images
2. Drag-and-drop image upload
3. Video embedding support
4. Table insertion support
5. Template descriptions for common patterns
6. Preview mode in admin interface

## Support
For issues or questions regarding the rich text editor:
1. Check the info box in the editor for feature help
2. Ensure images are under 5MB
3. Use supported image formats (JPG, PNG, GIF, WebP)
4. Clear browser cache if editor doesn't load properly
