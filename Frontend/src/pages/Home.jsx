import { Link } from 'react-router-dom';
import { Play, BookOpen, Users, Award, TrendingUp, Clock } from 'lucide-react';
import Index from './index';
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
    <div>
      <Index />
    </div>
  );
};

export default Home;