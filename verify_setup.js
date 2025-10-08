#!/usr/bin/env node

// Script to verify that the mock test management system is set up correctly

const fs = require('fs');
const path = require('path');

console.log('Verifying Mock Test Management System Setup...\n');

// Check if required directories exist
const requiredDirs = [
  'Backend/src/models',
  'Backend/src/routes',
  'Frontend/src/pages/Admin/MockTest',
  'Frontend/src/components'
];

let allDirsExist = true;
for (const dir of requiredDirs) {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing directory: ${fullPath}`);
    allDirsExist = false;
  } else {
    console.log(`✅ Found directory: ${fullPath}`);
  }
}

console.log('\n');

// Check if required files exist
const requiredFiles = [
  'Backend/src/models/Company.js',
  'Backend/src/models/Test.js',
  'Backend/src/models/QuestionBank.js',
  'Backend/src/routes/company.js',
  'Backend/src/routes/test.js',
  'Backend/src/routes/questionBank.js',
  'Frontend/src/pages/Admin/MockTest/CompanyTestManagement.jsx',
  'Frontend/src/pages/Admin/MockTest/CreateCompany.jsx',
  'Frontend/src/pages/Admin/MockTest/TestCreation.jsx',
  'Frontend/src/pages/Admin/MockTest/QuestionBankUpload.jsx',
  'Frontend/src/pages/Admin/MockTest/GenerateQuestions.jsx',
  'Frontend/src/components/Sidebar.jsx',
  'Frontend/src/App.jsx'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing file: ${fullPath}`);
    allFilesExist = false;
  } else {
    console.log(`✅ Found file: ${fullPath}`);
  }
}

console.log('\n');

// Check if new routes are added to App.jsx
const appJsxPath = path.join(__dirname, 'Frontend/src/App.jsx');
if (fs.existsSync(appJsxPath)) {
  const appJsxContent = fs.readFileSync(appJsxPath, 'utf8');
  
  const requiredRoutes = [
    '/admin/mocktest',
    'CompanyTestManagement'
  ];
  
  let allRoutesAdded = true;
  for (const route of requiredRoutes) {
    if (!appJsxContent.includes(route)) {
      console.error(`❌ Missing route/component in App.jsx: ${route}`);
      allRoutesAdded = false;
    } else {
      console.log(`✅ Found route/component in App.jsx: ${route}`);
    }
  }
  
  console.log('\n');
}

// Check if new menu item is added to Sidebar.jsx
const sidebarPath = path.join(__dirname, 'Frontend/src/components/Sidebar.jsx');
if (fs.existsSync(sidebarPath)) {
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
  
  const requiredMenuItems = [
    'Company & Test Management'
  ];
  
  let allMenuItemsAdded = true;
  for (const menuItem of requiredMenuItems) {
    if (!sidebarContent.includes(menuItem)) {
      console.error(`❌ Missing menu item in Sidebar.jsx: ${menuItem}`);
      allMenuItemsAdded = false;
    } else {
      console.log(`✅ Found menu item in Sidebar.jsx: ${menuItem}`);
    }
  }
  
  console.log('\n');
}

// Summary
if (allDirsExist && allFilesExist) {
  console.log('🎉 Setup verification completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Start the backend server: cd Backend && npm start');
  console.log('2. Start the frontend server: cd Frontend && npm run dev');
  console.log('3. Navigate to http://localhost:5173/admin/mocktest');
  console.log('4. Try creating a company, test, and uploading questions');
} else {
  console.error('❌ Setup verification failed. Please check the missing files/directories above.');
  process.exit(1);
}