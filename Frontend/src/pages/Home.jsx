import { Link } from 'react-router-dom';
import { Play, BookOpen, Users, Award, TrendingUp, Clock } from 'lucide-react';

const Home = () => {
  const companies = [
    { name: 'TCS', logo: 'https://images.pexels.com/photos/270408/pexels-photo-270408.jpeg?auto=compress&cs=tinysrgb&w=100' },
    { name: 'Infosys', logo: 'https://images.pexels.com/photos/270408/pexels-photo-270408.jpeg?auto=compress&cs=tinysrgb&w=100' },
    { name: 'Wipro', logo: 'https://images.pexels.com/photos/270408/pexels-photo-270408.jpeg?auto=compress&cs=tinysrgb&w=100' },
    { name: 'Accenture', logo: 'https://images.pexels.com/photos/270408/pexels-photo-270408.jpeg?auto=compress&cs=tinysrgb&w=100' },
    { name: 'Capgemini', logo: 'https://images.pexels.com/photos/270408/pexels-photo-270408.jpeg?auto=compress&cs=tinysrgb&w=100' },
    { name: 'Cognizant', logo: 'https://images.pexels.com/photos/270408/pexels-photo-270408.jpeg?auto=compress&cs=tinysrgb&w=100' }
  ];

  const features = [
    {
      icon: Clock,
      title: 'Real-time Timer',
      description: 'Experience actual exam conditions with synchronized timers'
    },
    {
      icon: BookOpen,
      title: 'Company-specific Tests',
      description: 'Practice with actual patterns from top IT companies'
    },
    {
      icon: TrendingUp,
      title: 'Performance Analytics',
      description: 'Track your progress with detailed performance reports'
    },
    {
      icon: Award,
      title: 'Leaderboards',
      description: 'Compete with peers and see your ranking'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                Crack Your Dream Job with 
                <span className="text-yellow-300"> Mock Tests</span>
              </h1>
              <p className="text-xl mb-8 text-primary-100">
                Practice with real exam patterns from top companies. Get detailed analytics 
                and improve your performance with every test.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/mock-tests" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Take Free Mock Test
                </Link>
                <Link to="/auth" className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors">
                  Sign Up Free
                </Link>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/5212324/pexels-photo-5212324.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Students taking mock tests"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Companies Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Practice Tests from Top Companies
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get access to mock tests designed based on actual recruitment patterns 
              from leading IT companies
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {companies.map((company, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="bg-gray-50 rounded-lg p-6 text-center hover:shadow-lg transition-all duration-300 group-hover:bg-primary-50">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-3"></div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">
                    {company.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose MockTest Pro?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform provides everything you need to succeed in your technical interviews
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
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

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Preparation?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of students who have successfully cleared interviews with our help
          </p>
          <Link 
            to="/auth" 
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            <Play className="w-5 h-5 mr-2" />
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;