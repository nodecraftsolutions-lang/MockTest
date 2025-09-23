import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen">
      {/* Student Sidebar */}
      <Sidebar type="student" />

      {/* Main Content */}
      <main className="flex-1 ml-64 bg-gray-50">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
