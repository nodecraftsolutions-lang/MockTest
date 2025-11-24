import { ArrowRight } from "lucide-react";


const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-background to-secondary/30 py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Up Your <span className="text-primary">Skills</span>
              <br />
              To Advance Your
              <br />
              <span className="text-primary">Career Path</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Discover a world of knowledge and opportunities. Learn from industry experts, 
              gain practical skills, and accelerate your professional growth with our 
              comprehensive online courses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button size="lg" className="group">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button size="lg" variant="outline">
                Browse Courses
              </button>
            </div>
            <div className="mt-8 flex items-center gap-8">
              <div>
                <p className="text-3xl font-bold text-foreground">10K+</p>
                <p className="text-sm text-muted-foreground">Active Students</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">500+</p>
                <p className="text-sm text-muted-foreground">Expert Instructors</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">1000+</p>
                <p className="text-sm text-muted-foreground">Online Courses</p>
              </div>
            </div>
          </div>
          <div className="animate-fade-in-up lg:animate-slide-in-right">
            <img 
              src={"/prepzon-feature-illustration.png"} 
              alt="PrepZon platform features - comprehensive learning tools and analytics illustration" 
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
