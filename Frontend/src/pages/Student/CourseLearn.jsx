import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Calendar, Video, Clock, Send, MessageSquare } from "lucide-react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";

const CourseLearn = () => {
  const { id } = useParams();
  const [sessions, setSessions] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchSessions();
    fetchDiscussions();
  }, [id]);

  const fetchSessions = async () => {
    try {
      const res = await api.get(`/courses/${id}/sessions`);
      if (res.data.success) setSessions(res.data.data);
    } catch {
      showError("Failed to load sessions");
    }
  };

  const fetchDiscussions = async () => {
    try {
      const res = await api.get(`/courses/${id}/discussions`);
      if (res.data.success) setDiscussions(res.data.data);
    } catch {
      showError("Failed to load discussions");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      const res = await api.post(`/courses/${id}/discussions`, { message });
      if (res.data.success) {
        setDiscussions((prev) => [...prev, res.data.data]);
        setMessage("");
        showSuccess("Message sent");
      }
    } catch {
      showError("Failed to send message");
    }
  };

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="space-y-8 p-6">
      {/* Live Sessions */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Video className="w-5 h-5 text-primary-600 mr-2" /> Live Sessions
        </h2>
        {sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((s) => (
              <div
                key={s._id}
                className="p-4 border rounded-lg flex items-center justify-between hover:shadow-md transition"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {s.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 space-x-4 mt-1">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(s.startsAt).toLocaleString()}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {s.duration} mins
                    </span>
                  </div>
                </div>
                <a
                  href={s.streamLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Join
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No sessions scheduled yet.</p>
        )}
      </div>

      {/* Discussions */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <MessageSquare className="w-5 h-5 text-primary-600 mr-2" /> Discussions
        </h2>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {discussions.map((d) => (
            <div key={d._id} className="p-3 border rounded-lg bg-gray-50">
              <p className="text-sm text-gray-800">
                <span className="font-semibold text-primary-700">
                  {d.studentId?.name || "Student"}:
                </span>{" "}
                {d.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(d.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {discussions.length === 0 && (
            <p className="text-gray-600">No discussions yet. Be the first!</p>
          )}
        </div>

        {/* Message Box */}
        <div className="flex items-center mt-4 space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 input-field"
          />
          <button
            onClick={handleSend}
            className="btn-primary flex items-center"
          >
            <Send className="w-4 h-4 mr-1" /> Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseLearn;
