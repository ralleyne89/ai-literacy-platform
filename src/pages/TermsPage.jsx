import React from 'react'

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-700 mb-4">
            By using LitmusAI, you agree to use the platform responsibly, comply with applicable laws,
            and avoid misuse of assessments, training content, and certification systems.
          </p>
          <p className="text-gray-700 mb-4">
            Access to paid features depends on an active subscription. Subscription status, pricing, and
            renewal behavior are managed through the billing experience.
          </p>
          <p className="text-gray-700">
            For questions about these terms, contact support at support@ailiteracy.com.
          </p>
        </div>
      </div>
    </div>
  )
}

export default TermsPage
