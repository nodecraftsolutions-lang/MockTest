import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Send, Loader2, Mail } from "lucide-react";
import { useToast } from "../context/ToastContext";

const AdminMailPage = () => {
    const { showSuccess, showError } = useToast();
    
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    
    const [formData, setFormData] = useState({
        title: "",
        update: "",
        description: "",
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axios.post(
                "https://prep-zone-mailserver.vercel.app/api/mail/notify-all",
                formData
            );

            showSuccess("✅ Mails sent successfully!");
            setFormData({ title: "", update: "", description: "" });
        } catch (error) {
            showError(error.response?.data?.error || "❌ Failed to send emails. Try again!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Send Mail to All Users</h1>
                    <p className="text-gray-600 mt-1">Notify all users about important updates and announcements</p>
                </div>
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl"
                >
                    <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">📧 Bulk Email Notification</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter email subject/title"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">This will be the subject line of the email</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Update Summary
                            </label>
                            <input
                                type="text"
                                name="update"
                                value={formData.update}
                                onChange={handleChange}
                                placeholder="Brief summary of the update"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">A short headline for the email content</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Detailed Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Enter full details of the announcement/update..."
                                rows="6"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 resize-none"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">Full content of your email notification</p>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            disabled={loading}
                            type="submit"
                            className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all py-3 rounded-lg text-white font-medium disabled:opacity-50 shadow-sm"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin w-5 h-5" /> Sending Emails...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" /> Send to All Users
                                </>
                            )}
                        </motion.button>
                    </form>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h3 className="font-medium text-blue-800 mb-2">📧 Email Notification Guidelines</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Emails will be sent to all registered users in the system</li>
                            <li>• Keep subject lines clear and concise</li>
                            <li>• Include all important details in the description</li>
                            <li>• Avoid sending too many notifications in a short period</li>
                        </ul>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminMailPage;