import React, { useState, useEffect } from 'react'
import { Award, CheckCircle, Clock, Star, Shield, ExternalLink, AlertCircle } from 'lucide-react'
import axios from 'axios'

const CertificationPage = () => {
  const [availableCerts, setAvailableCerts] = useState([])
  const [earnedCerts, setEarnedCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('available')

  useEffect(() => {
    fetchCertifications()
  }, [])

  const fetchCertifications = async () => {
    try {
      const [availableResponse, earnedResponse] = await Promise.all([
        axios.get('/api/certification/available'),
        axios.get('/api/certification/earned').catch(() => ({ data: { certifications: [] } }))
      ])

      setAvailableCerts(availableResponse.data.certifications)
      setEarnedCerts(earnedResponse.data.certifications)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch certifications:', error)
      setLoading(false)
      alert('Failed to load certifications. Please try again later.')
    }
  }



  const handleApply = async (certId) => {
    try {
      const response = await axios.post(`/api/certification/apply/${certId}`)
      alert(response.data.message)
      // Refresh certifications
      fetchCertifications()
    } catch (error) {
      console.error('Failed to apply for certification:', error)
      alert('Failed to apply for certification. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Award className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading certifications...</p>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Certifications</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Validate your AI skills with industry-recognized certifications.
            Advance your career with credentials that prove practical AI proficiency.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('available')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'available'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setActiveTab('earned')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'earned'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Certificates
            </button>
          </div>
        </div>

        {/* Available Certifications */}
        {activeTab === 'available' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {availableCerts.map(cert => (
              <div key={cert.id} className="card hover:shadow-lg transition-shadow duration-200">
                {/* Certificate Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Award className="w-6 h-6 text-primary-600" />
                    <span className="text-sm text-gray-600">Certificate</span>
                  </div>
                  {cert.is_premium && (
                    <div className="bg-gradient-secondary text-white px-2 py-1 rounded-full text-xs font-medium">
                      Premium
                    </div>
                  )}
                </div>

                {/* Certificate Title and Description */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{cert.title}</h3>
                <p className="text-gray-600 mb-4">{cert.description}</p>

                {/* Estimated Time */}
                <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Estimated time: {cert.estimated_time}</span>
                </div>

                {/* Requirements */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Requirements:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {cert.requirements.map((req, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Skills Validated */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Skills Validated:</h4>
                  <div className="flex flex-wrap gap-2">
                    {cert.skills_validated.slice(0, 3).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                    {cert.skills_validated.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{cert.skills_validated.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <button 
                  onClick={() => handleApply(cert.id)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    cert.is_premium 
                      ? 'bg-gradient-secondary text-white hover:shadow-lg transform hover:-translate-y-0.5'
                      : 'btn-primary'
                  }`}
                >
                  {cert.is_premium ? 'Apply for Certification' : 'Start Free Certification'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Earned Certifications */}
        {activeTab === 'earned' && (
          <div>
            {earnedCerts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {earnedCerts.map(cert => (
                  <div key={cert.id} className="card border-2 border-green-200 bg-green-50">
                    {/* Certificate Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-6 h-6 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Certified</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600">Issued</div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(cert.issued_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Certificate Title */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{cert.certification_type}</h3>

                    {/* Verification Code */}
                    <div className="bg-white rounded-lg p-3 mb-4">
                      <div className="text-xs text-gray-600 mb-1">Verification Code</div>
                      <div className="font-mono text-sm font-semibold text-gray-900">{cert.verification_code}</div>
                    </div>

                    {/* Skills Validated */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Skills Validated:</h4>
                      <div className="flex flex-wrap gap-2">
                        {cert.skills_validated.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm font-medium">
                        Download PDF
                      </button>
                      <button className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-200 text-sm font-medium flex items-center justify-center space-x-1">
                        <span>Share</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No certifications yet</h3>
                <p className="text-gray-600 mb-6">
                  Complete your AI assessment and training modules to earn your first certification.
                </p>
                <button 
                  onClick={() => setActiveTab('available')}
                  className="btn-primary"
                >
                  Browse Available Certifications
                </button>
              </div>
            )}
          </div>
        )}

        {/* Verification Section */}
        <div className="mt-16 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <Shield className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Verify a Certification</h2>
            <p className="text-gray-600 mb-6">
              Enter a verification code to confirm the authenticity of an AI literacy certification.
            </p>
            <div className="max-w-md mx-auto flex space-x-4">
              <input
                type="text"
                placeholder="Enter verification code"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
              <button className="btn-primary">
                Verify
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CertificationPage
