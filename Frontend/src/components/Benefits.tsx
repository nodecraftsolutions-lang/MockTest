import { BookOpen, Award, Users, TrendingUp, Clock, Shield, ArrowRight } from "lucide-react";
import { useState } from "react";

const Benefits = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const benefits = [
    {
      icon: BookOpen,
      title: "Quality Content",
      description: "Access to high-quality learning materials curated by industry experts.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Award,
      title: "Certified Courses",
      description: "Earn recognized certificates upon completion of courses.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Users,
      title: "Expert Instructors",
      description: "Learn from professionals with years of industry experience.",
      gradient: "from-green-500 to-teal-500",
    },
    {
      icon: TrendingUp,
      title: "Career Growth",
      description: "Advance your career with in-demand skills and knowledge.",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: Clock,
      title: "Flexible Learning",
      description: "Study at your own pace, anytime and anywhere you want.",
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      icon: Shield,
      title: "Lifetime Access",
      description: "Get unlimited access to course materials even after completion.",
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-secondary/20 via-secondary/30 to-secondary/20">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-6">
            Why Choose Us
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            By Joining Our Platform,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">
              You Can Avail A Lot Of Benefits
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We provide everything you need for a successful learning journey with personalized paths and expert guidance
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            const isHovered = hoveredIndex === index;
            
            return (
              <div
                key={index}
                className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden animate-fade-in-up cursor-pointer transform hover:-translate-y-2`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Card background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                {/* Card content */}
                <div className="relative p-8">
                  {/* Icon container with gradient background */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${benefit.gradient} rounded-2xl flex items-center justify-center mb-6 transform transition-transform duration-500 ${isHovered ? 'scale-110 rotate-3' : ''}`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Card title */}
                  <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                    {benefit.title}
                  </h3>
                  
                  {/* Card description */}
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {benefit.description}
                  </p>
                  
                  {/* Learn more link */}
                  <div className={`flex items-center text-primary font-medium transition-all duration-300 ${isHovered ? 'translate-x-2' : ''}`}>
                    <span>Learn more</span>
                    <ArrowRight className={`w-4 h-4 ml-2 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                  </div>
                </div>
                
                {/* Bottom accent line */}
                <div className={`h-1 bg-gradient-to-r ${benefit.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
              </div>
            );
          })}
        </div>
      
      </div>
    </section>
  );
};

export default Benefits;