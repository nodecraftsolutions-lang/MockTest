# Mock Test Management System

## Overview
This is a comprehensive mock test management system that allows administrators to create companies, define test patterns, upload questions, and generate tests. Students can take tests and view their results.

## Project Structure
```
MockTest/
├── Backend/
│   ├── src/
│   │   ├── models/       # Database models (Company, Test, QuestionBank, etc.)
│   │   ├── routes/       # API endpoints
│   │   └── index.js      # Main server file
│   └── README.md         # Backend documentation
├── Frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Admin/    # Admin dashboard and management interfaces
│   │   │   ├── Student/  # Student dashboard and test interfaces
│   │   │   └── Public/   # Public pages
│   │   ├── components/   # Reusable components
│   │   ├── context/      # React context providers
│   │   ├── api/          # API client
│   │   └── App.jsx       # Main application component
│   └── README.md         # Frontend documentation
└── README.md             # This file
```

## Key Features

### Admin Features
1. **Company Management**
   - Create and manage companies
   - Define default test patterns with sections
   - Set company metadata (cutoff percentages, instructions)

2. **Test Management**
   - Create tests linked to companies
   - Define test sections based on company patterns
   - Set test types (free/paid) and pricing
   - Generate questions from question banks

3. **Question Bank Management**
   - Upload questions in JSON/CSV format
   - Organize questions by company and section
   - View question bank statistics

4. **Student Management**
   - View student profiles and activity
   - Manage enrollments and payments

5. **Results Management**
   - View test results and analytics
   - Export results to CSV

### Student Features
1. **Test Taking**
   - Browse companies and tests
   - Take free and paid tests
   - View test instructions and patterns

2. **Results**
   - View detailed test results
   - See section-wise performance
   - View rank and percentile

3. **Dashboard**
   - View recent activity
   - Track progress and statistics

## Enhanced Question Editor (NEW!)

We've significantly enhanced the question editor with powerful new features:

### Key Features
1. **Image Upload with Flexible Resizing**: Add images to questions and options with adjustable dimensions (10-100%)
2. **Live Preview Mode**: See exactly how questions appear to students before saving
3. **Option Images**: Each option can now have its own image with size controls
4. **Rich Text Formatting**: Full formatting support for questions, options, and explanations
5. **Direct Question Management**: Add questions directly to tests from the Tests page

### Quick Start
1. Navigate to **Admin → Tests**
2. Click the **Manage Questions** icon (green list icon) for any test
3. Click **Add Question**
4. Create your question with images and formatting
5. Click **Preview** to see student view
6. **Save** when satisfied

📖 **[Read the Complete Enhanced Question Editor Guide](./ENHANCED_QUESTION_EDITOR_GUIDE.md)**

## New Consolidated Admin Interface

We've introduced a new consolidated admin interface at `/admin/mocktest` that simplifies the workflow for creating mock tests:

### Benefits
1. **Unified Interface**: Manage companies, tests, and question banks in one place
2. **Contextual Actions**: Direct links between related entities
3. **Reduced Navigation**: Fewer page changes needed to complete tasks
4. **Better Overview**: See all company data at a glance

### Updated Workflow
1. Create a company with its default test pattern
2. Create tests for the company
3. **Add questions directly to tests using the enhanced question editor**
4. Students can now take the tests

**Note**: Question bank upload has been streamlined - questions are now added directly to tests through the editor.

## Technology Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JWT for authentication
- Multer for file uploads

### Frontend
- React with React Router
- Tailwind CSS for styling
- Lucide React for icons
- Axios for API requests

## Setup Instructions

### Backend
1. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=8000
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Frontend
1. Navigate to the Frontend directory:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

The backend provides RESTful APIs for all functionality. Detailed documentation is available in `Backend/README.md`.

## Frontend Documentation

Detailed documentation for the frontend components is available in `Frontend/README.md`.

## Testing

Unit tests are available for both frontend and backend components. Run tests with:
```bash
# Backend tests
cd Backend
npm test

# Frontend tests
cd Frontend
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on the GitHub repository.