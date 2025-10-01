import { useEffect, useState } from "react";
import Button from "@mui/material/Button";

import { Home, Search, BookOpen, Sparkles, Users, Globe, Zap, ArrowRight, Star } from "lucide-react";

const NotFound3D = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setIsLoaded(true);
    
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 40;
      const y = (e.clientY / window.innerHeight - 0.5) * 40;
      setMousePosition({ x, y });
    };

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(timeInterval);
    };
  }, []);

  const floatingOrbs = [
    { color: "from-purple-500 to-pink-500", size: "w-32 h-32", delay: "delay-0", duration: "duration-15" },
    { color: "from-blue-500 to-cyan-500", size: "w-24 h-24", delay: "delay-3", duration: "duration-20" },
    { color: "from-green-500 to-emerald-500", size: "w-28 h-28", delay: "delay-6", duration: "duration-18" },
    { color: "from-orange-500 to-red-500", size: "w-20 h-20", delay: "delay-9", duration: "duration-12" },
    { color: "from-indigo-500 to-purple-500", size: "w-36 h-36", delay: "delay-12", duration: "duration-25" },
  ];

  const stats = [
    { label: "Active Courses", value: "500+", icon: BookOpen, color: "text-blue-400" },
    { label: "Happy Students", value: "50K+", icon: Users, color: "text-green-400" },
    { label: "Resources", value: "10K+", icon: Zap, color: "text-yellow-400" },
    { label: "Countries", value: "100+", icon: Globe, color: "text-purple-400" },
  ];

  const features = [
    { text: "Interactive Learning", icon: Zap },
    { text: "Expert Instructors", icon: Users },
    { text: "24/7 Support", icon: Globe },
    { text: "Certification", icon: Star },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Cosmic Background */}
      <div className="absolute inset-0">
        {/* Stars */}
        {[...Array(150)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3}px`,
              height: `${Math.random() * 3}px`,
              opacity: Math.random() * 0.7 + 0.3,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}

        {/* Floating Orbs */}
        {floatingOrbs.map((orb, index) => (
          <div
            key={index}
            className={`absolute rounded-full bg-gradient-to-br ${orb.color} opacity-20 blur-3xl animate-float ${orb.delay} ${orb.duration}`}
            style={{
              left: `${20 + index * 15}%`,
              top: `${10 + index * 12}%`,
              transform: `translate(${mousePosition.x * (0.1 + index * 0.05)}px, ${mousePosition.y * (0.1 + index * 0.05)}px)`,
            }}
          />
        ))}
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
        {/* Cosmic Portal Container */}
        <div
          className={`relative max-w-6xl w-full transform transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Outer Glow Ring */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-30 animate-pulse" />
          
          {/* Main Glass Card */}
          <div
            className="relative glass depth-6 rounded-3xl p-12 backdrop-blur-2xl border border-white/10 shadow-2xl"
            style={{
              transform: `perspective(2000px) rotateX(${mousePosition.y * 0.03}deg) rotateY(${mousePosition.x * 0.03}deg) scale(1.02)`,
              background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white/10 animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${2 + Math.random() * 4}px`,
                    height: `${2 + Math.random() * 4}px`,
                    animationDelay: `${Math.random() * 10}s`,
                    animationDuration: `${8 + Math.random() * 12}s`,
                  }}
                />
              ))}
            </div>

            {/* 3D 404 Text with Holographic Effect */}
            <div className="relative mb-12 text-center">
              <div className="relative inline-block">
                <h1
                  className="text-[10rem] md:text-[18rem] font-black leading-none bg-gradient-to-br from-blue-400 via-purple-500 to-pink-400 bg-clip-text text-transparent animate-gradient-x"
                  style={{
                    textShadow: `
                      0 0 40px rgba(59, 130, 246, 0.5),
                      0 0 80px rgba(147, 51, 234, 0.3),
                      0 0 120px rgba(236, 72, 153, 0.2)
                    `,
                    transform: `perspective(1000px) rotateX(${mousePosition.y * 0.8}deg) rotateY(${mousePosition.x * 0.8}deg)`,
                    filter: `blur(${Math.abs(mousePosition.x * 0.01)}px)`,
                  }}
                >
                  404
                </h1>
                
                {/* Holographic Reflection */}
                <div
                  className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-30 mix-blend-overlay rounded-full blur-xl"
                  style={{
                    transform: `translateY(50%) scaleY(-1) rotateX(${mousePosition.y * 0.5}deg)`,
                  }}
                />
              </div>

              {/* Binary Rain Effect */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl opacity-20">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute text-green-400 font-mono text-sm animate-binary-rain"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 5}s`,
                      animationDuration: `${3 + Math.random() * 4}s`,
                    }}
                  >
                    {Math.random() > 0.5 ? "1" : "0"}
                  </div>
                ))}
              </div>
            </div>

            {/* Content Section */}
            <div className="text-center space-y-8 relative z-10">
              {/* Main Message */}
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Lost in Cyberspace?
                </h2>
                <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  Fear not, explorer! While this page doesn't exist, our educational universe is vast and full of knowledge waiting to be discovered.
                </p>
              </div>

              {/* Current Time Display */}
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-gray-300 font-mono text-sm">
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-3">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all duration-300 hover:scale-105"
                  >
                    <feature.icon className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-300">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-6 justify-center pt-8">
                <a href="/">
                  <Button
                    size="lg"
                    className="group relative overflow-hidden rounded-2xl px-10 py-7 text-lg font-bold transition-all duration-500 hover:scale-105 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-2xl shadow-blue-500/25"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      <Home className="w-6 h-6" />
                      Beam Me Home
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition-opacity duration-500" />
                  </Button>
                </a>

                <Button
                  size="lg"
                  variant="outline"
                  className="group glass border-2 border-white/20 rounded-2xl px-10 py-7 text-lg font-bold transition-all duration-500 hover:scale-105 hover:border-white/40 hover:bg-white/10 backdrop-blur-sm"
                >
                  <span className="flex items-center gap-3">
                    <Search className="w-6 h-6" />
                    Explore Courses
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-current/10"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    {/* Icon Container */}
                    <div className={`relative mb-4 p-3 rounded-xl bg-white/5 inline-block group-hover:scale-110 transition-transform duration-300 ${stat.color}`}>
                      <stat.icon className="w-8 h-8" />
                    </div>
                    
                    {/* Value */}
                    <p className="text-3xl font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
                      {stat.value}
                    </p>
                    
                    {/* Label */}
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      {stat.label}
                    </p>

                    {/* Hover Glow */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-current to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                  </div>
                ))}
              </div>

              {/* Motivational Quote */}
              <div className="pt-8 border-t border-white/10">
                <p className="text-lg text-gray-400 italic">
                  "The only true wisdom is in knowing you know nothing." - Socrates
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-gray-500 text-sm">
            Educational Platform • Error 404 • {currentTime.toLocaleDateString()}
          </p>
          <p className="text-gray-600 text-xs">
            Continue your learning journey with us
          </p>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes binary-rain {
          0% { transform: translateY(-100px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        .animate-float {
          animation: float 15s ease-in-out infinite;
        }
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
          background-size: 200% 200%;
        }
        .animate-binary-rain {
          animation: binary-rain linear infinite;
        }
        .glass {
          backdrop-filter: blur(16px) saturate(180%);
          background-color: rgba(17, 25, 40, 0.75);
        }
        .depth-6 {
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
};

export default NotFound3D;