# Database Models

## Overview
This documentation explains the database models used in the mock test management system and how they relate to each other.

## Models

### Company
Represents a company that conducts mock tests.

**Key Fields:**
- `name`: Company name (unique)
- `description`: Company description
- `category`: Industry category (IT Services, Product, etc.)
- `defaultPattern`: Array of section definitions for tests
- `metadata`: Additional settings (cutoff percentage, instructions)

**Relationships:**
- Has many Tests (via `companyId` in Test model)
- Has many QuestionBanks (via `companyId` in QuestionBank model)

### Test
Represents a mock test created for a company.

**Key Fields:**
- `title`: Test title
- `description`: Test description
- `companyId`: Reference to the Company
- `type`: Test type (free or paid)
- `price`: Price for paid tests
- `sections`: Array of section definitions for this specific test
- `isGenerated`: Boolean indicating if questions have been generated
- `generatedQuestions`: Array of actual questions for the test

**Relationships:**
- Belongs to one Company (via `companyId`)
- Has many Attempts (via `testId` in Attempt model)
- Has many Enrollments (via `testId` in Enrollment model)

### QuestionBank
Stores questions organized by company and section.

**Key Fields:**
- `companyId`: Reference to the Company
- `section`: Section name (Aptitude, Reasoning, etc.)
- `questions`: Array of questions
- `totalQuestions`: Count of active questions

**Relationships:**
- Belongs to one Company (via `companyId`)
- Used by Tests when generating questions

### Attempt
Represents a student's attempt at taking a test.

**Key Fields:**
- `studentId`: Reference to the Student
- `testId`: Reference to the Test
- `answers`: Array of student's answers
- `score`: Total score
- `status`: Current status (in-progress, submitted, etc.)

**Relationships:**
- Belongs to one Student (via `studentId`)
- Belongs to one Test (via `testId`)

### Enrollment
Tracks student enrollments for tests and courses.

**Key Fields:**
- `studentId`: Reference to the Student
- `testId`: Reference to the Test (optional)
- `courseId`: Reference to the Course (optional)
- `type`: Type of enrollment (test, course, or recording)
- `status`: Current status (enrolled, completed, etc.)

**Relationships:**
- Belongs to one Student (via `studentId`)
- Belongs to one Test (via `testId`, optional)
- Belongs to one Course (via `courseId`, optional)

### Student
Represents a student user.

**Key Fields:**
- `name`: Student's name
- `email`: Student's email (unique)
- `mobile`: Student's mobile number
- `role`: User role (student or admin)
- `enrolledCompanies`: Array of companies the student is enrolled in

**Relationships:**
- Has many Attempts (via `studentId` in Attempt model)
- Has many Enrollments (via `studentId` in Enrollment model)

## Relationships Diagram

```
Company 1 --- Many Test
Company 1 --- Many QuestionBank
Test 1 --- Many Attempt
Student 1 --- Many Attempt
Student 1 --- Many Enrollment
Test 1 --- Many Enrollment
Company 1 --- Many Student (via enrolledCompanies)
```

## Workflow

1. **Company Creation**: Admin creates a Company with a default test pattern
2. **Test Creation**: Admin creates a Test linked to a Company
3. **Question Upload**: Admin uploads questions to QuestionBank organized by Company and Section
4. **Question Generation**: System generates Test questions by pulling from appropriate QuestionBanks
5. **Test Taking**: Student takes a Test, creating an Attempt
6. **Result Calculation**: System calculates scores and statistics based on Attempt data

## Data Consistency

The models are designed to maintain data consistency through:
- Required references (companyId, testId, studentId)
- Unique constraints (company name, student email)
- Validation rules (price for paid tests, etc.)
- Pre-save hooks to calculate totals and statistics

## Performance Considerations

- Indexes are defined on frequently queried fields
- Virtual properties are used for related data that isn't always needed
- Pagination is implemented for large datasets
- Aggregation pipelines are used for complex statistics