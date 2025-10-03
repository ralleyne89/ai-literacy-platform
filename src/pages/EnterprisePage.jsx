import React from 'react'
import { Building2, Users, Shield, Zap, CheckCircle, ArrowRight, Phone, Mail, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'

const EnterprisePage = () => {
  const features = [
    {
      icon: Building2,
      title: 'Organization-Wide AI Transformation',
      description: 'Comprehensive AI literacy programs designed to transform your entire organization from AI-curious to AI-proficient.',
      benefits: ['Custom learning paths', 'Department-specific training', 'Executive briefings']
    },
    {
      icon: Users,
      title: 'Embedded AI Leadership (fCAIO)',
      description: 'Get strategic AI leadership at a fraction of the cost of hiring a full-time Chief AI Officer.',
      benefits: ['Strategic AI guidance', 'Implementation oversight', 'ROI optimization']
    },
    {
      icon: Shield,
      title: 'Enterprise-Grade Security & Compliance',
      description: 'Built for enterprise with SOC 2 compliance, SSO integration, and comprehensive data protection.',
      benefits: ['SOC 2 Type II certified', 'SAML/SSO integration', 'Data residency options']
    },
    {
      icon: Zap,
      title: 'Rapid Implementation & Results',
      description: 'Most organizations see measurable AI adoption and productivity gains within weeks, not months.',
      benefits: ['2-week onboarding', 'Live implementation support', 'Measurable ROI tracking']
    }
  ]

  const plans = [
    {
      name: 'Professional',
      price: '$49',
      period: 'per user/month',
      description: 'Perfect for growing teams ready to implement AI across departments',
      features: [
        'All training modules and certifications',
        'Department-specific content',
        'Progress tracking and analytics',
        'Email support',
        'Basic integrations'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: 'per user/month',
      description: 'Comprehensive AI transformation for large organizations',
      features: [
        'Everything in Professional',
        'Embedded AI leadership (fCAIO)',
        'Custom content development',
        'Live training sessions',
        'Dedicated success manager',
        'Advanced analytics & reporting',
        'SSO and enterprise integrations',
        'Priority support'
      ],
      cta: 'Contact Sales',
      popular: true
    },
    {
      name: 'Custom',
      price: 'Contact us',
      period: 'for pricing',
      description: 'Tailored solutions for unique organizational needs',
      features: [
        'Everything in Enterprise',
        'Custom platform development',
        'White-label options',
        'On-premise deployment',
        'Custom compliance requirements',
        'Dedicated infrastructure'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ]

  const testimonials = [
    {
      quote: "The AI Literacy Platform transformed our organization in just 6 weeks. Our teams are now confidently using AI tools, and we've seen a 40% increase in productivity.",
      author: "Sarah Chen",
      title: "Chief Technology Officer",
      company: "TechCorp Industries"
    },
    {
      quote: "Having an embedded fCAIO was game-changing. We got enterprise-level AI strategy without the enterprise-level cost.",
      author: "Michael Rodriguez",
      title: "VP of Operations",
      company: "Global Manufacturing Co."
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-primary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Transform Your Organization with AI
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-4xl mx-auto">
              Comprehensive AI literacy programs that take your entire organization from AI-curious to AI-proficient in weeks, not months.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary-600 font-semibold py-4 px-8 rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                Schedule Demo
              </button>
              <Link to="/assessment" className="btn-ghost">
                Start Free Assessment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Enterprise AI Transformation
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything your organization needs to successfully adopt and implement AI across all departments and levels.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {features.map((feature, index) => (
              <div key={index} className="flex space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Enterprise Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Flexible plans designed to scale with your organization's AI transformation journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className={`card relative ${plan.popular ? 'border-2 border-primary-600' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  plan.popular 
                    ? 'btn-primary' 
                    : 'btn-outline'
                }`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Leading Organizations
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card">
                <blockquote className="text-lg text-gray-700 mb-6">
                  "{testimonial.quote}"
                </blockquote>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-gray-600">{testimonial.title}</div>
                  <div className="text-gray-500">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Organization?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Schedule a demo to see how the AI Literacy Platform can accelerate your organization's AI adoption.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center justify-center space-x-2">
              <Phone className="w-5 h-5" />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>enterprise@ailiteracy.com</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Schedule Demo</span>
            </div>
          </div>

          <button className="bg-white text-primary-600 font-semibold py-4 px-8 rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 inline-flex items-center space-x-2">
            <span>Get Started Today</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  )
}

export default EnterprisePage
