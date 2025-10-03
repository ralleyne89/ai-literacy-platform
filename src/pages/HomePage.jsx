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
  Star,
  ShieldCheck,
  GraduationCap,
  ClipboardList,
  Building2,
  BookOpen,
  Sparkles,
  HelpCircle
} from 'lucide-react'
import { HeroGeometric } from '@/components/ui/shape-landing-hero'

const HomePage = () => {
  const features = [
    {
      icon: Target,
      title: 'Assess AI Readiness',
      description: 'Comprehensive 15-question assessment across AI Fundamentals, Practical Usage, Ethics & Critical Thinking, AI Impact & Applications, and Strategic Understanding.',
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
      <section className="relative">
        <HeroGeometric
          badge="AI Literacy Platform"
          title1={(
            <>
              Assess → Activate →
            </>
          )}
          title2="Certify AI Talent"
        />
      </section>

      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
            <span className="inline-block h-2 w-2 rounded-full bg-primary-500"></span>
            Complete AI Proficiency Development
          </div>
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-sm">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900">Transform teams with measurable AI mastery</h2>
          <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Pair the hero experience above with the rest of our Assess → Activate → Certify journey to benchmark skills, deploy live training, and verify outcomes with trusted credentials.
          </p>
        </div>
      </section>

      {/* Steps band */}
      <section className="bg-gray-900 py-14 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Start with assessment, activate with training, certify proficiency</h2>
            <p className="mt-3 text-gray-300">Hands-on learning, real outcomes, industry-recognized credentials.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-gray-800/60 p-6 border border-white/10">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10">1</div>
              <div className="flex items-center gap-2 text-lg font-semibold"><CheckCircle className="h-5 w-5 text-emerald-400"/> Assess AI Readiness</div>
              <p className="mt-2 text-gray-300 text-sm">Discover current skills across key dimensions and get a personalized plan.</p>
              <div className="mt-4">
                <Link to="/assessment" className="inline-flex items-center text-emerald-400 font-medium">
                  Start free assessment <ArrowRight className="ml-1 h-4 w-4"/>
                </Link>
              </div>
            </div>
            <div className="rounded-2xl bg-gray-800/60 p-6 border border-white/10">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10">2</div>
              <div className="flex items-center gap-2 text-lg font-semibold"><GraduationCap className="h-5 w-5 text-emerald-400"/> Activate Through Training</div>
              <p className="mt-2 text-gray-300 text-sm">Hands-on, role-specific courses for Sales, HR, Marketing, and Operations.</p>
              <div className="mt-4">
                <Link to="/training" className="inline-flex items-center text-emerald-400 font-medium">
                  Explore live courses <ArrowRight className="ml-1 h-4 w-4"/>
                </Link>
              </div>
            </div>
            <div className="rounded-2xl bg-gray-800/60 p-6 border border-white/10">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10">3</div>
              <div className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="h-5 w-5 text-emerald-400"/> Certify AI Proficiency</div>
              <p className="mt-2 text-gray-300 text-sm">Prove real-world capability with standardized exams and digital certificates.</p>
              <div className="mt-4">
                <Link to="/certification" className="inline-flex items-center text-emerald-400 font-medium">
                  View certification <ArrowRight className="ml-1 h-4 w-4"/>
                </Link>
              </div>
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

      {/* Assessment split section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Left copy */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-600">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                Transformation within weeks, not months
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Every company should be AI ready</h2>
              <p className="text-gray-700 mb-6">Assess → Activate → Certify: discover where you stand, build hands-on skills through live training, and earn industry-recognized credentials.</p>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">1</div>
                  <div>
                    <div className="font-semibold text-gray-900">Assess</div>
                    <div className="text-gray-600">Discover your team's AI readiness with a quick assessment.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">2</div>
                  <div>
                    <div className="font-semibold text-gray-900">Activate</div>
                    <div className="text-gray-600">Build real tools in-session through role-specific, live courses.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">3</div>
                  <div>
                    <div className="font-semibold text-gray-900">Certify</div>
                    <div className="text-gray-600">Prove proficiency with standardized exams and verified certificates.</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link to="/assessment" className="btn-primary">Start free AI assessment</Link>
                <Link to="/training" className="btn-outline">Explore live courses</Link>
              </div>

              <p className="mt-3 text-xs text-gray-500">Individual → Team → Organization: many clients start with individual team members, then scale.</p>
            </div>

            {/* Right: metrics + assessment preview */}
            <div className="space-y-4">
              {/* Metrics card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Promotion impact</div>
                    <div className="h-2 w-full rounded bg-gray-100 overflow-hidden"><div className="h-full w-[70%] bg-emerald-500"></div></div>
                    <div className="mt-1 text-xs text-gray-600">of graduates reported promotions/new opportunities within 6 months</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1"><span>Productivity increase</span><span className="font-semibold text-gray-700">45%</span></div>
                    <div className="h-2 w-full rounded bg-gray-100 overflow-hidden"><div className="h-full w-[45%] bg-emerald-500"></div></div>
                    <div className="mt-1 text-xs text-gray-600">average improvement in daily work tasks</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1"><span>Salary premium</span><span className="font-semibold text-gray-700">25%</span></div>
                    <div className="h-2 w-full rounded bg-gray-100 overflow-hidden"><div className="h-full w-[25%] bg-emerald-500"></div></div>
                    <div className="mt-1 text-xs text-gray-600">higher compensation for AI-skilled professionals</div>
                  </div>
                </div>
              </div>

              {/* Assessment preview */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-gray-300"></span>
                    AI Proficiency Assessment
                  </div>
                  <div>2:45 remaining</div>
                </div>
                <div className="text-sm text-gray-900 font-medium mb-3">Which of the following best describes a transformer-based language model?</div>
                <div className="space-y-2">
                  {[
                    'A model that converts text to numerical vectors',
                    'A neural network that uses attention mechanisms to process text sequences',
                    'A rule-based system for language translation',
                    'An algorithm that transforms audio into text',
                  ].map((opt, i) => (
                    <button key={i} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-left text-sm hover:bg-gray-50">{opt}</button>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 rounded bg-gray-100 overflow-hidden"><div className="h-full w-1/2 bg-primary-500"></div></div>
                  <button className="btn-outline text-sm">Next question</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What sets us apart (dark) */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white">What sets us apart</h2>
            <p className="mt-3 text-white">Embedded leadership, real execution, and outcomes within weeks.</p>
          </div>

          <div className="rounded-2xl bg-gray-800/60 border border-white/10 p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {t: 'Embedded AI leadership (fCAIO) with real execution, not just advice', s: 'Get strategic AI leadership at a fraction of the cost of hiring a full-time CAIO.'},
                {t: 'Tailored by department for real-world workflows', s: 'Custom training for HR, Sales, Marketing, Operations, and executive teams.'},
                {t: 'Live, hands-on training where teams build real tools in-session', s: 'Unlike theoretical courses, teams create actual business solutions during training.'},
                {t: 'Fast implementation—most companies see transformation within weeks', s: 'Rapid results vs. months-long traditional programs.'},
                {t: 'Practical, fast certifications tied to business use, not theory', s: 'Skills-based credentials that prove real workplace capability.'},
                {t: 'Focused exclusively on AI enablement across every layer of the org', s: 'We specialize only in AI transformation.'},
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <div className="font-semibold">{item.t}</div>
                    <div className="text-sm text-white">{item.s}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/enterprise" className="btn-outline">Advanced Enterprise Solutions</Link>
            </div>
          </div>
        </div>
      </section>





      {/* What you get section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Assessment */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <Target className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Assessment</h3>
              <p className="text-gray-600 mb-4 text-sm">Comprehensive skill mapping, personalized insights and recommendations.</p>
              <div className="space-y-2 text-sm text-gray-700">
                <div>• Free 3-5 minute assessment</div>
                <div>• Benchmark comparison</div>
                <div>• Personalized learning paths</div>
              </div>
              <div className="mt-4">
                <Link to="/assessment" className="text-emerald-600 font-medium text-sm inline-flex items-center">
                  Free 3-5 minute assessment <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Training */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Training</h3>
              <p className="text-gray-600 mb-4 text-sm">Live interactive learning. Build real tools, delivered by department for immediate workplace application.</p>
              <div className="space-y-2 text-sm text-gray-700">
                <div>• Live training where teams build real tools</div>
                <div>• Role-specific courses</div>
                <div>• Hands-on practice</div>
              </div>
              <div className="mt-4">
                <Link to="/training" className="text-blue-600 font-medium text-sm inline-flex items-center">
                  Explore live courses <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Certification */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Certification</h3>
              <p className="text-gray-600 mb-4 text-sm">Skills-based credentials that advance careers and prove real workplace capabilities.</p>
              <div className="space-y-2 text-sm text-gray-700">
                <div>• Career advancement</div>
                <div>• Skills-based credentials that advance careers</div>
                <div>• Prove real workplace capabilities</div>
              </div>
              <div className="mt-4">
                <Link to="/certification" className="text-purple-600 font-medium text-sm inline-flex items-center">
                  Get certified <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certification Dimensions */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Certification that measures what matters</h2>
              <p className="text-lg text-gray-600 mb-6">Our exams reflect real-world AI proficiency across three core dimensions, ensuring a trusted signal for hiring and advancement.</p>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                    <Sparkles className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">AI Thinking & Cognitive Aptitude</div>
                    <div className="text-gray-600 text-sm">Reasoning, problem decomposition, pattern recognition, and using AI as a thinking partner.</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">AI Knowledge & Understanding</div>
                    <div className="text-gray-600 text-sm">Core concepts, capabilities and limitations, safety, and responsible use of AI systems.</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                    <ClipboardList className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Prompt Engineering & Communication</div>
                    <div className="text-gray-600 text-sm">Outcome-driven prompting, iteration, evaluation, and communicating with AI effectively.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Featured live course</h3>
              <div className="text-2xl font-bold text-gray-900 mb-2">How to Build a Business in a Weekend with AI</div>
              <p className="text-gray-600 mb-4">An intensive, instructor-led workshop where you learn to rapidly plan, prototype, and launch a business using AI tools—complete with real-time feedback.</p>
              <ul className="text-gray-700 space-y-2 mb-6 list-disc pl-5">
                <li>Hands-on, guided sessions with expert instructors</li>
                <li>Practical frameworks and toolkits you can reuse</li>
                <li>Certificate of completion</li>
              </ul>
              <Link to="/training" className="btn-outline inline-flex items-center">
                Explore course <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently asked questions</h2>
            <p className="text-lg text-gray-600">Quick answers about assessments, courses, and certifications.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <div className="flex items-start">
                <HelpCircle className="w-5 h-5 text-primary-600 mt-1 mr-3" />
                <div>
                  <div className="font-semibold text-gray-900 mb-1">What is the AI Mastery Predictor Test?</div>
                  <div className="text-gray-600 text-sm">A free 15-question assessment that evaluates your AI proficiency across AI Fundamentals, Practical Usage, Ethics & Critical Thinking, AI Impact & Applications, and Strategic Understanding.</div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-start">
                <HelpCircle className="w-5 h-5 text-primary-600 mt-1 mr-3" />
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Do I need technical experience?</div>
                  <div className="text-gray-600 text-sm">No. The platform is designed for professionals across industries and roles—no coding required.</div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-start">
                <HelpCircle className="w-5 h-5 text-primary-600 mt-1 mr-3" />
                <div>
                  <div className="font-semibold text-gray-900 mb-1">What does the certification cover?</div>
                  <div className="text-gray-600 text-sm">A 40-question standardized exam validating real-world AI application skills with a verified digital certificate.</div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-start">
                <HelpCircle className="w-5 h-5 text-primary-600 mt-1 mr-3" />
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Are there team/enterprise options?</div>
                  <div className="text-gray-600 text-sm">Yes. We offer org-wide assessments, analytics, custom programs, and bulk certification management.</div>
                </div>
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
            Ready to transform your AI skills?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start with our free AI readiness assessment and discover your personalized learning path.
          </p>
          <Link
            to="/assessment"
            className="bg-white text-primary-600 font-semibold py-4 px-8 rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 inline-flex items-center space-x-2"
          >
            <span>Begin your AI journey</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
