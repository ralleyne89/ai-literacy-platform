import React from 'react'

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-700 mb-4">
            LitmusAI stores account profile data, assessment outcomes, and learning progress to deliver
            personalized recommendations and track certification eligibility.
          </p>
          <p className="text-gray-700 mb-4">
            Billing data is processed through Stripe. LitmusAI does not store full card details on this platform.
          </p>
          <p className="text-gray-700">
            To request data access or deletion, contact support at support@ailiteracy.com.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPage
