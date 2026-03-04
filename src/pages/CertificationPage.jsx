import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Award, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useLocation } from 'react-router-dom'

const isHtmlPayload = (payload) => {
  if (typeof payload === 'string') {
    const normalized = payload.trim().toLowerCase()
    return normalized.startsWith('<!doctype html') || normalized.startsWith('<html')
  }

  return false
}

const buildSyntheticHttpError = (response, message = 'Invalid API response') => {
  const error = new Error(message)
  error.response = response
  return error
}

const parseCertificationsPayload = (response) => {
  const data = response?.data
  if (isHtmlPayload(data) || !data || typeof data !== 'object') {
    throw buildSyntheticHttpError(response, 'Invalid API payload')
  }

  return Array.isArray(data.certifications) ? data.certifications : []
}

const getApiErrorMessage = (error, fallbackMessage) => {
  if (!error?.response) {
    return `${fallbackMessage} Please check your connection and try again.`
  }

  const data = error.response.data
  if (isHtmlPayload(data)) {
    return `${fallbackMessage} API endpoint returned HTML instead of JSON.`
  }

  return data?.message || data?.error || fallbackMessage
}

const CertificationPage = () => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [availableCerts, setAvailableCerts] = useState([])
  const [earnedCerts, setEarnedCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('available')
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [notice, setNotice] = useState('')
  const [applyingId, setApplyingId] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)

  const fetchCertifications = useCallback(async () => {
    setLoading(true)
    setError('')
    setWarning('')

    const requests = [axios.get('/api/certification/available')]
    if (isAuthenticated) {
      requests.push(axios.get('/api/certification/earned'))
    }

    const [availableResult, earnedResult] = await Promise.allSettled(requests)
    let availableLoaded = false

    if (availableResult.status === 'fulfilled') {
      try {
        const parsedAvailable = parseCertificationsPayload(availableResult.value)
        setAvailableCerts(parsedAvailable)
        availableLoaded = true
      } catch (parseError) {
        setAvailableCerts([])
        setError(getApiErrorMessage(parseError, 'Failed to load certification catalog.'))
      }
    } else {
      setAvailableCerts([])
      setError(getApiErrorMessage(availableResult.reason, 'Failed to load certification catalog.'))
    }

    if (isAuthenticated) {
      if (earnedResult?.status === 'fulfilled') {
        try {
          setEarnedCerts(parseCertificationsPayload(earnedResult.value))
        } catch (parseError) {
          setEarnedCerts([])
          if (availableLoaded) {
            setWarning(getApiErrorMessage(parseError, 'Unable to load your earned certifications right now.'))
          }
        }
      } else {
        setEarnedCerts([])
        if (availableLoaded) {
          setWarning(getApiErrorMessage(earnedResult?.reason, 'Unable to load your earned certifications right now.'))
        }
      }
    } else {
      setEarnedCerts([])
    }

    setLoading(false)
  }, [isAuthenticated])

  useEffect(() => {
    fetchCertifications()
  }, [fetchCertifications])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('verify')
    if (code) {
      setVerifyCode(code.toUpperCase())
    }
  }, [location.search])

  const handleApply = async (cert) => {
    if (!isAuthenticated) {
      setError('Sign in to apply for certifications.')
      return
    }

    setApplyingId(cert.id)
    setError('')
    setWarning('')
    setNotice('')

    try {
      const response = await axios.post(`/api/certification/apply/${cert.id}`)
      if (response?.data?.status === 'already_issued') {
        setNotice('You already hold this certification.')
      } else {
        setNotice('Certification granted successfully.')
      }
      await fetchCertifications()
      setActiveTab('earned')
    } catch (applyError) {
      setError(getApiErrorMessage(applyError, 'Failed to apply for certification.'))
    } finally {
      setApplyingId('')
    }
  }

  const handleVerify = async () => {
    const trimmed = verifyCode.trim().toUpperCase()
    if (!trimmed) {
      setError('Enter a verification code to continue.')
      return
    }

    setVerifyLoading(true)
    setError('')
    setVerifyResult(null)

    try {
      const { data } = await axios.get(`/api/certification/verify/${encodeURIComponent(trimmed)}`)
      if (isHtmlPayload(data)) {
        throw new Error('Certification verify endpoint returned HTML.')
      }

      setVerifyResult(data)
      if (data?.valid) {
        setNotice('Certification verified successfully.')
      } else {
        setError('Certification not found or invalid.')
      }
    } catch (verifyError) {
      const responseData = verifyError?.response?.data
      if (verifyError?.response?.status === 404) {
        setVerifyResult(responseData)
        setError(responseData?.message || 'Certification not found or invalid.')
      } else {
        setError(getApiErrorMessage(verifyError, 'Unable to verify certification right now.'))
      }
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleDownloadCertificate = (cert) => {
    const lines = [
      'LitmusAI Certification',
      `Certificate: ${cert.certification_type}`,
      `Verification Code: ${cert.verification_code}`,
      `Issued At: ${cert.issued_at ? new Date(cert.issued_at).toLocaleString() : 'N/A'}`,
      `Expires At: ${cert.expires_at ? new Date(cert.expires_at).toLocaleString() : 'N/A'}`,
      '',
      'Skills Validated:',
      ...(Array.isArray(cert.skills_validated) ? cert.skills_validated.map(skill => `- ${skill}`) : [])
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${cert.certification_type.replace(/\s+/g, '-').toLowerCase()}-${cert.verification_code}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleShareCertificate = async (cert) => {
    const verifyUrl = `${window.location.origin}/certification?verify=${encodeURIComponent(cert.verification_code)}`
    const shareText = `Verify my LitmusAI certification (${cert.certification_type}) with code ${cert.verification_code}: ${verifyUrl}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cert.certification_type} Certificate`,
          text: shareText,
          url: verifyUrl
        })
        setNotice('Certificate link shared successfully.')
        return
      } catch {
        // Fall through to clipboard if user canceled or share failed.
      }
    }

    try {
      await navigator.clipboard.writeText(shareText)
      setNotice('Certificate verification link copied to clipboard.')
    } catch {
      setError('Unable to share this certificate automatically.')
    }
  }

  const verifyCard = useMemo(() => {
    if (!verifyResult) {
      return null
    }

    if (!verifyResult.valid) {
      return (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {verifyResult.message || 'Certification not found or invalid.'}
        </div>
      )
    }

    const cert = verifyResult.certification
    return (
      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 text-left">
        <p className="font-semibold">{cert.certification_type}</p>
        <p>Holder: {cert.holder_name}</p>
        <p>Issued: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'N/A'}</p>
        <p>Status: {cert.is_valid ? 'Valid' : 'Invalid'}</p>
      </div>
    )
  }, [verifyResult])

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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Certifications</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Validate your AI skills with industry-recognized certifications.
            Advance your career with credentials that prove practical AI proficiency.
          </p>
        </div>

        {notice && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {notice}
          </div>
        )}

        {warning && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {warning}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-3">
            <AlertCircle className="h-4 w-4" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={fetchCertifications}
              className="rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        )}

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

        {activeTab === 'available' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {availableCerts.map(cert => (
              <div key={cert.id} className="card hover:shadow-lg transition-shadow duration-200">
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

                <h3 className="text-xl font-semibold text-gray-900 mb-2">{cert.title}</h3>
                <p className="text-gray-600 mb-4">{cert.description}</p>

                <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Estimated time: {cert.estimated_time}</span>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Requirements:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {(cert.requirements || []).map((req, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Skills Validated:</h4>
                  <div className="flex flex-wrap gap-2">
                    {(cert.skills_validated || []).slice(0, 3).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                    {(cert.skills_validated || []).length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{cert.skills_validated.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {Array.isArray(cert.missing_requirements) && cert.missing_requirements.length > 0 && (
                  <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                    <p className="font-semibold mb-1">Not ready yet:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {cert.missing_requirements.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => handleApply(cert)}
                  disabled={!cert.eligible || applyingId === cert.id || !isAuthenticated}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    !cert.eligible || !isAuthenticated
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : cert.is_premium
                        ? 'bg-gradient-secondary text-white hover:shadow-lg transform hover:-translate-y-0.5'
                        : 'btn-primary'
                  }`}
                >
                  {applyingId === cert.id ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Applying...
                    </span>
                  ) : isAuthenticated ? (
                    cert.eligible
                      ? cert.is_premium
                        ? 'Apply for Certification'
                        : 'Start Free Certification'
                      : 'Requirements Not Met'
                  ) : (
                    'Sign in to apply'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'earned' && (
          <div>
            {earnedCerts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {earnedCerts.map(cert => (
                  <div key={cert.id} className="card border-2 border-green-200 bg-green-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Certified</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600">Issued</div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(cert.issued_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{cert.certification_type}</h3>

                    <div className="bg-white rounded-lg p-3 mb-4">
                      <div className="text-xs text-gray-600 mb-1">Verification Code</div>
                      <div className="font-mono text-sm font-semibold text-gray-900">{cert.verification_code}</div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Skills Validated:</h4>
                      <div className="flex flex-wrap gap-2">
                        {(cert.skills_validated || []).map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDownloadCertificate(cert)}
                        className="flex-1 bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleShareCertificate(cert)}
                        className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-200 text-sm font-medium"
                      >
                        Share
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

        <div className="mt-16 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <Award className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Verify a Certification</h2>
            <p className="text-gray-600 mb-6">
              Enter a verification code to confirm the authenticity of an AI literacy certification.
            </p>

            <div className="max-w-md mx-auto flex space-x-4">
              <input
                type="text"
                placeholder="Enter verification code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
              <button
                onClick={handleVerify}
                disabled={verifyLoading}
                className="btn-primary"
              >
                {verifyLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  'Verify'
                )}
              </button>
            </div>

            {verifyCard}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CertificationPage
