import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Users, Award, Clock, ChevronDown, Star, ArrowRight, Play, CheckCircle, TrendingUp, ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import MockTest3DCarousel from '../components/MockTest3DCarousel';

const ImageSlider = () => {
  const images = [
    { src: "student.png", alt: "Students taking online mock tests on PrepZon platform" }
  ];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3000); // changes every 3 seconds
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 lg:top-[-100px]">
      <div className="h-64 w-full sm:h-72 md:h-80 lg:w-full lg:h-full relative overflow-hidden flex items-center justify-center rounded-2xl shadow-xl">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 flex items-center justify-center ${index === current ? "opacity-100" : "opacity-0"
              }`}
          >
            <div className="flex items-center justify-center h-full w-full">
              <img
                src={image.src}
                alt={image.alt}
                className="max-h-full max-w-full object-contain rounded-2xl"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


const Home = () => {
  const [scrolled, setScrolled] = useState(false);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [alumni, setAlumni] = useState([]);
  const [mockTests, setMockTests] = useState([]); // Add this
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
            image: "/prepzon-course-thumbnail.png", // Use the same image for all courses
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

    const fetchInstructors = async () => {
      try {
        const response = await api.get('/admin/instructors');
        if (response.data.success) {
          // If no instructors, use mock data. If there are, map them.
          // For now, let's assume if the API returns success with empty array, we might want mock data or nothing.
          // Let's rely on what we get.
          if (response.data.data && response.data.data.length > 0) {
            setInstructors(response.data.data);
          } else {
            // Fallback to mock instructors if none found
            setInstructors([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch instructors:', error);
        // Fallback or leave empty
      }
    };

    // Add this
    const fetchMockTests = async () => {
      try {
        const res = await api.get("/companies");
        if (res.data.success) {
          setMockTests(res.data.data.companies || []);
        }
      } catch (error) {
        console.error("Error fetching mock tests:", error);
      }
    };

    fetchCourses();
    fetchInstructors();
    fetchMockTests();
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
      image: "/prepzon-course-thumbnail.png", // Use the same image for all courses
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
      image: "/prepzon-course-thumbnail.png", // Use the same image for all courses
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
      image: "/prepzon-course-thumbnail.png", // Use the same image for all courses
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
      image: "/prepzon-course-thumbnail.png", // Use the same image for all courses
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
      image: "/prepzon-course-thumbnail.png", // Use the same image for all courses
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
      image: "/prepzon-course-thumbnail.png", // Use the same image for all courses
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
      question: "How do I enroll for a mock test?",
      answer: "Simply sign up on PrepZon, choose the exam or company-specific mock test you want, and start practicing instantly. Free tests are available to try before upgrading to paid plans."
    },
    {
      question: "Do you provide free mock tests?",
      answer: "Yes. PrepZon offers free sample mock tests so students can experience the platform before purchasing full-length paid mock tests."
    },
    {
      question: "Can I attempt mock tests on mobile devices?",
      answer: "Absolutely. PrepZon is fully mobile-friendly. You can attempt mock tests on mobile, tablet, or desktop anytime, anywhere."
    },
    {
      question: "Will I get answers and explanations after the test?",
      answer: "Yes. Every mock test includes detailed solutions and explanations to help you understand concepts and improve accuracy."
    },
    {
      question: "How long will I have access to the mock tests?",
      answer: "Access duration depends on the test package you choose. Most paid mock tests come with extended access so you can attempt them multiple times."
    },
    {
      question: "Are the mock tests updated as per latest exam patterns?",
      answer: "Yes. Our mock tests are regularly updated based on the latest exam trends, syllabus changes, and difficulty levels."
    },
    {
      question: "Do you provide certificates or live training?",
      answer: "Currently, PrepZon focuses only on mock tests and practice assessments. We do not offer certificates, live classes, or recorded sessions at this stage."
    },
    {
      question: "Which exams does PrepZon support?",
      answer: "PrepZon currently provides mock tests for:\n• Engineering & medical entrance exams (JEE, NEET, etc.)\n• Management & higher studies exams (CAT, MAT, GATE, etc.)\n• Selected IT company placement tests (coming in phases)"
    },
    {
      question: "How can I contact support if I face issues?",
      answer: "You can reach our support team via chat, WhatsApp, or email. We’re here to help you with test access, results, or technical issues."
    },
    {
      question: "Is PrepZon suitable for beginners?",
      answer: "Yes. PrepZon is ideal for beginners as well as repeat aspirants who want structured practice and performance tracking through mock tests."
    },
    {
      question: "Can I upgrade from free tests to paid tests later?",
      answer: "Yes. You can start with free tests and upgrade to paid mock test packages anytime based on your preparation needs."
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
      <SEO
        title="PrepZon - Mock Tests, Courses & Exam Preparation Platform"
        description="Ace your exams with PrepZon! Access company-specific mock tests, online courses, live recordings, and leaderboards. Join thousands of students preparing for their dream jobs."
        keywords="mock tests online, exam preparation platform, company-specific tests, online learning courses, test practice platform, competitive exam prep, student dashboard, exam analytics, free mock tests, paid practice tests, career preparation, PrepZon platform"
        canonical="/"
        schema={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "PrepZon Home",
          "description": "Online mock test and course platform for students and professionals",
          "url": "https://www.prepzon.com/"
        }}
      />
      {/* Hero Section with new content and img4.png */}
      <section id="home">
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-4 bg-background sm:pb-8 md:pb-10 lg:max-w-2xl lg:w-full lg:pb-12 xl:pb-16">
              <main className="mt-0 mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                <div className="sm:text-center lg:text-left">
                  <h1 className="text-3xl tracking-tight font-extrabold text-foreground sm:text-3xl md:text-4xl lg:text-6xl">
                    <span className="block">Welcome to PrepZon</span>
                    <span className="block text-primary">– Your Gateway from Campus to Career</span>
                  </h1>
                  <p className="mt-1 text-xs text-muted-foreground sm:mt-2 sm:text-sm sm:max-w-xl sm:mx-auto md:mt-3 md:text-base lg:mx-0 lg:text-left">
                    <span className="font-semibold text-foreground">PrepZon</span> is a next-generation <span className="font-semibold text-foreground">EdTech platform</span> focused exclusively on exam-oriented mock tests, designed to help students practice effectively and perform confidently in real exams.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground sm:mt-2 sm:text-sm sm:max-w-xl sm:mx-auto md:mt-3 md:text-base lg:mx-0 lg:text-left">
                    Our mock tests are carefully designed to match actual exam patterns and help students crack:
                  </p>
                  <ul className="mt-1 text-sm text-muted-foreground sm:text-base lg:mx-0 space-y-0.5">
                    <li className="flex">
                      <span className="flex-shrink-0 mr-2">•</span>
                      <span><span className="font-semibold text-orange-500">College Entrance Exams</span> – AP EAPCET (Engineering, Agriculture & Pharmacy), JEE Main & Advanced, NEET UG & PG</span>
                    </li>
                    <li className="flex">
                      <span className="flex-shrink-0 mr-2">•</span>
                      <span><span className="font-semibold text-orange-500">Management & Higher Studies Exams</span> – CAT, MAT, GATE</span>
                    </li>
                    <li className="flex">
                      <span className="flex-shrink-0 mr-2">•</span>
                      <span><span className="font-semibold text-orange-500">Law Entrance Exams</span> – CLAT, AILET</span>
                    </li>
                  </ul>
                  <p className="mt-2 text-sm text-muted-foreground font-medium sm:text-base lg:mx-0">
                    Practice smarter with real-exam simulations, performance analysis, and detailed solutions-all in one place.
                  </p>
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
          <ImageSlider />
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
            {/* Real Exam–Style Mock Tests */}
            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-primary/30 group hover:-translate-y-2">
              <div className="flex items-start mb-4">
                <div className="bg-gradient-to-br from-primary to-orange-500 text-orange-500 p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="font-bold text-4xl">1</div>
                </div>
                <h3 className="text-xl font-bold text-foreground mt-1">Real Exam–Style Mock Tests</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Practice with high-quality mock tests designed to match the latest exam patterns. Our tests help you experience real exam pressure and improve speed, accuracy, and confidence.
              </p>
            </div>

            {/* Detailed Performance Analysis */}
            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-primary/30 group hover:-translate-y-2">
              <div className="flex items-start mb-4">
                <div className="bg-gradient-to-br from-primary to-orange-500 text-orange-500 p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="font-bold text-4xl">2</div>
                </div>
                <h3 className="text-xl font-bold text-foreground mt-1">Detailed Performance Analysis</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Get instant results with section-wise scores, accuracy reports, time analysis, and solutions. Understand your strengths, identify weak areas, and focus on smart improvement.
              </p>
            </div>

            {/* Free & Paid Test Series */}
            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-primary/30 group hover:-translate-y-2">
              <div className="flex items-start mb-4">
                <div className="bg-gradient-to-br from-primary to-orange-500 text-orange-500 p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="font-bold text-4xl">3</div>
                </div>
                <h3 className="text-xl font-bold text-foreground mt-1">Free & Paid Test Series</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Start with free sample tests and upgrade to full-length paid test series for deeper practice. Choose exam-specific mock tests and prepare at your own pace.
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
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Exam-Focused Mock Tests", text: "Practice with mock tests designed strictly as per real exam patterns, difficulty levels, and time limits.", icon: "✅" },
                { title: "Detailed Performance Insights", text: "Get instant scorecards with section-wise analysis, accuracy, time management insights, and correct answers with explanations.", icon: "📊" },
                { title: "Free & Paid Practice Tests", text: "Start with free sample tests and upgrade to full-length paid mock tests for deeper preparation and confidence building.", icon: "🆓" },
                { title: "Regularly Updated Test Content", text: "Our mock tests are continuously updated based on latest exam trends and question patterns.", icon: "🔄" },
                { title: "Anytime, Anywhere Access", text: "Attempt tests on mobile or desktop at your convenience — no fixed schedules, no restrictions.", icon: "🌐" },
                { title: "Student Support & Guidance", text: "Get prompt assistance for test access, results, and technical queries via chat, WhatsApp, or email.", icon: "💬" },
                { title: "Self-Evaluation & Improvement", text: "Track your progress over time, identify weak areas, and improve systematically with every test attempt.", icon: "🧠" },
                { title: "Built for Serious Aspirants", text: "PrepZon is designed for students who believe consistent practice is the key to success.", icon: "🎯" }
              ].map((item, index) => (
                <div key={index} className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 p-6 pt-10 hover:border-primary/30 hover:-translate-y-2">
                  <div className="absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">{item.text}</p>
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

      {/* Courses Section - Only show if there are courses - Reduced padding from py-20 to py-12 */}
      {courses.length > 0 && (
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

                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2" style={{ whiteSpace: 'pre-line', fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: course.description?.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-lg">$1</strong>') || '' }} />

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
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${Math.floor(currentCourseIndex / (windowWidth < 768 ? 1 : 3)) === index
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
      )}

      {/* Mock Tests 3D Carousel Section */}
      {mockTests.length > 0 && (
        <section>
          <MockTest3DCarousel items={mockTests} />
        </section>
      )}

      {/* Instructors Section with Carousel - Only show if there are instructors - Reduced padding from py-20 to py-12 */}
      {instructors.length > 0 && (
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
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${Math.floor(currentInstructorIndex / (windowWidth < 640 ? 1 : windowWidth < 768 ? 2 : 4)) === index
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
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${Math.floor(currentAlumniIndex / (windowWidth < 768 ? 1 : 3)) === index
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
                    <p className="text-muted-foreground whitespace-pre-line">
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