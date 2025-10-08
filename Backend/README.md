# Backend API for Mock Test Management

## Overview
This documentation explains the backend API endpoints for the mock test management system, with a focus on the consolidated admin interface.

## Key API Endpoints

### Companies
- `POST /api/v1/companies` - Create a new company
- `GET /api/v1/companies` - Get all active companies
- `GET /api/v1/companies/:id` - Get company details
- `PUT /api/v1/companies/:id` - Update company
- `DELETE /api/v1/companies/:id` - Delete company

### Tests
- `POST /api/v1/tests` - Create a new test
- `GET /api/v1/tests` - Get all tests
- `GET /api/v1/tests/:id` - Get test details
- `PUT /api/v1/tests/:id` - Update test
- `DELETE /api/v1/tests/:id` - Delete test
- `POST /api/v1/tests/:id/generate-questions` - Generate questions for a test

### Question Banks
- `POST /api/v1/question-banks/upload` - Upload questions to a question bank
- `GET /api/v1/question-banks` - Get all question banks
- `GET /api/v1/question-banks/company/:companyId/sections` - Get available sections for a company

## Integration with Frontend

The new consolidated admin interface at `/admin/mocktest` uses these endpoints to provide a streamlined workflow:

1. **Company Creation**: Uses `POST /api/v1/companies` to create new companies with their default patterns
2. **Test Creation**: Uses `POST /api/v1/tests` to create tests linked to companies
3. **Question Upload**: Uses `POST /api/v1/question-banks/upload` to add questions to section-specific banks
4. **Question Generation**: Uses `POST /api/v1/tests/:id/generate-questions` to pull questions from banks into tests

## Data Models

### Company
```javascript
{
  name: String,
  logoUrl: String,
  description: String,
  category: String, // IT Services, Product, etc.
  difficulty: String, // Easy, Medium, Hard
  defaultPattern: [{
    sectionName: String,
    questionCount: Number,
    duration: Number,
    marksPerQuestion: Number,
    negativeMarking: Number
  }],
  metadata: {
    cutoffPercentage: Number,
    passingCriteria: String,
    instructions: [String]
  }
}
```

### Test
```javascript
{
  title: String,
  description: String,
  companyId: ObjectId,
  type: String, // free or paid
  price: Number,
  duration: Number, // Total duration calculated from sections
  sections: [{
    sectionName: String,
    questionCount: Number,
    duration: Number,
    marksPerQuestion: Number,
    negativeMarking: Number
  }],
  isGenerated: Boolean,
  generatedQuestions: [Object]
}
```

### QuestionBank
```javascript
{
  companyId: ObjectId,
  section: String,
  title: String,
  description: String,
  questions: [Object],
  totalQuestions: Number
}
```

## Improvements in the New System

1. **Simplified Workflow**: The frontend now provides a single interface to manage companies, tests, and question banks
2. **Better Data Consistency**: All related operations are grouped together
3. **Reduced API Calls**: Fewer page navigations mean fewer API requests
4. **Enhanced User Experience**: Contextual actions make it easier to perform related tasks

## Migration from Old System

The previous separate interfaces for companies, tests, and question banks are still available at:
- `/admin/companies`
- `/admin/tests` 
- `/admin/question-banks`

However, the new consolidated interface at `/admin/mocktest` provides a better experience for creating mock tests from scratch.