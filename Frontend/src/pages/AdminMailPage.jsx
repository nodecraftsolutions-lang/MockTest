import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";

const AdminMailPage = () => {
    useEffect(()=>{
        window.scrollTo(0,0);
    },[])
  const [formData, setFormData] = useState({
    title: "",
    update: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(
        "https://prep-zone-mailserver.vercel.app/api/mail/notify-all",
        formData
      );

      setMessage(res.data.message || "✅ Mails sent successfully!");
      setFormData({ title: "", update: "", description: "" });
    } catch (error) {
      setMessage(
        error.response?.data?.error || "❌ Failed to send emails. Try again!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-xl border border-blue-100"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center text-blue-700">
          📧 Send Mail to All Users
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter mail title"
              className="w-full p-3 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-800"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Update
            </label>
            <input
              type="text"
              name="update"
              value={formData.update}
              onChange={handleChange}
              placeholder="Enter update summary"
              className="w-full p-3 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-800"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter full details here..."
              rows="5"
              className="w-full p-3 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-800 resize-none"
              required
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={loading}
            type="submit"
            className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-all p-3 rounded-lg text-white font-medium disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" /> Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" /> Send Mail
              </>
            )}
          </motion.button>
        </form>

        {message && (
          <p
            className={`text-center mt-4 text-sm ${
              message.includes("✅")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default AdminMailPage;
