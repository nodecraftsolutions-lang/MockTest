import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Alex Thompson",
      role: "Full Stack Developer",
      initials: "AT",
      content: "The courses here completely transformed my career. The instructors are knowledgeable and the content is always up-to-date with industry standards.",
      rating: 5,
    },
    {
      name: "Jessica Martinez",
      role: "UX Designer",
      initials: "JM",
      content: "I love the flexibility and quality of the courses. Being able to learn at my own pace while getting expert guidance has been invaluable.",
      rating: 5,
    },
    {
      name: "Ryan Park",
      role: "Digital Marketer",
      initials: "RP",
      content: "Best investment I've made in my professional development. The practical projects and real-world examples made all the difference.",
      rating: 5,
    },
  ];

  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-br from-secondary/20 via-secondary/30 to-secondary/20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-6">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            What Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">Students Say</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Hear from learners who have successfully advanced their careers
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 p-8 animate-fade-in-up relative overflow-hidden group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Quote mark decoration */}
              <div className="absolute top-4 right-4 text-6xl text-primary/5 font-serif group-hover:text-primary/10 transition-colors duration-300">
                "
              </div>
              
              {/* Rating stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              {/* Testimonial content */}
              <p className="text-muted-foreground mb-8 italic text-lg leading-relaxed">
                "{testimonial.content}"
              </p>
              
              {/* Author info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-lg">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Additional testimonial stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-foreground mb-2">98%</p>
            <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
          </div>
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-foreground mb-2">10K+</p>
            <p className="text-sm text-muted-foreground">Happy Students</p>
          </div>
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-foreground mb-2">4.9/5</p>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </div>
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-foreground mb-2">500+</p>
            <p className="text-sm text-muted-foreground">Success Stories</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;