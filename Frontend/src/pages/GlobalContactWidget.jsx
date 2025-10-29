import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, MapPin, Send, Mail, Phone, Clock, Sparkles } from "lucide-react";
import axios from "axios";

const GlobalContactWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");
  const widgetRef = useRef(null);
  const timeoutRef = useRef(null);

  // Close widget when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");
    try {
      await axios.post("https://prep-zone-mailserver.vercel.app/api/mail/contact", formData);
      setStatus("✅ Sent!");
      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus("❌ Failed");
      setTimeout(() => setStatus(""), 3000);
    }
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  return (
    <div 
      ref={widgetRef}
      className="fixed bottom-6 right-6 z-50"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Compact Floating Button */}
      <button
        className={`
          relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-3 
          rounded-full shadow-xl hover:shadow-2xl transition-all duration-500
          hover:scale-110 group
          ${isOpen ? 'rotate-45' : ''}
        `}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
        
        {/* Sparkle animation */}
        <div className="absolute -top-1 -right-1">
          <Sparkles size={12} className="text-yellow-300 animate-pulse" />
        </div>
        
        {isOpen ? (
          <X size={20} className="transform transition-transform duration-300" />
        ) : (
          <MessageCircle size={20} className="transform group-hover:scale-110 transition-transform duration-300" />
        )}
      </button>

      {/* Compact Contact Card */}
      <div className={`
        absolute bottom-16 right-0 w-56 bg-white/90 backdrop-blur-lg text-gray-800 shadow-2xl 
        rounded-xl p-4 transition-all duration-500 border border-white/20
        ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}
      `}>
        {/* Compact Header */}
        <div className="text-center mb-4 relative overflow-hidden rounded-lg p-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-white/20 backdrop-blur rounded-full mb-2">
              <Mail size={16} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Contact Us
            </h3>
            <p className="text-white/80 text-xs mt-1">We'd love to hear!</p>
          </div>
        </div>

        {/* Compact Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all">
            <div className="p-1.5 bg-blue-500 rounded-lg">
              <MapPin size={12} className="text-white" />
            </div>
            <span className="text-xs text-gray-700 font-medium">Prepzon EdTech, B-Block, Silver Springs Layout, Marathahalli, Munnekolala, Bangalore, Karnataka, India, 560037</span>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-all">
            <div className="p-1.5 bg-green-500 rounded-lg">
              <Clock size={12} className="text-white" />
            </div>
            <span className="text-xs text-gray-700 font-medium">9AM-8PM Daily</span>
          </div>
        </div>

        {/* Compact WhatsApp Button */}
        <a
          href="https://api.whatsapp.com/send?phone=918431761279"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-white-500 to-emerald-600 text-green-700 py-2 px-3 rounded-lg mb-4 hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg text-sm font-medium"
        >
          <img src="/whatsapp.jpg" alt="WhatsApp" className="w-6 h-6 object-contain" />
          <span>WhatsApp</span>
        </a>

        {/* Compact Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white/90 backdrop-blur text-gray-500">Or message</span>
          </div>
        </div>

        {/* Compact Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-3">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name"
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white/70 backdrop-blur hover:bg-white"
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white/70 backdrop-blur hover:bg-white"
            />
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Message..."
              required
              rows="2"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white/70 backdrop-blur hover:bg-white resize-none"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-2 px-3 rounded-lg hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 flex items-center justify-center gap-1.5 transition-all transform hover:scale-105 shadow-lg text-sm font-medium"
          >
            <Send size={14} />
            Send
          </button>
        </form>

        {status && (
          <p className={`text-xs text-center mt-3 font-medium p-2 rounded-lg ${
            status.includes("✅") 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : status.includes("Sending")
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {status}
          </p>
        )}

        {/* Compact Footer */}
        <div className="text-center mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <Clock size={10} />
            Reply within 2 hours
          </p>
        </div>
      </div>
    </div>
  );
};

export default GlobalContactWidget;