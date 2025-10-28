import { useState, useEffect } from "react";
import Hero from "../components/Hero";
import Benefits from "../components/Benefits";
import Testimonials from "../components/Testimonials";
import { BookOpen, Users, Award, Clock, ChevronDown, Menu, X, Star, ArrowRight, Play, CheckCircle, TrendingUp } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';

const Index = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const courses = [
    {
      id: 1,
      title: "Web Development Bootcamp",
      category: "Development",
      description: "Learn HTML, CSS, JavaScript, React, Node.js and more in this comprehensive bootcamp.",
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80",
      price: 89.99,
      rating: 4.8,
      students: 12543,
      duration: "42 hours",
      level: "Beginner",
      instructor: "Sarah Johnson",
      isPopular: true
    },
    {
      id: 2,
      title: "UI/UX Design Masterclass",
      category: "Design",
      description: "Master the principles of user interface and user experience design with hands-on projects.",
      image: "https://images.unsplash.com/photo-1559028006-448665bd7c7f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      price: 79.99,
      rating: 4.9,
      students: 8932,
      duration: "38 hours",
      level: "Intermediate",
      instructor: "Michael Chen",
      isPopular: true
    },
    {
      id: 3,
      title: "Data Science Fundamentals",
      category: "Data Science",
      description: "Learn Python, statistics, machine learning, and data visualization from scratch.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      price: 99.99,
      rating: 4.7,
      students: 10234,
      duration: "56 hours",
      level: "Beginner",
      instructor: "Emily Rodriguez",
      isPopular: false
    },
    {
      id: 4,
      title: "Digital Marketing Strategy",
      category: "Marketing",
      description: "Master SEO, social media marketing, content marketing, and paid advertising.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1173&q=80",
      price: 69.99,
      rating: 4.6,
      students: 7654,
      duration: "32 hours",
      level: "Intermediate",
      instructor: "David Wilson",
      isPopular: false
    },
    {
      id: 5,
      title: "Mobile App Development",
      category: "Development",
      description: "Build native iOS and Android apps using React Native and Flutter.",
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      price: 94.99,
      rating: 4.8,
      students: 9234,
      duration: "48 hours",
      level: "Intermediate",
      instructor: "Alex Kumar",
      isPopular: false
    },
    {
      id: 6,
      title: "Business Analytics",
      category: "Business",
      description: "Learn data-driven decision making, business intelligence, and analytics tools.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      price: 84.99,
      rating: 4.7,
      students: 6789,
      duration: "40 hours",
      level: "Advanced",
      instructor: "Jessica Taylor",
      isPopular: false
    }
  ];

  const instructors = [
    {
      name: "Sarah Johnson",
      role: "Senior Web Developer",
      bio: "10+ years of experience in web development with expertise in React and Node.js.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      courses: 5,
      students: 15432,
      rating: 4.9
    },
    {
      name: "Michael Chen",
      role: "UI/UX Design Lead",
      bio: "Former designer at Google with a passion for creating intuitive user experiences.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      courses: 3,
      students: 9876,
      rating: 4.8
    },
    {
      name: "Emily Rodriguez",
      role: "Data Scientist",
      bio: "PhD in Computer Science with specialization in machine learning and AI.",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=688&q=80",
      courses: 4,
      students: 11234,
      rating: 4.9
    },
    {
      name: "David Wilson",
      role: "Marketing Strategist",
      bio: "Helped Fortune 500 companies grow their online presence through data-driven marketing.",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      courses: 6,
      students: 8765,
      rating: 4.7
    }
  ];

  const faqs = [
    {
      question: "How do I enroll in a course?",
      answer: "Simply browse our course catalog, select the course you're interested in, and click the 'Enroll Now' button. You'll be guided through the payment process and gain immediate access to the course materials."
    },
    {
      question: "Do I get a certificate upon completion?",
      answer: "Yes, all our courses come with a certificate of completion that you can add to your resume or LinkedIn profile. The certificate includes a verification link that employers can use to confirm your achievement."
    },
    {
      question: "Can I access the courses on mobile devices?",
      answer: "Absolutely! Our platform is fully responsive and works on all devices. We also have dedicated mobile apps for iOS and Android for an optimized learning experience on the go."
    },
    {
      question: "What if I'm not satisfied with a course?",
      answer: "We offer a 30-day money-back guarantee for all courses. If you're not satisfied with your purchase, simply contact our support team within 30 days for a full refund."
    },
    {
      question: "How long do I have access to course materials?",
      answer: "Once you purchase a course, you get lifetime access to all course materials, including any future updates. You can learn at your own pace and revisit the content whenever you need."
    },
    {
      question: "Do you offer corporate plans?",
      answer: "Yes, we offer customized corporate training plans for teams and organizations. Please contact our sales team for more information about volume discounts and tailored learning paths."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
                <Link to="/" className="flex items-center space-x-2">
                  <img
                    src="../Logo_3.png"
                    alt="PrepZon Logo"
                    className="h-10 w-auto"
                  />
                </Link>
            </div>
            
            <nav className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <button onClick={() => scrollToSection("/")} className="text-foreground hover:text-primary transition-colors duration-200">Home</button>
                <button onClick={() => scrollToSection("courses")} className="text-foreground hover:text-primary transition-colors duration-200">Courses</button>
                <button onClick={() => scrollToSection("benefits")} className="text-foreground hover:text-primary transition-colors duration-200">Benefits</button>
                <button onClick={() => scrollToSection("instructors")} className="text-foreground hover:text-primary transition-colors duration-200">Instructors</button>
                <button onClick={() => scrollToSection("testimonials")} className="text-foreground hover:text-primary transition-colors duration-200">Testimonials</button>
                <button onClick={() => scrollToSection("faq")} className="text-foreground hover:text-primary transition-colors duration-200">FAQ</button>
              </div>
            </nav>
            
            <div className="hidden md:block">
              <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors duration-200">
                Get Started
              </button>
            </div>
            
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-foreground hover:text-primary focus:outline-none"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-md">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button onClick={() => scrollToSection("home")} className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors duration-200">Home</button>
              <button onClick={() => scrollToSection("courses")} className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors duration-200">Courses</button>
              <button onClick={() => scrollToSection("benefits")} className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors duration-200">Benefits</button>
              <button onClick={() => scrollToSection("instructors")} className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors duration-200">Instructors</button>
              <button onClick={() => scrollToSection("testimonials")} className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors duration-200">Testimonials</button>
              <button onClick={() => scrollToSection("faq")} className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors duration-200">FAQ</button>
              <button className="block px-3 py-2 text-base font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 mt-4">
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="home">
        <Hero />
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-20 bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-6">
              Popular Courses
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Explore Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">Courses</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose from our wide range of courses taught by industry experts
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {course.isPopular && (
                    <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">
                      Popular
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-primary uppercase tracking-wide">
                      {course.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{course.rating}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-foreground mb-2 line-clamp-1">
                    {course.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{course.students.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-foreground">${course.price}</span>
                    </div>
                    <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center gap-2">
                      Enroll Now
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <button className="bg-secondary text-foreground px-6 py-3 rounded-lg hover:bg-secondary/80 transition-colors duration-200 font-medium">
              View All Courses
            </button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits">
        <Benefits />
      </section>

      {/* Instructors Section */}
      <section id="instructors" className="py-20 bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-6">
              Expert Instructors
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Learn From <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">Industry Experts</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our instructors are professionals with years of experience in their respective fields
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {instructors.map((instructor, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 text-center group">
                <div className="relative mb-4 mx-auto w-24 h-24">
                  <img 
                    src={instructor.image} 
                    alt={instructor.name}
                    className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-foreground mb-1">
                  {instructor.name}
                </h3>
                
                <p className="text-sm text-primary font-medium mb-3">
                  {instructor.role}
                </p>
                
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {instructor.bio}
                </p>
                
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{instructor.courses}</p>
                    <p className="text-xs">Courses</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{instructor.students.toLocaleString()}</p>
                    <p className="text-xs">Students</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{instructor.rating}</p>
                    <p className="text-xs">Rating</p>
                  </div>
                </div>
                
                <button className="text-primary font-medium text-sm hover:text-primary/80 transition-colors duration-200">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Testimonials Section */}
      <section id="testimonials">
        <Testimonials />
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-6">
              Frequently Asked Questions
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Got <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">Questions?</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about our platform and courses
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <details className="group">
                    <summary className="flex justify-between items-center cursor-pointer p-6 list-none">
                      <h3 className="text-lg font-semibold text-foreground pr-4">
                        {faq.question}
                      </h3>
                      <div className="flex-shrink-0 ml-2">
                        <ChevronDown className="w-5 h-5 text-primary group-open:rotate-180 transition-transform duration-300" />
                      </div>
                    </summary>
                    <div className="px-6 pb-6">
                      <p className="text-muted-foreground">
                        {faq.answer}
                      </p>
                    </div>
                  </details>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">
                Still have questions?
              </p>
              <button className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;