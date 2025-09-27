// student/pages/Recordings.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { PlayCircle } from "lucide-react";

const Recordings = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/courses?withRecordings=true"); 
      setCourses(res.data.data.courses || []);
    } catch (err) {
      console.error("Failed to fetch courses with recordings:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Recordings</h1>
      {courses.length === 0 ? (
        <p className="text-gray-600">No recordings available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course._id}
              to={`/student/recordings/${course._id}`}
              className="card hover:shadow-lg p-6 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {course.title}
                </h2>
                <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                  {course.description}
                </p>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500">
                  {course.recordingsPrice === 0
                    ? "Free"
                    : `₹${course.recordingsPrice}`}
                </span>
                <PlayCircle className="w-6 h-6 text-blue-600" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recordings;
