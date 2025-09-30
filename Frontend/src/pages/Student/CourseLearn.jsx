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
    Promise.all([fetchSessions(), fetchDiscussions()]).finally(() =>
      setLoading(false)
    );
    // eslint-disable-next-line
  }, [id]);

  const fetchSessions = async () => {
    try {
      const res = await api.get(`/courses/${id}/sessions`);
      if (res.data.success) setSessions(res.data.data || []);
    } catch {
      showError("Failed to load sessions");
    }
  };

  const fetchDiscussions = async () => {
    try {
      const res = await api.get(`/courses/${id}/discussions`);
      if (res.data.success) setDiscussions(res.data.data || []);
    } catch {
      showError("Failed to load discussions");
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
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-10 animate-fade-in">
      {/* Live Sessions */}
      <section className="bg-white rounded-2xl shadow-xl p-8 transition hover:shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Video className="w-7 h-7 text-primary-600 animate-pulse" />
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Live Sessions
          </h2>
        </div>
        {sessions.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {sessions.map((s, idx) => (
              <div
                key={s._id}
                className="bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-xl p-5 flex flex-col gap-2 shadow transition hover:scale-[1.02] hover:shadow-lg duration-200"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {s.title}
                  </h3>
                  {s.streamLink ? (
                    <a
                      href={s.streamLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary px-4 py-1 text-sm rounded-full shadow hover:-translate-y-0.5 transition"
                    >
                      Join
                    </a>
                  ) : (
                    <span className="btn-secondary px-4 py-1 text-sm rounded-full opacity-60 cursor-not-allowed">
                      Link Unavailable
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-600 gap-6 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(s.startsAt).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {s.duration} mins
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            <Video className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No sessions scheduled yet.</p>
          </div>
        )}
      </section>

      {/* Discussions */}
      <section className="bg-white rounded-2xl shadow-xl p-8 transition hover:shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-7 h-7 text-primary-600 animate-bounce" />
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Open Forums
          </h2>
        </div>
        <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
          {discussions.length > 0 ? (
            discussions.map((d, idx) => (
              <div
                key={d._id}
                className={`flex flex-col gap-1 bg-primary-50/60 border border-primary-100 rounded-lg px-4 py-3 shadow-sm transition animate-fade-in`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <span className="font-semibold text-primary-700 text-sm">
                  {d.studentId?.name || "Student"}
                </span>
                <span className="text-gray-800 text-base">{d.message}</span>
                <span className="text-xs text-gray-400 mt-1 self-end">
                  {new Date(d.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No discussions yet. Be the first!</p>
            </div>
          )}
        </div>
        {/* Message Box */}
        <div className="flex items-center mt-6 gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 input-field rounded-full px-5 py-2 border-2 border-primary-200 focus:border-primary-500 transition"
            onKeyDown={e => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            className="btn-primary flex items-center gap-1 px-5 py-2 rounded-full shadow hover:scale-105 transition"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </section>
    </div>
  );
};

export default CourseLearn;