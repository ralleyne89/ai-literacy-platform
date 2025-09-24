import React, { useState, useEffect } from 'react'
import { Play, Clock, Star, Users, CheckCircle, Lock } from 'lucide-react'
import axios from 'axios'

const TrainingPage = () => {
  const [modules, setModules] = useState([])
  const [selectedRole, setSelectedRole] = useState('All')
  const [loading, setLoading] = useState(true)

  const roles = ['All', 'Sales', 'HR', 'Marketing', 'Operations', 'General']

  useEffect(() => {
    fetchModules()
  }, [selectedRole])

  const fetchModules = async () => {
    try {
      const params = selectedRole !== 'All' ? { role: selectedRole } : {}
      const response = await axios.get('/api/training/modules', { params })
      setModules(response.data.modules)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch modules:', error)
      setLoading(false)
    }
  }

  const getDifficultyColor = (level) => {
    const colors = {
      1: 'text-green-600 bg-green-100',
      2: 'text-yellow-600 bg-yellow-100',
      3: 'text-orange-600 bg-orange-100',
      4: 'text-red-600 bg-red-100',
      5: 'text-purple-600 bg-purple-100'
    }
    return colors[level] || 'text-gray-600 bg-gray-100'
  }

  const getDifficultyText = (level) => {
    const texts = {
      1: 'Beginner',
      2: 'Intermediate',
      3: 'Advanced',
      4: 'Expert',
      5: 'Master'
    }
    return texts[level] || 'Unknown'
  }

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Play className="w-5 h-5" />
      case 'interactive':
        return <Users className="w-5 h-5" />
      case 'exercise':
        return <CheckCircle className="w-5 h-5" />
      default:
        return <Play className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Training Hub</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hands-on training modules designed for your role. Build practical AI skills 
            through interactive exercises and real-world applications.
          </p>
        </div>

        {/* Role Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {roles.map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedRole === role
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Training Modules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map(module => (
            <div key={module.id} className="card hover:shadow-lg transition-shadow duration-200">
              {/* Module Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="text-primary-600">
                    {getContentTypeIcon(module.content_type)}
                  </div>
                  <span className="text-sm text-gray-600 capitalize">{module.content_type}</span>
                </div>
                {module.is_premium && (
                  <div className="flex items-center space-x-1 text-yellow-600">
                    <Lock className="w-4 h-4" />
                    <span className="text-xs font-medium">Premium</span>
                  </div>
                )}
              </div>

              {/* Module Title and Description */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{module.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-3">{module.description}</p>

              {/* Module Meta */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{module.estimated_duration_minutes} min</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty_level)}`}>
                    {getDifficultyText(module.difficulty_level)}
                  </div>
                </div>
              </div>

              {/* Role Badge */}
              {module.role_specific && (
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-secondary-100 text-secondary-700 text-sm font-medium rounded-full">
                    {module.role_specific}
                  </span>
                </div>
              )}

              {/* Learning Objectives */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">You'll Learn:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {module.learning_objectives.slice(0, 3).map((objective, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button 
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  module.is_premium 
                    ? 'bg-gradient-secondary text-white hover:shadow-lg transform hover:-translate-y-0.5'
                    : 'btn-primary'
                }`}
              >
                {module.is_premium ? 'Upgrade to Access' : 'Start Module'}
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {modules.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No modules found</h3>
            <p className="text-gray-600">Try selecting a different role or check back later for new content.</p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-primary text-white rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Accelerate Your Learning?</h2>
          <p className="text-lg opacity-90 mb-6">
            Upgrade to Professional for access to all premium modules, live sessions, and certification tracks.
          </p>
          <button className="bg-white text-primary-600 font-semibold py-3 px-8 rounded-lg hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default TrainingPage
