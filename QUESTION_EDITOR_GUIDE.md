# Rich Text Question Editor - User Guide

## Overview

The Mock Test platform now features a powerful rich text question editor that allows administrators to create questions with advanced formatting, images, tables, emojis, and more - directly from the test creation interface.

## Key Features

### 1. Rich Text Formatting
- **Text Styles**: Bold, italic, underline, strikethrough
- **Fonts & Sizes**: Multiple font families and text sizes
- **Colors**: Text color and background color customization
- **Alignment**: Left, center, right, justify
- **Lists**: Ordered and unordered lists
- **Indentation**: Increase/decrease text indentation

### 2. Advanced Content
- **Headers**: H1 through H6 heading styles
- **Subscript & Superscript**: For mathematical formulas
- **Code Blocks**: For programming questions
- **Blockquotes**: For highlighting important text
- **Links**: Add hyperlinks (if needed)

### 3. Emojis & Symbols
- Copy and paste any emoji directly into the editor: 😊 🎯 ✨ 📚 💡
- Use special symbols: ∑ ∏ √ ∞ ≈ ≠ ± × ÷
- Support for mathematical symbols and Greek letters

### 4. Image Support
- Upload images directly for questions
- Supported formats: JPEG, JPG, PNG, GIF, WEBP
- Maximum file size: 5MB per image
- Images are displayed to students during exams

### 5. Multiple Choice Options
- **Single Choice**: Only one correct answer (radio buttons)
- **Multiple Choice**: Multiple correct answers allowed (checkboxes)
- Each option supports rich text formatting
- Visual indication of correct answers

### 6. Explanations
- Add detailed explanations for correct answers
- Explanations support full rich text formatting
- Helps students understand why an answer is correct

## Workflow

### Step 1: Create Company
1. Navigate to Admin Dashboard → Mock Tests
2. Click "Create Company"
3. Fill in company details and test pattern sections
4. Save the company

### Step 2: Create Test
1. From the company card, click "Create Test"
2. Fill in test details (title, description, type, duration)
3. Configure sections (based on company pattern)
4. Click "Create Test"
5. You'll be automatically redirected to the Question Management page

### Step 3: Add Questions
1. Click the "Add Question" button
2. Configure question settings:
   - **Question Type**: Single or Multiple Choice
   - **Section**: Select from test sections
   - **Difficulty**: Easy, Medium, or Hard
   - **Marks**: Points awarded for correct answer
   - **Negative Marks**: Points deducted for wrong answer

3. Enter question text using the rich text editor:
   - Use the toolbar for formatting
   - Add emojis by copying and pasting
   - Upload images using the "Upload Image" button

4. Add options:
   - Enter at least 2 options (up to 6)
   - Use rich text formatting for options
   - Check the radio/checkbox to mark correct answer(s)
   - Add/remove options as needed

5. Add explanation (optional):
   - Use rich text editor to explain the answer
   - Include formulas, diagrams, or detailed reasoning

6. Click "Save Question" to add to test

### Step 4: Manage Questions
- View all questions for the test
- Filter by section
- Delete questions if needed
- See question count per section
- Questions are automatically added to the test

### Step 5: Students Take Test
- Students will see all rich formatting preserved
- Images are displayed clearly
- Tables, emojis, and special formatting work seamlessly
- No changes needed to existing exam flow

## Tips & Best Practices

### Creating Effective Questions

1. **Be Clear and Concise**
   - Use formatting to highlight key terms
   - Break complex questions into smaller parts

2. **Use Images Wisely**
   - Upload diagrams, charts, or visual aids when needed
   - Ensure images are clear and relevant
   - Keep file sizes reasonable (under 2MB recommended)

3. **Formatting Options**
   - Use **bold** for important terms
   - Use *italics* for emphasis
   - Use colors sparingly for clarity
   - Create tables for structured data

4. **Mathematical Content**
   - Use superscript for exponents: x²
   - Use subscript for indices: H₂O
   - Copy mathematical symbols: ∑, ∫, √, π
   - Consider using code blocks for formulas

5. **Multiple Choice Best Practices**
   - Keep options similar in length
   - Avoid "all of the above" or "none of the above"
   - Format all options consistently
   - Ensure only one clearly correct answer for single choice

### Example Question Formats

#### Example 1: Simple Text Question
```
Question: What is the capital of France? 🇫🇷

Options:
A. London
B. Paris ✓
C. Berlin
D. Madrid
```

#### Example 2: Mathematical Question
```
Question: Solve for x: x² + 5x + 6 = 0

Options:
A. x = -2 or x = -3 ✓
B. x = 2 or x = 3
C. x = -1 or x = -6
D. x = 1 or x = 6

Explanation: Factor: (x + 2)(x + 3) = 0
Therefore: x = -2 or x = -3
```

#### Example 3: Question with Image
```
Question: Identify the structure labeled 'X' in the diagram below:
[Upload image of cell diagram]

Options:
A. Mitochondria ✓
B. Nucleus
C. Cell membrane
D. Ribosome
```

## Technical Details

### Data Storage
- Questions stored in `generatedQuestions` array in Test model
- Rich HTML content stored in separate fields (`questionHtml`, `explanationHtml`)
- Plain text versions preserved for backward compatibility
- Images stored in `/uploads/question-images/` directory

### API Endpoints
- `POST /api/v1/tests/:id/questions` - Add question
- `PUT /api/v1/tests/:id/questions/:questionId` - Update question
- `DELETE /api/v1/tests/:id/questions/:questionId` - Delete question
- `GET /api/v1/tests/:id/questions` - Get all questions
- `POST /api/v1/tests/upload-question-image` - Upload image

### Security
- Only admin users can create/edit questions
- Images validated for type and size
- HTML content sanitized on display
- File uploads restricted to image formats

## Troubleshooting

### Image Not Uploading
- Check file size (must be under 5MB)
- Verify file format (JPEG, JPG, PNG, GIF, WEBP only)
- Ensure stable internet connection

### Formatting Not Displaying
- Make sure to use the rich text editor toolbar
- Preview question before saving
- Check browser compatibility (modern browsers required)

### Questions Not Appearing in Test
- Verify question was saved successfully
- Check that section matches test configuration
- Ensure test has not been deleted

## Migration from Old System

The old question bank upload system (CSV/JSON) is still available but deprecated. New features:
- ✅ Rich text formatting
- ✅ Direct image uploads
- ✅ Visual editor
- ✅ Better question management
- ✅ Immediate feedback

## Future Enhancements

Planned features:
- [ ] Video embedding support
- [ ] LaTeX equation editor
- [ ] Question templates
- [ ] Bulk question import with rich formatting
- [ ] Question duplicating
- [ ] Question tagging and search

## Support

For technical issues or feature requests, please contact the development team.

---

Last Updated: December 2024
Version: 2.0
