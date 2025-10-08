# Mock Test Management System

## Overview
This is a consolidated admin interface for managing companies, tests, and question banks for mock tests. It simplifies the previous fragmented approach by providing a single view to manage all aspects of mock test creation.

## Features
1. **Company Management**
   - Create and edit companies
   - Define default test patterns with sections
   - Set company metadata (cutoff percentages, instructions, etc.)

2. **Test Management**
   - Create tests linked to companies
   - Define test sections based on company patterns
   - Set test types (free/paid) and pricing
   - Generate questions from question banks

3. **Question Bank Management**
   - Upload questions in JSON/CSV format
   - Organize questions by company and section
   - View question bank statistics

4. **Integrated Workflow**
   - All management in one place
   - Direct links between companies, tests, and question banks
   - Easy navigation and filtering

## How to Use

### Accessing the System
Navigate to `/admin/mocktest` to access the consolidated management interface.

### Creating a New Company
1. Click "Add Company" button
2. Fill in company details (name, category, logo, etc.)
3. Define the default test pattern with sections
4. Set metadata like cutoff percentage and passing criteria
5. Save the company

### Creating a Test for a Company
1. Expand a company to view its details
2. Click "Add Test" button
3. Fill in test details (title, type, price if paid)
4. Define test sections based on available question banks
5. Save the test

### Uploading Questions to Question Banks
1. Expand a company to view its question banks
2. Click "Upload Questions" button
3. Select the section for the questions
4. Upload a JSON or CSV file with questions
5. Questions will be added to the appropriate question bank

### Generating Test Questions
1. Navigate to "Generate Test Questions" in the sidebar
2. Select a test from the dropdown
3. Click "Generate Questions" button
4. The system will automatically pull questions from question banks based on the test sections

## Data Structure

### Company
- `name`: Company name
- `category`: IT Services, Product, Consulting, etc.
- `difficulty`: Easy, Medium, Hard
- `defaultPattern`: Array of section definitions
- `metadata`: Additional settings like cutoff percentage

### Test
- `title`: Test title
- `companyId`: Reference to the company
- `type`: free or paid
- `price`: Price for paid tests
- `sections`: Array of section definitions for this test

### Question Bank
- `companyId`: Reference to the company
- `section`: Section name (Aptitude, Reasoning, etc.)
- `questions`: Array of questions
- `totalQuestions`: Count of active questions

## Benefits of This Approach
1. **Simplified Navigation**: All related functionality in one place
2. **Contextual Actions**: Direct links from companies to their tests and question banks
3. **Reduced Cognitive Load**: No need to navigate between multiple pages
4. **Better Overview**: See all company data at a glance
5. **Efficient Workflow**: Create companies, tests, and upload questions in sequence

## Integration with Existing System
This new interface works alongside the existing separate management pages:
- `/admin/companies` - Traditional company management
- `/admin/tests` - Traditional test management
- `/admin/question-banks` - Traditional question bank management

The consolidated view is available at `/admin/mocktest` and provides a more intuitive workflow for creating mock tests from scratch.