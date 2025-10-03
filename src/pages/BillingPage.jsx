import React from 'react'

const plans = [
  {
    name: 'Free',
    price: '0',
    description: 'Perfect for individuals exploring LitmusAI.',
    features: [
      'Access to assessments',
      'Foundational training modules',
      'Basic progress tracking'
    ],
    cta: 'You are on this plan'
  },
  {
    name: 'Premium',
    price: '49',
    description: 'Unlock premium training, certifications, and analytics.',
    features: [
      'All Free features',
      'Premium training catalog',
      'Certification exam access',
      'Email support'
    ],
    cta: 'Checkout coming soon'
  },
  {
    name: 'Enterprise',
    price: 'Contact',
    description: 'Tailored enablement for teams and departments.',
    features: [
      'Custom learning paths',
      'Dedicated customer success',
      'SSO & advanced reporting',
      'Licensing & partnerships'
    ],
    cta: 'Talk to sales'
  }
]

const BillingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose the plan that fits your team</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Stripe integration is on the way. In the meantime, explore what each plan includes—once your Stripe credentials are added the checkout button will activate automatically.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className="card flex flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">{plan.name}</h2>
                <p className="text-gray-600 mt-2">{plan.description}</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  {plan.price !== 'Contact' && <span className="text-gray-500"> / month</span>}
                </div>
              </div>

              <ul className="space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="inline-flex h-2 w-2 rounded-full bg-primary-500"></span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`mt-8 w-full rounded-lg px-4 py-3 text-sm font-semibold ${
                  plan.name === 'Free' ? 'bg-gray-200 text-gray-500 cursor-default' : 'bg-primary-600 text-white'
                }`}
                disabled={plan.name === 'Free'}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BillingPage
