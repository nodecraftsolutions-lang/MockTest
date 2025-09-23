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
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mock Tests</h1>
        <p className="text-gray-600">
          Select a company below to view its mock tests.
        </p>
      </div>

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <div className="card text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No companies available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Link
              key={company._id}
              to={`/student/mock-tests/${company._id}`}
              className="card p-6 flex flex-col items-center text-center hover:shadow-lg transition"
            >
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-20 h-20 object-contain mb-4"
                />
              ) : (
                <div className="w-20 h-20 flex items-center justify-center bg-primary-50 rounded-full mb-4">
                  <Building className="w-10 h-10 text-primary-600" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900">
                {company.name}
              </h3>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {company.description}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyList;