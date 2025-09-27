import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api'; // 👈 adjust path if your API service is elsewhere
//mocktests
export default function StudentMockTests() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get('/companies'); // ✅ backend route
        setCompanies(res.data.data || []);
      } catch (err) {
        console.error('Error fetching companies', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Select a Company</h1>
      {companies.length === 0 ? (
        <p className="text-gray-600">No companies available</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Link
              key={company._id}
              to={`/student/mock-tests/${company._id}`}
              className="p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition"
            >
              {company.logoUrl && (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="h-16 mx-auto mb-4"
                />
              )}
              <h2 className="text-lg font-semibold text-center">{company.name}</h2>
              <p className="text-sm text-gray-500 text-center">{company.category}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
