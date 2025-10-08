# Frontend for Mock Test Management

## Overview
This documentation explains the frontend components for the mock test management system, with a focus on the new consolidated admin interface.

## Key Components

### New Consolidated Interface
- `CompanyTestManagement.jsx` - Main component for the consolidated interface
- Located at `/admin/mocktest`

### Traditional Management Interfaces
- `Companies.jsx` - Manage companies at `/admin/companies`
- `Tests.jsx` - Manage tests at `/admin/tests`
- `QuestionBanks.jsx` - Manage question banks at `/admin/question-banks`

### Specialized Components
- `CreateCompany.jsx` - Create/edit companies
- `TestCreation.jsx` - Create/edit tests
- `QuestionBankUpload.jsx` - Upload questions
- `GenerateQuestions.jsx` - Generate test questions

## Component Structure

### CompanyTestManagement.jsx
This is the main component for the new consolidated interface. It provides:

1. **Company Management**
   - List all companies with expandable details
   - Create/edit companies
   - Delete companies

2. **Test Management**
   - View tests for each company
   - Create/edit tests
   - Delete tests
   - Generate questions for tests

3. **Question Bank Management**
   - View question banks for each company
   - Upload questions to banks
   - View bank statistics

### Workflow

The consolidated interface provides a streamlined workflow:

1. **Create a Company**
   - Click "Add Company"
   - Fill in company details
   - Define default test pattern
   - Save company

2. **Create a Test**
   - Expand company to view details
   - Click "Add Test"
   - Fill in test details
   - Define test sections
   - Save test

3. **Upload Questions**
   - Expand company to view question banks
   - Click "Upload Questions"
   - Select section and upload file
   - Questions are added to the appropriate bank

4. **Generate Test Questions**
   - Click "Generate Questions" for a test
   - System pulls questions from banks based on sections
   - Test is ready for students

## Integration Points

### API Integration
All components use `api/axios.js` to communicate with the backend:
- Companies: `/api/v1/companies`
- Tests: `/api/v1/tests`
- Question Banks: `/api/v1/question-banks`

### Navigation
The sidebar provides navigation to all management interfaces:
- Traditional: Companies, Tests, Question Banks
- New: Consolidated Mock Test Management

### Context
The system uses React Context for:
- Authentication (`AuthContext.jsx`)
- Toast notifications (`ToastContext.jsx`)

## Improvements in the New System

1. **Unified Interface**: All related functionality in one place
2. **Contextual Actions**: Direct links between related entities
3. **Reduced Navigation**: Fewer page changes needed to complete tasks
4. **Better Overview**: See all company data at a glance

## Migration from Old System

The previous separate interfaces are still available for users who prefer them. The new consolidated interface is available at `/admin/mocktest` and provides a more intuitive workflow for creating mock tests from scratch.

## Testing

Unit tests are available in the `*.test.jsx` files. Run tests with:
```bash
npm test
```

## Development

To run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`