import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const DashboardLayout = () => {
  return (
    <div><Header />
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 flex flex-row">
        <Sidebar type="student" />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
    </div>
  );
};

export default DashboardLayout;