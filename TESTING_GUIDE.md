# Quick Testing Guide - Enhanced Question Editor

## How to Test the New Features

### Prerequisites
1. Ensure you have admin access to the MockTest platform
2. Have a test created in the system (or create one)
3. Have some image files ready for testing (JPG, PNG under 5MB)

## Test Scenario 1: Access Question Editor

### Steps:
1. **Login as Admin**
2. **Navigate to Admin Dashboard → Tests**
3. **Locate any test in the list**
4. **Click the green "Manage Questions" icon** (📋 - first icon in actions column)
   - This should open the Question Management page

### Expected Result:
✅ You should see the Question Management page with test details and "Add Question" button

---

## Test Scenario 2: Create Question with Image

### Steps:
1. **From Question Management page, click "Add Question"**
2. **Fill in basic details:**
   - Question Type: Single Choice
   - Section: (Select any)
   - Difficulty: Medium
   - Question text: "What is shown in the image below?"

3. **Upload Question Image:**
   - Click "Upload Image" button
   - Select an image file (JPG/PNG, under 5MB)
   - Wait for upload confirmation

4. **Adjust Image Size:**
   - Use the slider to change width (try 75%)
   - Click zoom buttons to fine-tune
   - Observe the image resize in real-time

### Expected Result:
✅ Image uploads successfully  
✅ Slider works smoothly  
✅ Zoom buttons adjust by 10%  
✅ Image resizes as you adjust

---

## Test Scenario 3: Add Options with Images

### Steps:
1. **Add first option:**
   - Type: "Option A"
   - Click "Add Image" button below the option
   - Upload an image
   - Adjust size using slider (try 50%)

2. **Add second option:**
   - Type: "Option B"
   - Upload different image
   - Adjust to different size (try 60%)

3. **Mark one as correct:**
   - Click radio button next to correct option

4. **Add two more options without images:**
   - Type text for options C and D

### Expected Result:
✅ Each option can have its own image  
✅ Image sizes are independent  
✅ Options without images work normally  
✅ Correct answer is marked

---

## Test Scenario 4: Preview Mode

### Steps:
1. **After filling question and options, click "Preview" button**
   - Button is in the header with eye icon (👁)

2. **Observe the preview:**
   - Check question text rendering
   - Verify image sizes match your settings
   - See all options displayed
   - Notice correct answer highlighted in green

3. **Click "Edit" to return to editing**

### Expected Result:
✅ Preview mode toggles smoothly  
✅ Shows exact student view  
✅ Images at configured sizes  
✅ Correct answer highlighted  
✅ Can return to edit mode

---

## Test Scenario 5: Add Explanation

### Steps:
1. **Scroll to Explanation section**
2. **Type explanation with formatting:**
   - Use bold, italic
   - Add colors
   - Try lists or emojis (😊 ✓)

3. **Click Preview again**
4. **Verify explanation appears in preview**

### Expected Result:
✅ Explanation editor works  
✅ Formatting applies  
✅ Shows in preview mode  
✅ Emojis display correctly

---

## Test Scenario 6: Save and Verify

### Steps:
1. **Click "Save Question"**
2. **Wait for success message**
3. **Verify question appears in list:**
   - Should show in Question Management page
   - Images should display
   - Options with images visible

### Expected Result:
✅ Question saves successfully  
✅ Appears in question list  
✅ All images display correctly  
✅ Data persisted

---

## Test Scenario 7: Student View

### Steps:
1. **Logout from admin**
2. **Login as a student**
3. **Navigate to the test**
4. **Start the test**
5. **View the question you created:**
   - Check question image display
   - Check option images display
   - Verify sizes match preview

### Expected Result:
✅ Question displays correctly  
✅ Images show at configured sizes  
✅ Options with images render properly  
✅ Matches preview exactly

---

## Test Scenario 8: Image Size Variations

### Steps:
1. **Create multiple questions with different image sizes:**
   - Question 1: 100% width
   - Question 2: 50% width
   - Question 3: 25% width

2. **View in preview mode**
3. **Save and check student view**

### Expected Result:
✅ All sizes work correctly  
✅ Images maintain aspect ratio  
✅ Responsive on different screens  
✅ No distortion

---

## Test Scenario 9: Option Image Variations

### Steps:
1. **Create question with mixed options:**
   - Option A: Text only
   - Option B: Image only (try 40%)
   - Option C: Text + Image (try 60%)
   - Option D: Text only

2. **Preview and save**
3. **Verify all display correctly**

### Expected Result:
✅ Mixed options work  
✅ Images display at set sizes  
✅ Text-only options normal  
✅ Combined text+image works

---

## Test Scenario 10: Error Handling

### Steps:
1. **Try uploading file > 5MB:**
   - Should show error message

2. **Try uploading non-image file (PDF, DOC):**
   - Should show error message

3. **Try saving without question text:**
   - Should show validation error

4. **Try saving with < 2 options:**
   - Should show validation error

5. **Try saving without marking correct answer:**
   - Should show validation error

### Expected Result:
✅ All validations work  
✅ Clear error messages  
✅ Prevents invalid saves  
✅ No crashes

---

## Test Scenario 11: Rich Text Formatting

### Steps:
1. **In question text editor:**
   - Try bold, italic, underline
   - Change colors
   - Add emojis 😊 🎯
   - Use subscript (H₂O) and superscript (x²)

2. **Preview the formatting**
3. **Save and verify**

### Expected Result:
✅ All formatting works  
✅ Displays in preview  
✅ Shows in student view  
✅ No formatting lost

---

## Test Scenario 12: Navigation Flow

### Steps:
1. **From Tests page → Manage Questions**
2. **Add Question → Preview → Edit → Save**
3. **Back to Question List**
4. **Back to Tests page**

### Expected Result:
✅ Navigation is smooth  
✅ No data loss  
✅ Breadcrumbs work  
✅ Back button functional

---

## Quick Checklist for Full Testing

Use this checklist to ensure all features work:

### Basic Features
- [ ] Can access Manage Questions from Tests page
- [ ] Can open Add Question editor
- [ ] Can select question type and section
- [ ] Can enter question text with formatting

### Image Upload
- [ ] Can upload question image
- [ ] Can upload option images
- [ ] File validation works (size, type)
- [ ] Upload shows loading state

### Image Resizing
- [ ] Slider adjusts image width
- [ ] Zoom buttons work (+/-)
- [ ] Width percentage displays correctly
- [ ] Images resize smoothly

### Preview Mode
- [ ] Can toggle to preview
- [ ] Shows exact student view
- [ ] Images at correct sizes
- [ ] Correct answers highlighted
- [ ] Can toggle back to edit

### Options
- [ ] Can add/remove options (2-6)
- [ ] Each option can have image
- [ ] Independent size controls
- [ ] Can mark correct answer(s)

### Validation
- [ ] Question text required
- [ ] Minimum 2 options required
- [ ] Correct answer required
- [ ] File size validation works
- [ ] File type validation works

### Explanation
- [ ] Can add explanation
- [ ] Formatting works
- [ ] Shows in preview

### Save & Display
- [ ] Question saves successfully
- [ ] Appears in question list
- [ ] Shows correctly in admin view
- [ ] Shows correctly in student view

### Edge Cases
- [ ] Works with no images
- [ ] Works with all text options
- [ ] Works with all image options
- [ ] Works with mixed options
- [ ] Handles long text
- [ ] Handles large images (under 5MB)

---

## Troubleshooting

### Issue: Image won't upload
**Solutions:**
- Check file size (must be < 5MB)
- Check file type (JPG, PNG, GIF, WEBP only)
- Check internet connection
- Try a different image

### Issue: Preview not showing correctly
**Solutions:**
- Wait for images to upload completely
- Check that question text is filled
- Verify at least 2 options added
- Refresh the page if needed

### Issue: "Manage Questions" button not visible
**Solutions:**
- Ensure you're logged in as admin
- Check you're on the Tests page
- Look for green icon (first in actions)
- Try refreshing the page

### Issue: Save button disabled
**Solutions:**
- Fill required fields (question text)
- Add at least 2 options
- Mark at least one correct answer
- Wait for uploads to complete

---

## Performance Testing

### Test with Large Content
1. Create question with:
   - Long question text (500+ words)
   - Multiple images
   - 6 options all with images
   - Long explanation

2. **Expected**: Should save and load without issues

### Test Multiple Questions
1. Create 10+ questions with images
2. **Expected**: List loads quickly, images display

---

## Browser Testing

Test the same scenarios in:
- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browser

---

## Accessibility Testing

1. **Keyboard Navigation:**
   - Tab through form fields
   - Use Enter to trigger buttons

2. **Screen Reader:**
   - Test with screen reader if available
   - Verify alt text on images

---

## Feedback

After testing, please provide feedback on:
- ✅ Features working as expected
- ⚠️ Any bugs or issues found
- 💡 Suggestions for improvements
- 📱 Mobile/tablet experience
- 🎨 UI/UX observations

---

## Test Results Template

```
Test Date: ___________
Tester: ___________
Browser: ___________

Test Scenario 1: [ ] Pass [ ] Fail - Notes: ___________
Test Scenario 2: [ ] Pass [ ] Fail - Notes: ___________
Test Scenario 3: [ ] Pass [ ] Fail - Notes: ___________
... (continue for all scenarios)

Overall Experience: ___________
Issues Found: ___________
Suggestions: ___________
```

---

## Support

If you encounter any issues during testing:
1. Check this guide for solutions
2. Review error messages
3. Check browser console for errors
4. Refer to ENHANCED_QUESTION_EDITOR_GUIDE.md
5. Report issues with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Browser/device info

---

**Happy Testing! 🎉**

The enhanced question editor is designed to make creating image-rich questions easy and intuitive. Enjoy exploring all the new features!
