import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Calendar } from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('overall');
  const [timeframe, setTimeframe] = useState('all-time');
  const [userRank, setUserRank] = useState(null);
  const { showError } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, [filter, timeframe]);

  const fetchLeaderboard = async () => {
    try {
      // Mock API call - replace with actual endpoint
      const mockData = [
        {
          rank: 1,
          studentId: '1',
          name: 'Rahul Sharma',
          avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100',
          totalScore: 2850,
          testsCompleted: 15,
          averageScore: 92.5,
          badges: ['Top Performer', 'Speed Master'],
          lastActive: '2024-01-15'
        },
        {
          rank: 2,
          studentId: '2',
          name: 'Priya Patel',
          avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
          totalScore: 2720,
          testsCompleted: 14,
          averageScore: 89.8,
          badges: ['Consistent Performer'],
          lastActive: '2024-01-14'
        },
        {
          rank: 3,
          studentId: '3',
          name: 'Amit Kumar',
          avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=100',
          totalScore: 2650,
          testsCompleted: 13,
          averageScore: 88.2,
          badges: ['Rising Star'],
          lastActive: '2024-01-13'
        },
        // Add more mock data...
        ...Array.from({ length: 20 }, (_, i) => ({
          rank: i + 4,
          studentId: `${i + 4}`,
          name: `Student ${i + 4}`,
          avatar: `https://images.pexels.com/photos/${2000000 + i}/pexels-photo-${2000000 + i}.jpeg?auto=compress&cs=tinysrgb&w=100`,
          totalScore: 2500 - (i * 50),
          testsCompleted: 12 - i,
          averageScore: 85 - (i * 2),
          badges: i % 3 === 0 ? ['Achiever'] : [],
          lastActive: `2024-01-${13 - i}`
        }))
      ];

      setLeaderboardData(mockData);
      
      // Find current user's rank
      const currentUserRank = mockData.find(item => item.studentId === user?.id);
      if (currentUserRank) {
        setUserRank(currentUserRank);
      } else {
        // If user not in top list, simulate their rank
        setUserRank({
          rank: 156,
          name: user?.name || 'You',
          totalScore: 1850,
          testsCompleted: 8,
          averageScore: 76.5,
          badges: ['Newcomer']
        });
      }
    } catch (error) {
      showError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
  };

  const getBadgeColor = (badge) => {
    const colors = {
      'Top Performer': 'bg-yellow-100 text-yellow-800',
      'Speed Master': 'bg-blue-100 text-blue-800',
      'Consistent Performer': 'bg-green-100 text-green-800',
      'Rising Star': 'bg-purple-100 text-purple-800',
      'Achiever': 'bg-indigo-100 text-indigo-800',
      'Newcomer': 'bg-gray-100 text-gray-800'
    };
    return colors[badge] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-600">See how you rank against other students</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-field"
              >
                <option value="overall">Overall Performance</option>
                <option value="company">Company-wise</option>
                <option value="speed">Speed Tests</option>
                <option value="accuracy">Accuracy</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="input-field"
              >
                <option value="all-time">All Time</option>
                <option value="this-month">This Month</option>
                <option value="this-week">This Week</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Your Rank Card */}
      {userRank && (
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full">
                {getRankIcon(userRank.rank)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Rank</h3>
                <p className="text-sm text-gray-600">Keep practicing to climb higher!</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600">#{userRank.rank}</div>
              <div className="text-sm text-gray-600">{userRank.totalScore} points</div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{userRank.testsCompleted}</div>
              <div className="text-sm text-gray-600">Tests</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{userRank.averageScore}%</div>
              <div className="text-sm text-gray-600">Avg Score</div>
            </div>
            <div className="text-center">
              <div className="flex flex-wrap justify-center gap-1">
                {userRank.badges.map((badge, index) => (
                  <span key={index} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(badge)}`}>
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performers</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {leaderboardData.slice(0, 3).map((student, index) => (
            <div key={student.studentId} className={`text-center p-6 rounded-lg ${
              index === 0 ? 'bg-gradient-to-b from-yellow-50 to-yellow-100 border-2 border-yellow-200' :
              index === 1 ? 'bg-gradient-to-b from-gray-50 to-gray-100 border-2 border-gray-200' :
              'bg-gradient-to-b from-amber-50 to-amber-100 border-2 border-amber-200'
            }`}>
              <div className="relative mb-4">
                <img 
                  src={student.avatar} 
                  alt={student.name}
                  className="w-20 h-20 rounded-full mx-auto object-cover"
                />
                <div className="absolute -top-2 -right-2">
                  {getRankIcon(student.rank)}
                </div>
              </div>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{student.name}</h4>
              <div className="text-2xl font-bold text-primary-600 mb-2">{student.totalScore}</div>
              <div className="text-sm text-gray-600 mb-3">points</div>
              
              <div className="flex justify-center space-x-4 text-sm text-gray-600 mb-3">
                <div>
                  <div className="font-medium">{student.testsCompleted}</div>
                  <div>Tests</div>
                </div>
                <div>
                  <div className="font-medium">{student.averageScore}%</div>
                  <div>Avg</div>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-1">
                {student.badges.map((badge, badgeIndex) => (
                  <span key={badgeIndex} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(badge)}`}>
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Full Rankings</h3>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-1" />
            {leaderboardData.length} students
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Badges
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboardData.map((student) => (
                <tr key={student.studentId} className={student.studentId === user?.id ? 'bg-primary-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRankIcon(student.rank)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img 
                        src={student.avatar} 
                        alt={student.name}
                        className="w-10 h-10 rounded-full mr-3 object-cover"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                          {student.studentId === user?.id && (
                            <span className="ml-2 text-xs text-primary-600 font-medium">(You)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.totalScore}</div>
                    <div className="text-sm text-gray-500">points</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.testsCompleted}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.averageScore}%</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {student.badges.map((badge, index) => (
                        <span key={index} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(badge)}`}>
                          {badge}
                        </span>
                      ))}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(student.lastActive).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Achievement Badges Info */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievement Badges</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Top Performer', description: 'Rank in top 10 overall', color: 'yellow' },
            { name: 'Speed Master', description: 'Complete tests 20% faster than average', color: 'blue' },
            { name: 'Consistent Performer', description: 'Maintain 85%+ average for 10 tests', color: 'green' },
            { name: 'Rising Star', description: 'Improve rank by 50+ positions', color: 'purple' },
            { name: 'Achiever', description: 'Complete 20+ tests', color: 'indigo' },
            { name: 'Newcomer', description: 'Welcome to MockTest Pro!', color: 'gray' }
          ].map((badge, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(badge.name)}`}>
                {badge.name}
              </span>
              <div className="text-sm text-gray-600">{badge.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;