import CourseCard from "./CourseCard";


const FeaturedCourses = () => {
  const courses = [
    {
      title: "Complete Web Development Bootcamp",
      description: "Master modern web development with HTML, CSS, JavaScript, React, Node.js and more.",
      image: "../assets/course-webdev.jpg",
      price: "99",
      rating: 4.8,
      students: "12.5K",
      duration: "40 hours",
      level: "Beginner",
    },
    {
      title: "UI/UX Design Masterclass",
      description: "Learn user interface and experience design from industry experts with real projects.",
      image: "../assets/course-uxui.jpg",
      price: "89",
      rating: 4.9,
      students: "8.2K",
      duration: "32 hours",
      level: "Intermediate",
    },
    {
      title: "Digital Marketing Complete Course",
      description: "Comprehensive digital marketing training covering SEO, social media, and analytics.",
      image: "../assets/course-digitalmarketing.jpg",
      price: "79",
      rating: 4.7,
      students: "15.3K",
      duration: "28 hours",
      level: "Beginner",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Most Popular Courses
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our top-rated courses designed to help you achieve your learning goals
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <CourseCard {...course} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourses;
