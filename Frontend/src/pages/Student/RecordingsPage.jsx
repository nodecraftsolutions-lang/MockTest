import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";

const RecordingsPage = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchRecordings();
  }, [courseId]);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/recordings/${courseId}`);
      if (res.data.success) {
        setCourse({ title: res.data.data.courseTitle, price: res.data.data.price });
        setRecordings(res.data.data.recordings || []);
        setIsUnlocked(res.data.data.isUnlocked);
      }
    } catch (err) {
      console.error(err);
      showError("Failed to load recordings");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    try {
      const res = await api.post(`/recordings/unlock/${courseId}`);
      if (res.data.success) {
        showSuccess("Recordings unlocked successfully!");
        setIsUnlocked(true);
        fetchRecordings();
      }
    } catch (err) {
      console.error(err);
      showError("Failed to unlock recordings");
    }
  };

  // 🔗 Convert Google Drive links to playable format
  const getPlayableUrl = (url) => {
    if (!url) return "";
    if (url.includes("drive.google.com")) {
      const match = url.match(/\/d\/([^/]+)\//);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    }
    return url; // Cloudinary, S3, etc. directly work
  };

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900">{course?.title || "Course Recordings"}</h1>

      {/* Unlock Button */}
      {!isUnlocked && (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
          <p className="mb-3 text-gray-800">
            Unlock all recordings for <span className="font-semibold">₹{course?.price}</span>
          </p>
          <button onClick={handleUnlock} className="btn-primary">
            Unlock Recordings
          </button>
        </div>
      )}

      {/* Recordings List */}
      {isUnlocked && (
        <div className="space-y-6">
          {recordings.length === 0 ? (
            <p className="text-gray-500 italic">No recordings available yet.</p>
          ) : (
            recordings.map((rec) => (
              <div
                key={rec._id}
                className="p-4 border rounded-lg shadow-sm bg-white space-y-2"
              >
                <h3 className="font-semibold text-lg">{rec.title}</h3>
                {rec.description && (
                  <p className="text-gray-600 text-sm">{rec.description}</p>
                )}

                {/* 🎥 Video Player */}
                <div className="flex justify-center">
                  <video
                    src={getPlayableUrl(rec.videoUrl)}
                    controls
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    className="rounded-lg shadow w-3/4 md:w-2/3 lg:w-1/2"
                    poster={
                      rec.thumbnailUrl ||
                      "https://via.placeholder.com/530x360.png?text=Recording"
                    }
                  />
                </div>

                {rec.duration > 0 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Duration: {rec.duration} mins
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default RecordingsPage;
