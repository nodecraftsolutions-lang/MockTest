import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Users, Award, Clock, ChevronDown, Star, ArrowRight, Play, CheckCircle, TrendingUp, ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [scrolled, setScrolled] = useState(false);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentInstructorIndex, setCurrentInstructorIndex] = useState(0);
  const [currentAlumniIndex, setCurrentAlumniIndex] = useState(0);
  const [currentCourseIndex, setCurrentCourseIndex] = useState(0); // For course carousel
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth); // Track window width
  const carouselRef = useRef(null);
  const alumniCarouselRef = useRef(null);
  const courseCarouselRef = useRef(null); // For course carousel
  const intervalRef = useRef(null);
  const alumniIntervalRef = useRef(null);
  const courseIntervalRef = useRef(null); // For course carousel
  const { showError } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses');
        if (response.data.success) {
          // Take only the first 6 courses for the homepage
          const homepageCourses = response.data.data.slice(0, 6).map(course => ({
            id: course._id,
            title: course.title,
            category: course.category || 'General',
            description: course.description,
            image: "/course Image.png", // Use the same image for all courses
            price: course.price || 0,
            rating: 4.5, // Default rating
            students: Math.floor(Math.random() * 10000) + 1000, // Random student count
            duration: `${course.duration || 20} hours`,
            level: course.level || 'Beginner',
            instructor: course.instructors?.[0]?.name || 'Expert Instructor',
            isPopular: course.isPaid !== undefined ? course.isPaid : false
          }));
          setCourses(homepageCourses);
          
          // Extract ALL instructors from ALL courses
          const instructorMap = new Map();
          response.data.data.forEach(course => {
            if (course.instructors && course.instructors.length > 0) {
              course.instructors.forEach(instr => {
                if (!instructorMap.has(instr._id)) {
                  instructorMap.set(instr._id, {
                    id: instr._id,
                    name: instr.name,
                    expertise: instr.expertise || "Instructor",
                    experience: instr.experience || "",
                    bio: instr.bio || "Experienced professional in their field",
                    photoUrl: instr.photoUrl || "https://ui-avatars.com/api/?background=random&color=fff&bold=true&name=" + encodeURIComponent(instr.name),
                    courses: 1
                  });
                } else {
                  // Increment course count for this instructor
                  const existing = instructorMap.get(instr._id);
                  existing.courses += 1;
                  instructorMap.set(instr._id, existing);
                }
              });
            }
          });
          
          // Convert map to array - now we get ALL instructors, not just 4
          const allInstructors = Array.from(instructorMap.values());
          setInstructors(allInstructors);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        showError("Failed to load courses");
        // Fallback to static data if API fails
        setCourses(getStaticCourses());
        setInstructors(getStaticInstructors());
      }
    };

    fetchCourses();
  }, []);

  // Fetch featured alumni
  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const response = await api.get('/alumni/featured');
        if (response.data.success) {
          setAlumni(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch alumni:", error);
        // Empty array instead of mock data
        setAlumni([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlumni();
  }, []);

  // Autoplay functionality for instructors
  useEffect(() => {
    if (instructors.length > (windowWidth < 640 ? 1 : windowWidth < 768 ? 2 : 4)) {
      intervalRef.current = setInterval(() => {
        setCurrentInstructorIndex(prev => {
          // Calculate next index (wraps around)
          const nextIndex = prev + (windowWidth < 640 ? 1 : windowWidth < 768 ? 2 : 4);
          return nextIndex >= instructors.length ? 0 : nextIndex;
        });
      }, 5000); // Change slide every 5 seconds
    }

    // Cleanup interval on component unmount or when instructors change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [instructors.length, windowWidth]);

  // Autoplay functionality for alumni
  useEffect(() => {
    if (alumni.length > 1) {
      alumniIntervalRef.current = setInterval(() => {
        setCurrentAlumniIndex(prev => {
          // Calculate next index (wraps around)
          const nextIndex = prev + 1;
          return nextIndex >= alumni.length ? 0 : nextIndex;
        });
      }, 6000); // Change slide every 6 seconds
    }

    // Cleanup interval on component unmount or when alumni change
    return () => {
      if (alumniIntervalRef.current) {
        clearInterval(alumniIntervalRef.current);
      }
    };
  }, [alumni.length]);

  // Autoplay functionality for courses
  useEffect(() => {
    if (courses.length > 1) {
      courseIntervalRef.current = setInterval(() => {
        setCurrentCourseIndex(prev => {
          // Calculate next index (wraps around)
          const nextIndex = prev + 1;
          return nextIndex >= courses.length ? 0 : nextIndex;
        });
      }, 7000); // Change slide every 7 seconds
    }

    // Cleanup interval on component unmount or when courses change
    return () => {
      if (courseIntervalRef.current) {
        clearInterval(courseIntervalRef.current);
      }
    };
  }, [courses.length, windowWidth]);

  // Pause autoplay on hover for instructors
  const handleInstructorMouseEnter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleInstructorMouseLeave = () => {
    if (instructors.length > (windowWidth < 640 ? 1 : windowWidth < 768 ? 2 : 4)) {
      intervalRef.current = setInterval(() => {
        setCurrentInstructorIndex(prev => {
          // Calculate next index (wraps around)
          const nextIndex = prev + (windowWidth < 640 ? 1 : windowWidth < 768 ? 2 : 4);
          return nextIndex >= instructors.length ? 0 : nextIndex;
        });
      }, 5000);
    }
  };

  // Pause autoplay on hover for alumni
  const handleAlumniMouseEnter = () => {
    if (alumniIntervalRef.current) {
      clearInterval(alumniIntervalRef.current);
    }
  };

  const handleAlumniMouseLeave = () => {
    if (alumni.length > 3) {
      alumniIntervalRef.current = setInterval(() => {
        setCurrentAlumniIndex(prev => {
          // Calculate next index (wraps around)
          const nextIndex = prev + 3;
          return nextIndex >= alumni.length ? 0 : nextIndex;
        });
      }, 6000);
    }
  };

  // Pause autoplay on hover for courses
  const handleCourseMouseEnter = () => {
    if (courseIntervalRef.current) {
      clearInterval(courseIntervalRef.current);
    }
  };

  const handleCourseMouseLeave = () => {
    if (courses.length > 1) {
      courseIntervalRef.current = setInterval(() => {
        setCurrentCourseIndex(prev => {
          // Calculate next index (wraps around)
          const nextIndex = prev + 1;
          return nextIndex >= courses.length ? 0 : nextIndex;
        });
      }, 7000);
    }
  };

  // Carousel navigation for instructors
  const nextInstructors = () => {
    setCurrentInstructorIndex(prev => 
      prev + (windowWidth < 640 ? 1 : windowWidth < 768 ? 2 : 4) >= instructors.length ? 0 : prev + (windowWidth < 640 ? 1 : windowWidth < 768 ? 2 : 4)
    );
  };

  const prevInstructors = () => {
    setCurrentInstructorIndex(prev => 
      prev - (windowWidth < 640 ? 1 : windowWidth < 768 ? 2 : 4) < 0 ? 
      Math.max(0, instructors.length - (windowWidth < 640 ? 1 : windowWidth < 768 ? 2 : 4)) : 
      prev - (windowWidth < 640 ? 1 : windowWidth < 768 ? 2 : 4)
    );
  };

  // Carousel navigation for alumni
  const nextAlumni = () => {
    setCurrentAlumniIndex(prev => 
      prev + 1 >= alumni.length ? 0 : prev + 1
    );
  };

  const prevAlumni = () => {
    setCurrentAlumniIndex(prev => 
      prev - 1 < 0 ? Math.max(0, alumni.length - 1) : prev - 1
    );
  };

  // Carousel navigation for courses
  const nextCourses = () => {
    setCurrentCourseIndex(prev => 
      prev + 1 >= courses.length ? 0 : prev + 1
    );
  };

  const prevCourses = () => {
    setCurrentCourseIndex(prev => 
      prev - 1 < 0 ? Math.max(0, courses.length - 1) : prev - 1
    );
  };

  const handleEnrollClick = (courseId) => {
    if (isAuthenticated) {
      // If user is logged in, go directly to the course page
      navigate(`/student/courses/${courseId}`);
    } else {
      // If user is not logged in, redirect to auth page
      // Store the course ID in localStorage to redirect after login
      localStorage.setItem('redirectAfterLogin', `/student/courses/${courseId}`);
      navigate('/auth');
    }
  };

  const handleViewTests = () => {
    if (isAuthenticated) {
      // If user is logged in, go to student mock tests page
      navigate('/student/mock-tests');
    } else {
      // If user is not logged in, redirect to auth page
      // Store the redirect path in localStorage
      localStorage.setItem('redirectAfterLogin', '/student/mock-tests');
      navigate('/auth');
    }
  };

  const getStaticCourses = () => [
    {
      id: 1,
      title: "Web Development Bootcamp",
      category: "Development",
      description: "Learn HTML, CSS, JavaScript, React, Node.js and more in this comprehensive bootcamp.",
      image: "/course Image.png", // Use the same image for all courses
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
      image: "/course Image.png", // Use the same image for all courses
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
      image: "/course Image.png", // Use the same image for all courses
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
      image: "/course Image.png", // Use the same image for all courses
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
      image: "/course Image.png", // Use the same image for all courses
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
      image: "/course Image.png", // Use the same image for all courses
      price: 84.99,
      rating: 4.7,
      students: 6789,
      duration: "40 hours",
      level: "Advanced",
      instructor: "Jessica Taylor",
      isPopular: false
    }
  ];

  const getStaticInstructors = () => [
    {
      name: "Sarah Johnson",
      expertise: "Senior Web Developer",
      experience: "10+ years of experience in web development with expertise in React and Node.js.",
      bio: "Passionate about teaching web development and helping students build real-world projects.",
      photoUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      courses: 5
    },
    {
      name: "Michael Chen",
      expertise: "UI/UX Design Lead",
      experience: "Former designer at Google with a passion for creating intuitive user experiences.",
      bio: "Specializes in user-centered design and has helped startups create award-winning products.",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      courses: 3
    },
    {
      name: "Emily Rodriguez",
      expertise: "Data Scientist",
      experience: "PhD in Computer Science with specialization in machine learning and AI.",
      bio: "Researcher and educator focused on making data science accessible to everyone.",
      photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=688&q=80",
      courses: 4
    },
    {
      name: "David Wilson",
      expertise: "Marketing Strategist",
      experience: "Helped Fortune 500 companies grow their online presence through data-driven marketing.",
      bio: "Digital marketing expert with a focus on SEO, content marketing, and conversion optimization.",
      photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      courses: 6
    },
    {
      name: "Alex Kumar",
      expertise: "Mobile App Developer",
      experience: "8+ years building cross-platform mobile applications with React Native.",
      bio: "Passionate about mobile development and teaching others to build amazing apps.",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      courses: 3
    },
    {
      name: "Jessica Taylor",
      expertise: "Business Analytics Expert",
      experience: "Former data analyst at Microsoft with expertise in business intelligence tools.",
      bio: "Helps organizations make data-driven decisions through advanced analytics techniques.",
      photoUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      courses: 4
    }
  ];

  const getStaticAlumni = () => [];

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
      question: "Already Trained Elsewhere?",
      answer: "You can still join Prepzon to test your knowledge with our mock tests. Identify your weak areas, get explanations, and keep improving until you’re fully job-ready."
    },
    {
      question: "How long do I have access to course materials?",
      answer: "Access upto 12 months from the date of purchase."
    },
    {
      question: "Do you offer corporate plans?",
      answer: "Yes, we offer customized corporate training plans for teams and organizations. Please contact our sales team for more information about volume discounts and tailored learning paths."
    }
  ];

  // Cleanup intervals on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (alumniIntervalRef.current) {
        clearInterval(alumniIntervalRef.current);
      }
      if (courseIntervalRef.current) {
        clearInterval(courseIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with new content and img4.png */}
      <section id="home">
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-4 bg-background sm:pb-8 md:pb-10 lg:max-w-2xl lg:w-full lg:pb-12 xl:pb-16">
              <main className="mt-0 mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                <div className="sm:text-center lg:text-left">
                  <h1 className="text-3xl tracking-tight font-extrabold text-foreground sm:text-3xl md:text-4xl lg:text-6xl">
                    <span className="block">Welcome to Prepzon</span>
                    <span className="block">-Your Gateway from</span>
                    <span className="block text-primary">Campus to Corporate</span>
                  </h1>
                  <p className="mt-2 text-xs text-muted-foreground sm:mt-3 sm:text-sm sm:max-w-xl sm:mx-auto md:mt-4 md:text-base lg:mx-0 lg:text-left">
                    <span className="font-semibold text-foreground">PrepZon</span> is a next-generation <span className="font-semibold text-foreground">EdTech platform</span> built to bridge the gap between <span className="font-semibold text-foreground">college learning and corporate readiness.</span>
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground sm:mt-3 sm:text-sm sm:max-w-xl sm:mx-auto md:mt-4 md:text-base lg:mx-0 lg:text-left">
                    We provide a complete suite of <span className="font-semibold text-foreground">Live Interactive Training, Recorded Sessions, and Real-Time Mock Tests covering both Top IT Company Placements and Competitive Exams.</span>
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground sm:mt-3 sm:text-sm sm:max-w-xl sm:mx-auto md:mt-4 md:text-base lg:mx-0 lg:text-left">
                    Our mock tests and live courses are designed to help students crack:
                  </p>
                  <ul className="mt-2 text-xs text-muted-foreground sm:text-sm lg:mx-0 space-y-1">
                    <li className="flex">
                      <span className="flex-shrink-0 mr-2">•</span>
                      <span><span className="font-semibold text-foreground">Top IT Company recruitment exams</span> - TCS, Infosys, Wipro, Accenture, Capgemini, Cognizant, and more.</span>
                    </li>
                    <li className="flex">
                      <span className="flex-shrink-0 mr-2">•</span>
                      <span><span className="font-semibold text-foreground">Government Job exams</span> - SBI PO, IBPS PO, RRB, SSC, and others.</span>
                    </li>
                    <li className="flex">
                      <span className="flex-shrink-0 mr-2">•</span>
                      <span><span className="font-semibold text-foreground">Entrance exams for higher studies</span> - CAT, GATE, GRE, and similar aptitude-based tests.</span>
                    </li>
                  </ul>
                  <div className="mt-4 sm:mt-6 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                      <Link
                        to="/auth"
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 md:py-2 md:text-base md:px-6"
                      >
                        Get Started
                      </Link>
                    </div>
                    <div className="mt-2 sm:mt-0 sm:ml-2">
                      <button
                        onClick={handleViewTests}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 md:py-2 md:text-base md:px-6"
                      >
                        View Tests
                      </button>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
          <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
            <div className="h-48 w-full sm:h-56 md:h-72 lg:w-full lg:h-full flex items-center justify-center">
              <img 
                src="/img4.png" 
                alt="Learning Illustration" 
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Core Offerings Section - Reduced padding from py-20 to py-12 */}
      <section className="py-12 bg-gradient-to-br from-primary/5 via-white to-secondary/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              🚀 Our Core <span className="text-orange-500">Offerings</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-orange-500 mx-auto mt-6 rounded-full"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Live Interactive Classes */}
            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-primary/30 group hover:-translate-y-2">
              <div className="flex items-start mb-4">
                <div className="bg-gradient-to-br from-primary to-orange-500 text-orange-500 p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="font-bold text-4xl">1</div>
                </div>
                <h3 className="text-xl font-bold text-foreground mt-1">Live Interactive Classes</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Join our Campus2Corporate training program with daily Zoom sessions led by industry experts. Get practical knowledge, corporate exposure, and live doubt-solving sessions every day.
              </p>
            </div>
            
            {/* Recorded Sessions + Study Notes */}
            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-primary/30 group hover:-translate-y-2">
              <div className="flex items-start mb-4">
                <div className="bg-gradient-to-br from-primary to-orange-500 text-orange-500 p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="font-bold text-4xl">2</div>
                </div>
                <h3 className="text-xl font-bold text-foreground mt-1">Recorded Sessions + Study Notes</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Missed a class? No worries! Access all recorded sessions, notes, and study materials anytime — valid for 1 year after enrollment.
              </p>
            </div>
            
            {/* Mock Tests (Free & Paid) */}
            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-primary/30 group hover:-translate-y-2">
              <div className="flex items-start mb-4">
                <div className="bg-gradient-to-br from-primary to-orange-500 text-orange-500 p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="font-bold text-4xl">3</div>
                </div>
                <h3 className="text-xl font-bold text-foreground mt-1">Mock Tests (Free & Paid)</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Test your skills with real-exam-style mock tests for TCS, Infosys, Wipro, Accenture, Capgemini, Cognizant, and more. Get instant results with answers and detailed explanations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Prepzon Section - Reduced padding from py-20 to py-12 */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              🎓Why Choose <span className="text-orange-500">PrepZon</span>
            </h2>
            
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-orange-500 mx-auto mt-6 rounded-full"></div>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { text: "One course to crack multiple MNC exams", icon: "🎯" },
                { text: "Access course material for 1 full year", icon: "📅" },
                { text: "Free & paid mock tests for self-evaluation", icon: "📝" },
                { text: "Resume preparation & interview guidance after course completion", icon: "📄" },
                { text: "Open discussion forum to clarify doubts and connect with trainers", icon: "💬" },
                { text: "Daily notifications for class reminders, new courses, and updates", icon: "🔔" },
                { text: "24/7 support for students via chat, WhatsApp, or email", icon: "🎧" },
                { text: "Flexible learning options – Live or Recorded classes", icon: "📺" },
                { text: "End-to-end placement support and job readiness guidance", icon: "💼" }
              ].map((item, index) => (
                <div key={index} className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 p-5 hover:border-primary/30 hover:-translate-y-2">
                  <div className="absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <div className="pt-5">
                    <p className="text-base text-foreground font-medium leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link 
              to="/auth"
              className="inline-block bg-gradient-to-r from-primary to-orange-500 text-blue-900 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-lg"
            >
              Start Your Journey Today
            </Link>
          </div>
        </div>
      </section>

      {/* Courses Section - Reduced padding from py-20 to py-12 */}
      <section id="courses" className="py-12 bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-6">
              Popular Courses
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Explore Our <span className="text-orange-500">Courses</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose from our wide range of courses taught by industry experts
            </p>
          </div>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((index) => (
                <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-300"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
                    <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-full mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2 mb-6"></div>
                    <div className="h-10 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="relative"
              onMouseEnter={handleCourseMouseEnter}
              onMouseLeave={handleCourseMouseLeave}
            >
              {/* Carousel Navigation Buttons - Now visible on mobile */}
              {courses.length > 1 && (
                <>
                  <button 
                    onClick={prevCourses}
                    className="absolute left-4 md:left-0 top-1/2 -translate-y-1/2 z-50 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button 
                    onClick={nextCourses}
                    className="absolute right-4 md:right-0 top-1/2 -translate-y-1/2 z-50 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </>
              )}
              
              {/* Carousel Container */}
              <div className="overflow-hidden py-2">
                <div 
                  ref={courseCarouselRef}
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentCourseIndex * (windowWidth < 768 ? 100 : 33.333)}%)` }}
                >
                  {courses.map((course) => (
                    <div 
                      key={course.id} 
                      className="flex-shrink-0 w-full md:w-1/3 px-2"
                    >
                      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group h-full">
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
                        
                        <div className="p-4 md:p-6">
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
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{course.duration}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{course.students.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                              <span className="text-2xl font-bold text-foreground">₹{course.price}</span>
                            </div>
                            <button 
                              onClick={() => handleEnrollClick(course.id)}
                              className="w-full sm:w-auto bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                              Enroll Now
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Carousel Indicators - Visible on mobile */}
              {courses.length > 1 && (
                <div className="flex justify-center mt-6 space-x-2 pb-4">
                  {Array(Math.ceil(courses.length / (windowWidth < 768 ? 1 : 3))).fill(0).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentCourseIndex(index * (windowWidth < 768 ? 1 : 3))}
                      className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                        Math.floor(currentCourseIndex / (windowWidth < 768 ? 1 : 3)) === index 
                          ? 'bg-primary w-4 md:w-6' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link to="/student/courses" className="bg-secondary text-white px-6 py-3 rounded-lg hover:bg-secondary/80 transition-colors duration-200 font-medium inline-block">
              View All Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Instructors Section with Carousel - Reduced padding from py-20 to py-12 */}
      <section id="instructors" className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-6">
              Expert Instructors
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Learn From <span className="text-orange-500">Industry Experts</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our instructors are professionals with years of experience in their respective fields
            </p>
          </div>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                  <div className="h-24 w-24 rounded-full bg-gray-300 mx-auto mb-4"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-2/3 mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="relative"
              onMouseEnter={handleInstructorMouseEnter}
              onMouseLeave={handleInstructorMouseLeave}
            >
              {/* Carousel Navigation Buttons - Now visible on mobile */}
              {instructors.length > 2 && (
                <>
                  <button 
                    onClick={prevInstructors}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button 
                    onClick={nextInstructors}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </>
              )}
              
              {/* Carousel Container */}
              <div className="overflow-hidden py-2">
                <div 
                  ref={carouselRef}
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentInstructorIndex * (windowWidth < 640 ? 100 : windowWidth < 768 ? 50 : 25)}%)` }}
                >
                  {instructors.map((instructor, index) => (
                    <div 
                      key={index} 
                      className="flex-shrink-0 w-full sm:w-1/2 md:w-1/4 px-2"
                    >
                      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-4 md:p-6 text-center group h-full">
                        <div className="relative mb-4 mx-auto w-20 h-20 md:w-24 md:h-24">
                          <img 
                            src={instructor.photoUrl} 
                            alt={instructor.name}
                            className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://ui-avatars.com/api/?background=random&color=fff&bold=true&name=" + encodeURIComponent(instructor.name);
                            }}
                          />
                          <div className="absolute bottom-0 right-0 bg-orange-500 text-white rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                          </div>
                        </div>
                        
                        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1">{instructor.name}</h3>
                        <p className="text-primary font-medium text-xs md:text-sm mb-2 md:mb-3">{instructor.expertise}</p>
                        {instructor.experience && (
                          <p className="text-muted-foreground text-xs mb-2">{instructor.experience}</p>
                        )}
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{instructor.bio}</p>
                        
                        <div className="flex items-center justify-center text-xs md:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3 md:w-4 md:h-4" />
                            <span>{instructor.courses} courses</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Carousel Indicators - Visible on mobile */}
              {instructors.length > 1 && (
                <div className="flex justify-center mt-6 space-x-2 pb-4">
                  {Array(Math.ceil(instructors.length / (windowWidth < 640 ? 1 : windowWidth < 768 ? 2 : 4))).fill(0).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentInstructorIndex(index * (windowWidth < 640 ? 1 : windowWidth < 768 ? 2 : 4))}
                      className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                        Math.floor(currentInstructorIndex / (windowWidth < 640 ? 1 : windowWidth < 768 ? 2 : 4)) === index 
                          ? 'bg-primary w-4 md:w-6' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      

      {/* Alumni Section - Only show if there are alumni - Reduced padding from py-20 to py-12 */}
      {alumni.length > 0 && (
        <section id="testimonials" className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-6">
                Success Stories
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Our <span className="text-orange-500">Alumni Says</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Hear from our students who have transformed their careers with our courses
              </p>
            </div>
            
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-primary/10 overflow-hidden animate-pulse">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-2/3 mb-6"></div>
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-gray-300 mr-4"></div>
                      <div>
                        <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                className="relative"
                onMouseEnter={handleAlumniMouseEnter}
                onMouseLeave={handleAlumniMouseLeave}
              >
                {/* Carousel Navigation Buttons - Now visible on mobile */}
                {alumni.length > 1 && (
                  <>
                    <button 
                      onClick={prevAlumni}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button 
                      onClick={nextAlumni}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                  </>
                )}
                
                {/* Carousel Container */}
                <div className="overflow-hidden py-2">
                  <div 
                    ref={alumniCarouselRef}
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentAlumniIndex * (windowWidth < 768 ? 100 : 33.333)}%)` }}
                  >
                    {alumni.map((alumnus, index) => (
                      <div 
                        key={index} 
                        className="flex-shrink-0 w-full md:w-1/3 px-2"
                      >
                        <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200 overflow-hidden h-full shadow-sm hover:shadow-md transition-all duration-300 group hover:bg-orange-50">
                          <div className="flex items-center gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 md:w-5 md:h-5 ${i < alumnus.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 group-hover:text-orange-400 transition-colors duration-200'}`} 
                              />
                            ))}
                          </div>
                          
                          <p className="text-muted-foreground mb-4 md:mb-6 italic text-sm md:text-base group-hover:text-foreground transition-colors duration-200">"{alumnus.testimonial}"</p>
                          
                          <div className="flex items-center">
                            <img 
                              src={alumnus.photoUrl} 
                              alt={alumnus.name}
                              className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover mr-3 md:mr-4"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://ui-avatars.com/api/?background=random&color=fff&bold=true&name=" + encodeURIComponent(alumnus.name);
                              }}
                            />
                            <div>
                              <h4 className="font-semibold text-foreground text-sm md:text-base group-hover:text-orange-600 transition-colors duration-200">{alumnus.name}</h4>
                              <p className="text-xs md:text-sm text-muted-foreground group-hover:text-blue-600 transition-colors duration-200">{alumnus.position} at {alumnus.company}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Carousel Indicators - Visible on mobile */}
                {alumni.length > 1 && (
                  <div className="flex justify-center mt-6 space-x-2 pb-4">
                    {Array(Math.ceil(alumni.length / (windowWidth < 768 ? 1 : 3))).fill(0).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentAlumniIndex(index * (windowWidth < 768 ? 1 : 3))}
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                          Math.floor(currentAlumniIndex / (windowWidth < 768 ? 1 : 3)) === index 
                            ? 'bg-primary w-4 md:w-6' 
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* FAQ Section - Reduced padding from py-20 to py-12 */}
      <section id="faq" className="py-12 bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-6">
              FAQ
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Frequently Asked <span className="text-orange-500">Questions</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about our courses and platform
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <button 
                    className="flex justify-between items-center w-full p-6 text-left"
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  >
                    <span className="font-semibold text-foreground">{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-200 ${openFaqIndex === index ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`px-6 transition-all duration-300 ease-in-out ${openFaqIndex === index ? 'pb-6 max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <p className="text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;