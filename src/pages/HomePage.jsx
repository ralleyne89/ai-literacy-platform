import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Brain, 
  Target, 
  Zap, 
  Award, 
  Users, 
  TrendingUp, 
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react'

const HomePage = () => {
  const features = [
    {
      icon: Target,
      title: 'Assess AI Readiness',
      description: 'Comprehensive 15-question assessment across Functional, Ethical, Rhetorical, and Pedagogical AI literacy domains.',
      color: 'text-primary-600'
    },
    {
      icon: Zap,
      title: 'Activate Through Training',
      description: 'Role-specific training modules for Sales, HR, Marketing, and Operations with hands-on tool building.',
      color: 'text-secondary-600'
    },
    {
      icon: Award,
      title: 'Certify AI Proficiency',
      description: 'Industry-recognized credentials that validate practical AI skills for career advancement.',
      color: 'text-accent-orange'
    }
  ]

  const benefits = [
    'Transform skills within weeks, not months',
    'Practical, workplace-ready AI applications',
    'Role-specific learning paths',
    'Industry-recognized certifications',
    'Live interactive training sessions',
    'Immediate skill assessment and feedback'
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Marketing Director',
      company: 'TechCorp',
      content: 'The AI literacy assessment helped me identify exactly where to focus my learning. Within 3 weeks, I was building AI tools for our marketing campaigns.',
      rating: 5
    },
    {
      name: 'Michael Rodriguez',
      role: 'Sales Manager',
      company: 'InnovateCo',
      content: 'The role-specific training was perfect. I learned AI applications directly relevant to sales processes and saw immediate results.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Transform Your AI Skills
              <span className="block text-3xl md:text-5xl mt-2 opacity-90">
                Within Weeks, Not Months
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              From AI-curious to AI-proficient through assessment-driven, personalized learning experiences. 
              Join thousands advancing their careers with practical AI skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/assessment"
                className="bg-white text-primary-600 font-semibold py-4 px-8 rounded-lg hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <span>Start Free AI Assessment</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/training"
                className="border-2 border-white text-white font-semibold py-4 px-8 rounded-lg hover:bg-white hover:text-primary-600 transition-all duration-200"
              >
                Explore Training
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
              The Complete AI Literacy Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our proven Assess → Activate → Certify methodology transforms individuals and organizations 
              from AI-curious to AI-proficient.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center">
                <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gray-50 flex items-center justify-center ${feature.color}`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Our Platform?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Unlike theoretical courses, we focus on practical AI skills that you can apply immediately 
                in your workplace. Our assessment-driven approach ensures personalized learning paths.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="card text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">85%</div>
                <div className="text-gray-600">Assessment Completion Rate</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-secondary-600 mb-2">3 Weeks</div>
                <div className="text-gray-600">Average Skill Transformation</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-accent-orange mb-2">1000+</div>
                <div className="text-gray-600">Certified Professionals</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">4.8/5</div>
                <div className="text-gray-600">User Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600">
              See how professionals are transforming their careers with AI literacy
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600">{testimonial.role} at {testimonial.company}</div>
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
            Ready to Transform Your AI Skills?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start with our free AI readiness assessment and discover your personalized learning path.
          </p>
          <Link
            to="/assessment"
            className="bg-white text-primary-600 font-semibold py-4 px-8 rounded-lg hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 inline-flex items-center space-x-2"
          >
            <span>Begin Your AI Journey</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
