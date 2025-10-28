import { Users, Target, Award, TrendingUp } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To democratize access to quality test preparation and help students achieve their career goals through comprehensive mock testing.'
    },
    {
      icon: Users,
      title: 'Expert Team',
      description: 'Our team consists of industry experts, educators, and technologists working together to create the best learning experience.'
    },
    {
      icon: Award,
      title: 'Proven Results',
      description: 'Over 50,000+ students have successfully cleared their interviews using our platform with an average improvement of 40%.'
    },
    {
      icon: TrendingUp,
      title: 'Continuous Growth',
      description: 'We continuously update our question banks and add new companies to ensure you stay ahead of the competition.'
    }
  ];

  const stats = [
    { number: '50,000+', label: 'Students Trained' },
    { number: '100+', label: 'Company Patterns' },
    { number: '10,000+', label: 'Questions Bank' },
    { number: '95%', label: 'Success Rate' }
  ];

  const timeline = [
    {
      year: '2020',
      title: 'Foundation',
      description: 'PrepZon was founded with a vision to revolutionize online test preparation.'
    },
    {
      year: '2021',
      title: 'First 1000 Users',
      description: 'Reached our first milestone of 1000 active users with 5 company test patterns.'
    },
    {
      year: '2022',
      title: 'Major Expansion',
      description: 'Expanded to 50+ companies and introduced paid premium test series.'
    },
    {
      year: '2023',
      title: 'AI Integration',
      description: 'Launched AI-powered performance analytics and personalized recommendations.'
    },
    {
      year: '2024',
      title: 'Global Reach',
      description: 'Serving students worldwide with 100+ company patterns and real-time features.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              About PrepZon
            </h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              We're on a mission to help students crack their dream jobs through 
              comprehensive mock testing and real-time performance analytics.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We combine cutting-edge technology with educational expertise to deliver 
              the most effective test preparation platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-lg text-gray-600">
              From a simple idea to helping thousands of students achieve their dreams
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-4 md:left-1/2 transform md:-translate-x-px top-0 bottom-0 w-0.5 bg-primary-200"></div>
            
            {timeline.map((item, index) => (
              <div key={index} className="relative flex items-center mb-8">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center relative z-10">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                
                <div className={`ml-6 md:ml-0 ${index % 2 === 0 ? 'md:mr-8 md:text-right' : 'md:ml-8'} md:w-1/2`}>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-primary-600 font-bold text-lg mb-1">{item.year}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-lg text-gray-600">
              Passionate educators and technologists working to make test preparation accessible to all
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Rajesh Kumar', role: 'Founder & CEO', image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300' },
              { name: 'Priya Sharma', role: 'Head of Content', image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300' },
              { name: 'Amit Singh', role: 'Lead Developer', image: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=300' }
            ].map((member, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-primary-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Join Our Success Story
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Be part of the thousands of students who have achieved their career goals with PrepZon
          </p>
          <a 
            href="/auth" 
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
          >
            Start Your Journey Today
          </a>
        </div>
      </section>
    </div>
  );
};

export default About;