import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building, Loader2 } from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.get("/companies");
      if (res.data.success) {
        setCompanies(res.data.data.companies || []);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      showError("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight flex items-center gap-2">
          <Building className="w-8 h-8 text-primary-600" />
          Mock Test Companies
        </h1>
        <p className="text-gray-600 text-lg">
          Select a company below to view its mock tests.
        </p>
      </div>

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
          <Building className="w-16 h-16 text-primary-400 mb-4 animate-bounce" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No companies available
          </h3>
          <p className="text-gray-600 mb-2">
            Please check back later for more mock test opportunities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {companies.map((company, idx) => (
            <Link
              key={company._id}
              to={`/student/mock-tests/${company._id}`}
              className="bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-2xl shadow-md hover:shadow-xl transition hover:scale-[1.03] duration-200 flex flex-col items-center text-center p-8 animate-fade-in"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-20 h-20 object-contain mb-4 rounded-full shadow"
                />
              ) : (
                <div className="w-20 h-20 flex items-center justify-center bg-primary-100 rounded-full mb-4">
                  <Building className="w-10 h-10 text-primary-600" />
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                {company.name}
              </h3>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2 whitespace-pre-line" style={{ fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: company.description?.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-lg">$1</strong>') || '' }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyList;