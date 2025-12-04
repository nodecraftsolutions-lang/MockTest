# Enhanced Question Editor - User Guide

## Overview

The MockTest platform now features a significantly enhanced question editor with powerful new capabilities including:
- **Image Upload with Flexible Resizing** for both questions and options
- **Live Preview Mode** showing exactly how questions appear to students
- **Rich Text Formatting** for questions, options, and explanations
- **Direct Question Management** from test interface

## Key Features

### 1. Image Support with Flexible Dimensions

#### Question Images
- Upload images directly to questions
- **Adjustable Width**: Resize images from 10% to 100% using intuitive controls
  - Slider control for precise adjustment
  - Quick zoom in/out buttons (+10% / -10%)
  - Visual preview of current size
- Images maintain aspect ratio automatically
- Maximum file size: 5MB
- Supported formats: JPG, JPEG, PNG, GIF, WEBP

#### Option Images
- **NEW**: Each option can now have its own image
- Same flexible resizing controls as question images
- Default width: 50% (adjustable from 10% to 100%)
- Perfect for visual comparison questions, diagrams, or charts

### 2. Preview Mode

#### How to Use Preview
1. Click the **Preview** button in the editor header (eye icon)
2. View your question exactly as students will see it
3. Check image sizes, formatting, and layout
4. Click **Edit** to return to editing mode

#### What Preview Shows
- Question text with full formatting
- Question image at configured size
- All options with their text/formatting and images
- Correct answer indicators (green highlighting)
- Explanation section (if provided)
- Section, difficulty, and marks information

### 3. Enhanced Rich Text Editor

#### Available Formatting
- **Text Styles**: Bold, italic, underline, strikethrough
- **Fonts & Sizes**: Multiple font families and text sizes
- **Colors**: Text color and background color
- **Alignment**: Left, center, right, justify
- **Lists**: Ordered and unordered lists
- **Special Characters**: Mathematical symbols, subscript, superscript
- **Code Blocks**: For programming questions
- **Headers**: H1-H6 heading styles

#### Emojis and Symbols
- Copy-paste emojis directly: 😊 🎯 ✨ 📚 💡
- Mathematical symbols: ∑ ∏ √ ∞ ≈ ≠ ± × ÷
- Greek letters: α β γ δ ε π θ

### 4. Comprehensive Explanation Support

- Add detailed explanations for correct answers
- Full rich text formatting support
- Shown to students after test submission
- Preview available in editor

### 5. Direct Question Management

#### From Test Management Page
1. Navigate to **Admin → Tests**
2. Find your test in the list
3. Click the **Manage Questions** icon (list with plus sign) - first icon in the actions column
4. Opens the Question Management page for that specific test

#### Adding Questions
1. On the Question Management page, click **Add Question**
2. Fill in the question details:
   - Select question type (Single/Multiple Choice)
   - Choose section
   - Set difficulty and marks
   - Enter question text with rich formatting
   - Upload and resize question image (optional)
3. Add options:
   - Enter option text with formatting
   - Upload and resize option images (optional)
   - Mark correct answer(s)
   - Add/remove options as needed (2-6 options)
4. Add explanation (optional)
5. **Click Preview** to see how it looks to students
6. **Save Question** when satisfied

## Workflow

### Creating a Test with Questions

1. **Create Test**
   - Navigate to Tests page
   - Click "Create Test"
   - Fill in test details and sections
   - Save the test

2. **Add Questions Directly**
   - From Tests page, click the **Manage Questions** icon (green icon) for your test
   - Click "Add Question" button
   - Create questions one by one using the enhanced editor
   - Use Preview to verify appearance
   - Save each question

3. **Review Questions**
   - All questions are listed on the Question Management page
   - See questions organized by section
   - View images, options, and explanations
   - Edit or delete questions as needed

### Best Practices

#### Image Sizing
- **Question Images**: 
  - Diagrams/Charts: 60-80%
  - Large detailed images: 100%
  - Small reference images: 30-50%
  
- **Option Images**:
  - Comparison items: 40-60%
  - Small icons: 20-30%
  - Full option images: 50-70%

#### Preview Usage
- **Always preview** before saving questions
- Check that images are appropriately sized
- Verify text formatting renders correctly
- Ensure correct answers are properly marked

#### Organization
- Use sections to organize questions by topic
- Set difficulty levels accurately
- Add explanations to help students learn
- Use consistent formatting across questions

## Changes from Previous Version

### Removed
- ❌ Question Bank Upload navigation (questions now added directly)
- ❌ Indirect question management workflow

### Added
- ✅ Live preview mode
- ✅ Image upload for options
- ✅ Flexible image resizing controls
- ✅ Direct navigation from Tests page to Question Management
- ✅ "Manage Questions" button on Tests page
- ✅ Enhanced visual feedback in preview

### Improved
- 📈 Better image handling with size controls
- 📈 More intuitive question creation workflow
- 📈 Real-time preview of student view
- 📈 Comprehensive formatting options

## Troubleshooting

### Images Not Uploading
- Check file size (must be < 5MB)
- Verify file format (JPG, PNG, GIF, WEBP)
- Ensure stable internet connection

### Preview Not Showing Images
- Images must be uploaded successfully first
- Check that imageUrl is set (green checkmark appears)
- Try refreshing the editor if needed

### Formatting Not Appearing
- Use the rich text editor toolbar
- HTML tags are sanitized for security
- Preview mode shows exact student view

## Technical Notes

### Image Storage
- Images are stored on the server
- Paths are relative to the API URL
- Width percentages are stored in the database
- Aspect ratios are automatically maintained

### Data Structure
```javascript
{
  questionText: "Text content",
  questionHtml: "Rich formatted HTML",
  imageUrl: "/uploads/questions/image.jpg",
  imageWidth: 75, // percentage
  options: [
    {
      text: "Option text",
      html: "Rich formatted HTML",
      imageUrl: "/uploads/questions/option-image.jpg",
      imageWidth: 50, // percentage
      isCorrect: true
    }
  ],
  explanation: "Explanation text",
  explanationHtml: "Rich formatted HTML"
}
```

## Support

For issues or questions about the enhanced question editor:
1. Check this guide for solutions
2. Verify your test has sections configured
3. Ensure images meet size and format requirements
4. Use preview mode to verify everything appears correctly

## Future Enhancements

Potential future additions:
- Bulk question import with images
- Question templates
- Image editing tools
- Advanced preview options (different device sizes)
- Question versioning
