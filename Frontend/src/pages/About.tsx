import { CheckCircle2 } from "lucide-react";

const About = () => {
  const features = [
    "Industry-leading curriculum designed by experts",
    "Hands-on projects and real-world applications",
    "24/7 access to learning resources",
    "Community support and networking opportunities",
    "Career guidance and job placement assistance",
    "Regular updates to keep content current",
  ];

  return (
    <div className="min-h-screen">      
      <section className="py-16 md:py-24 bg-gradient-to-br from-background to-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-center">
              About <span className="text-primary">EduLearn</span>
            </h1>
            <p className="text-lg text-muted-foreground text-center mb-12">
              Empowering learners worldwide through innovative online education
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Who We Are
              </h2>
              <p className="text-muted-foreground mb-4">
                EduLearn is a leading online learning platform dedicated to making quality education 
                accessible to everyone, everywhere. Founded by educators and technology enthusiasts, 
                we believe that learning should be engaging, flexible, and effective.
              </p>
              <p className="text-muted-foreground mb-4">
                Our mission is to bridge the gap between traditional education and the rapidly evolving 
                demands of the modern workforce. We partner with industry experts and thought leaders 
                to create courses that are not only informative but also practical and immediately applicable.
              </p>
              <p className="text-muted-foreground">
                With over 10,000 active students and 500+ expert instructors, we've built a thriving 
                community of learners committed to continuous growth and development.
              </p>
            </div>
            <div className="bg-primary/10 rounded-2xl p-8 animate-fade-in-up">
              <h3 className="text-2xl font-bold text-foreground mb-6">Why Choose Us</h3>
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="text-primary w-6 h-6 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Our Vision
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              We envision a world where quality education is not limited by geography, financial 
              constraints, or time. Through technology and innovation, we're making this vision 
              a reality—one student at a time.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="bg-card p-6 rounded-xl shadow-sm">
                <p className="text-4xl font-bold text-primary mb-2">10K+</p>
                <p className="text-muted-foreground">Active Learners</p>
              </div>
              <div className="bg-card p-6 rounded-xl shadow-sm">
                <p className="text-4xl font-bold text-primary mb-2">1000+</p>
                <p className="text-muted-foreground">Courses Available</p>
              </div>
              <div className="bg-card p-6 rounded-xl shadow-sm">
                <p className="text-4xl font-bold text-primary mb-2">95%</p>
                <p className="text-muted-foreground">Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
