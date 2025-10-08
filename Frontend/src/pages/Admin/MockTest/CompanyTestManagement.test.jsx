import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CompanyTestManagement from './CompanyTestManagement';

// Mock the axios API calls
jest.mock('../../../api/axios', () => ({
  get: jest.fn().mockResolvedValue({ data: { success: true, data: [] } }),
  post: jest.fn().mockResolvedValue({ data: { success: true } }),
  put: jest.fn().mockResolvedValue({ data: { success: true } }),
  delete: jest.fn().mockResolvedValue({ data: { success: true } })
}));

// Mock the ToastContext
jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn()
  })
}));

describe('CompanyTestManagement', () => {
  test('renders the main heading', () => {
    render(
      <BrowserRouter>
        <CompanyTestManagement />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Mock Test Management')).toBeInTheDocument();
  });

  test('renders the add company button', () => {
    render(
      <BrowserRouter>
        <CompanyTestManagement />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Add Company')).toBeInTheDocument();
  });

  test('renders the create test button', () => {
    render(
      <BrowserRouter>
        <CompanyTestManagement />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Create Test')).toBeInTheDocument();
  });
});