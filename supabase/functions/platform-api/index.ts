import { createClient } from 'jsr:@supabase/supabase-js@2'

const TABLES = {
  user: 'user',
  assessmentResult: 'assessment_result',
  trainingModule: 'training_module',
  userProgress: 'user_progress',
  lesson: 'lesson',
  lessonProgress: 'lesson_progress',
  certification: 'certification',
  certificationType: 'certification_type',
}

const DOMAINS = [
  'AI Fundamentals',
  'Practical Usage',
  'Ethics & Critical Thinking',
  'AI Impact & Applications',
  'Strategic Understanding',
]

const QUESTIONS_PER_DOMAIN = 3

const SAMPLE_QUESTIONS = [
  {
    id: '1',
    domain: 'AI Fundamentals',
    question_text: 'What is the primary difference between AI and traditional software?',
    option_a: 'AI can learn and adapt from data',
    option_b: 'AI is faster than traditional software',
    option_c: 'AI uses more memory',
    option_d: 'AI is more expensive',
    correct_answer: 'A',
    explanation:
      'Unlike traditional software, AI systems can learn from data and improve performance without explicit programming for every scenario.',
  },
  {
    id: '2',
    domain: 'AI Fundamentals',
    question_text: 'What does machine learning mean?',
    option_a: 'Teaching humans about machines',
    option_b: 'A type of AI that learns patterns from data',
    option_c: 'Programming robots to move',
    option_d: 'Computer maintenance procedures',
    correct_answer: 'B',
    explanation:
      'Machine learning is a subset of AI focused on algorithms that learn patterns from data to make predictions or decisions.',
  },
  {
    id: '3',
    domain: 'AI Fundamentals',
    question_text: 'What causes AI hallucinations?',
    option_a: 'Hardware malfunctions',
    option_b: 'User input errors',
    option_c: 'The AI generating plausible but false information',
    option_d: 'Internet connectivity issues',
    correct_answer: 'C',
    explanation:
      'Hallucinations happen when AI fills gaps with confident but incorrect information based on patterns it has learned.',
  },
  {
    id: '4',
    domain: 'Practical Usage',
    question_text: 'When writing a prompt for an AI tool, you should:',
    option_a: 'Be vague to let AI be creative',
    option_b: 'Be specific and clear about what you want',
    option_c: 'Use only technical jargon',
    option_d: 'Keep it to one word',
    correct_answer: 'B',
    explanation:
      'Clear, specific prompts give AI models the context they need to produce accurate, useful outputs.',
  },
  {
    id: '5',
    domain: 'Practical Usage',
    question_text: 'What is the best practice when using AI for research or work?',
    option_a: 'Accept all AI results without checking',
    option_b: 'Verify important information with reliable sources',
    option_c: 'Only use AI-generated sources',
    option_d: 'Never use AI for professional work',
    correct_answer: 'B',
    explanation:
      'AI outputs should be validated, especially for critical work. Treat them as a starting point, not the final answer.',
  },
  {
    id: '6',
    domain: 'Practical Usage',
    question_text: 'An AI tool gives you conflicting information on the same topic. You should:',
    option_a: 'Use the first response',
    option_b: 'Research the topic independently to verify',
    option_c: 'Choose the longer response',
    option_d: 'Ask the same question again',
    correct_answer: 'B',
    explanation:
      'When AI responses conflict, cross-checking with trustworthy human-vetted sources ensures accuracy.',
  },
  {
    id: '7',
    domain: 'Ethics & Critical Thinking',
    question_text: 'What is algorithmic bias?',
    option_a: 'AI systems running slowly',
    option_b: 'AI systems making unfair decisions based on training data',
    option_c: 'Programming syntax errors',
    option_d: 'Hardware processing limitations',
    correct_answer: 'B',
    explanation:
      'Algorithmic bias occurs when AI models inherit or amplify unfair patterns found in their training data.',
  },
  {
    id: '8',
    domain: 'Ethics & Critical Thinking',
    question_text:
      'You notice an AI hiring tool consistently rejects qualified candidates from certain groups. This indicates:',
    option_a: 'The system is working efficiently',
    option_b: 'Potential discriminatory bias that needs investigation',
    option_c: 'Normal performance variation',
    option_d: 'Cost-saving optimization',
    correct_answer: 'B',
    explanation:
      'Consistent rejection of specific groups is a warning sign of bias that requires immediate review and mitigation.',
  },
  {
    id: '9',
    domain: 'Ethics & Critical Thinking',
    question_text: 'Before trusting AI-generated content, you should:',
    option_a: 'Always trust it completely',
    option_b: 'Consider the source, context, and verify key facts',
    option_c: 'Only check if it looks suspicious',
    option_d: 'Never trust AI content',
    correct_answer: 'B',
    explanation:
      'Evaluating source credibility and validating important details prevents misinformation from spreading.',
  },
  {
    id: '10',
    domain: 'AI Impact & Applications',
    question_text: 'Which task is current AI best suited for?',
    option_a: 'Providing emotional counseling',
    option_b: 'Recognizing patterns in large amounts of data',
    option_c: 'Making complex ethical decisions',
    option_d: 'Replacing all human judgment',
    correct_answer: 'B',
    explanation:
      'AI excels at analyzing large datasets to surface patterns, trends, and insights quickly.',
  },
  {
    id: '11',
    domain: 'AI Impact & Applications',
    question_text: 'How is AI most likely to affect jobs in the next 5 years?',
    option_a: 'Eliminate all human jobs',
    option_b: 'Automate some tasks while creating new types of work',
    option_c: 'Only affect technology jobs',
    option_d: 'Have no impact on employment',
    correct_answer: 'B',
    explanation:
      'AI will automate repetitive tasks but also create new opportunities that require human oversight and strategic thinking.',
  },
  {
    id: '12',
    domain: 'AI Impact & Applications',
    question_text: 'What is a realistic expectation for AI tools today?',
    option_a: 'They can solve any business problem perfectly',
    option_b: 'They can assist with analysis and draft generation',
    option_c: 'They always provide 100% accurate information',
    option_d: 'They can replace human creativity entirely',
    correct_answer: 'B',
    explanation:
      'Modern AI is a powerful assistant for analysis and content creation, but still requires human oversight.',
  },
  {
    id: '13',
    domain: 'Strategic Understanding',
    question_text: 'When should you choose not to use AI for a task?',
    option_a: 'When it costs money',
    option_b: 'When human empathy, ethics, or critical judgment are essential',
    option_c: 'When the technology is new',
    option_d: 'Never - AI should be used for everything',
    correct_answer: 'B',
    explanation:
      'Tasks that depend on empathy, ethical nuance, or high-stakes judgment should remain human-led.',
  },
  {
    id: '14',
    domain: 'Strategic Understanding',
    question_text: 'What does successful human-AI collaboration look like?',
    option_a: 'Humans competing against AI',
    option_b: 'AI and humans complementing each other strengths',
    option_c: 'AI doing all the work',
    option_d: 'Humans avoiding AI entirely',
    correct_answer: 'B',
    explanation:
      'The strongest outcomes happen when humans and AI combine strengths: strategy and creativity with speed and scale.',
  },
  {
    id: '15',
    domain: 'Strategic Understanding',
    question_text: 'You are implementing AI in your organization. What is most important?',
    option_a: 'Choosing the most expensive AI solution',
    option_b: 'Training employees and establishing ethical guidelines',
    option_c: 'Replacing as many human workers as possible',
    option_d: 'Focusing only on cost savings',
    correct_answer: 'B',
    explanation:
      'Successful AI adoption depends on skilled people and clear ethical guardrails, not just technology investments.',
  },
  {
    id: '16',
    domain: 'AI Fundamentals',
    question_text: 'Which phrase best describes training data for AI models?',
    option_a: 'Data used to operate software without user input',
    option_b: 'Examples that teach the model patterns and relationships',
    option_c: 'The final output produced by the model',
    option_d: 'A list of software bugs to fix',
    correct_answer: 'B',
    explanation: 'Training data consists of examples that let the model learn patterns over many iterations.',
  },
  {
    id: '17',
    domain: 'AI Fundamentals',
    question_text: 'Why is data quality important for AI systems?',
    option_a: 'Better data always makes models run faster',
    option_b: 'High-quality data improves reliability and reduces harmful outputs',
    option_c: 'Poor data is only a user interface issue',
    option_d: 'Data quality does not matter once a model is deployed',
    correct_answer: 'B',
    explanation:
      'Model quality is tied closely to the quality of the data used to train it, especially for fairness and accuracy.',
  },
  {
    id: '18',
    domain: 'Practical Usage',
    question_text: 'If an AI-generated response includes wrong details, what should you do first?',
    option_a: 'Ignore it and move on',
    option_b: 'Verify with trusted references',
    option_c: 'Ask the AI to confirm its confidence',
    option_d: 'Post it immediately to stakeholders',
    correct_answer: 'B',
    explanation: 'Verification with trusted sources is the fastest way to correct possible inaccuracies.',
  },
  {
    id: '19',
    domain: 'Practical Usage',
    question_text: 'Which prompt style is most useful for brainstorming ideas?',
    option_a: 'A strict, single-word instruction',
    option_b: 'A broad open prompt with role, context, constraints, and format',
    option_c: 'A request without context',
    option_d: 'No prompt is needed; AI auto-generates ideas by default',
    correct_answer: 'B',
    explanation: 'Rich context and constraints help AI give outputs that are easier to use and evaluate.',
  },
  {
    id: '20',
    domain: 'Ethics & Critical Thinking',
    question_text: 'What should you do if AI output reveals sensitive personal data?',
    option_a: 'Share it with your team immediately',
    option_b: 'Redact or report it through your privacy process',
    option_c: 'Store it and forget about it',
    option_d: 'Use it in your marketing campaign',
    correct_answer: 'B',
    explanation:
      'Sensitive outputs should be handled under privacy and data-protection practices, not treated as ordinary output.',
  },
  {
    id: '21',
    domain: 'Ethics & Critical Thinking',
    question_text: 'Which practice helps reduce model bias risks in production?',
    option_a: 'Testing with diverse user groups and auditing outputs',
    option_b: 'Restricting model updates forever',
    option_c: 'Only using one dataset source',
    option_d: 'Avoiding any feedback process',
    correct_answer: 'A',
    explanation:
      'Ongoing evaluation with diverse scenarios is key to catching fairness gaps before harm occurs.',
  },
  {
    id: '22',
    domain: 'AI Impact & Applications',
    question_text: 'Where is AI most commonly adopted for short-cycle operational gain?',
    option_a: 'Only for legal sentencing decisions',
    option_b: 'Customer support triage and document automation',
    option_c: 'Replacing board-level leadership roles',
    option_d: 'Replacing all manual tasks instantly',
    correct_answer: 'B',
    explanation:
      'AI often delivers fast ROI in repetitive support, routing, and document-heavy workflows.',
  },
  {
    id: '23',
    domain: 'AI Impact & Applications',
    question_text: 'What is a practical first application for teams new to AI?',
    option_a: 'Full autonomous company operations',
    option_b: 'Automated meeting minute drafts with human review',
    option_c: 'Replacing all strategic decisions with AI',
    option_d: 'Hiring no human reviewers',
    correct_answer: 'B',
    explanation: 'Pilot projects with human review build confidence before scaling AI use.',
  },
  {
    id: '24',
    domain: 'Strategic Understanding',
    question_text: 'How should leadership frame AI adoption goals?',
    option_a: 'As a shortcut for governance and compliance',
    option_b: 'As measurable business outcomes with responsible guardrails',
    option_c: 'As a way to reduce all employee ownership',
    option_d: 'As a trend to satisfy investors only',
    correct_answer: 'B',
    explanation: 'AI strategy works best when outcomes, risk controls, and ownership are clearly defined.',
  },
  {
    id: '25',
    domain: 'Strategic Understanding',
    question_text: 'What is a strong indicator of AI strategy maturity?',
    option_a: 'Adopting the newest model every quarter',
    option_b: 'Measuring outcomes, iterating, and balancing ethics with speed',
    option_c: 'Avoiding AI whenever uncertainty exists',
    option_d: 'Deploying without cross-team communication',
    correct_answer: 'B',
    explanation:
      'Mature strategy couples experimentation with accountability, governance, and measurable value.',
  },
]

const PLAN_DEFINITIONS = {
  free: {
    name: 'Free',
    amount_cents: 0,
    currency: 'usd',
    description: 'Perfect for individuals exploring LitmusAI.',
    features: ['Access to assessments', 'Foundational training modules', 'Basic progress tracking'],
    cta: 'You are on this plan',
    is_free: true,
  },
  premium: {
    name: 'Premium',
    amount_cents: 4900,
    currency: 'usd',
    description: 'Unlock premium training, certifications, and analytics.',
    features: ['All Free features', 'Premium training catalog', 'Certification exam access', 'Email support'],
    cta: 'Upgrade to Premium',
    stripe_price_env: 'STRIPE_PRICE_PREMIUM',
    billing_interval: 'month',
  },
  enterprise: {
    name: 'Enterprise',
    amount_cents: 9900,
    currency: 'usd',
    description: 'Tailored enablement for teams and departments.',
    features: ['Custom learning paths', 'Dedicated customer success', 'SSO & advanced reporting', 'Licensing & partnerships'],
    cta: 'Upgrade to Enterprise',
    stripe_price_env: 'STRIPE_PRICE_ENTERPRISE',
    billing_interval: 'month',
  },
} as const

const PLAN_ALIAS: Record<string, keyof typeof PLAN_DEFINITIONS> = {
  professional: 'premium',
}

const TIER_RANK: Record<string, number> = {
  free: 0,
  premium: 1,
  professional: 1,
  enterprise: 2,
  affiliate: 1,
}

type ApiContext = {
  admin: ReturnType<typeof createClient>
  req: Request
  routePath: string
  url: URL
}

type AuthContext = {
  accessToken: string
  authUser: any
  profile: any
  userId: string
}

const nowIso = () => new Date().toISOString()
const env = (key: string, fallback = '') => Deno.env.get(key) || fallback
const truthy = (value: unknown) => ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase())
const stripTrailingSlash = (value: string) => String(value || '').trim().replace(/\/+$/, '')

const corsHeaders = (req: Request) => {
  const configured = stripTrailingSlash(env('FRONTEND_URL') || env('CORS_ORIGIN'))
  const origin = configured || stripTrailingSlash(req.headers.get('origin') || '') || 'http://localhost:5173'

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Expose-Headers': 'content-type, authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

const jsonResponse = (req: Request, data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(req),
      'Content-Type': 'application/json',
    },
  })

const errorResponse = (req: Request, message: string, status = 500, extra: Record<string, unknown> = {}) =>
  jsonResponse(req, { error: message, ...extra }, status)

const getAdminClient = () => {
  const supabaseUrl = env('SUPABASE_URL')
  const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for platform-api.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

const normalizeRoutePath = (url: URL) => {
  const pathname = url.pathname || '/'
  const apiIndex = pathname.indexOf('/api/')
  if (apiIndex >= 0) {
    return pathname.slice(apiIndex)
  }
  if (pathname.endsWith('/api')) {
    return '/api'
  }
  return pathname
}

const decodePathPart = (value = '') => decodeURIComponent(value.replace(/\+/g, ' '))

const readJsonBody = async (req: Request) => {
  const text = await req.text()
  if (!text.trim()) {
    return {}
  }
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const safeJsonParse = (value: unknown, fallback: any = []) => {
  if (value === null || typeof value === 'undefined') {
    return fallback
  }
  if (typeof value === 'object') {
    return value
  }
  if (typeof value !== 'string') {
    return fallback
  }
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const parseJsonArray = (value: unknown) => {
  const parsed = safeJsonParse(value, [])
  return Array.isArray(parsed) ? parsed : []
}

const normalizeContentType = (value: unknown) => String(value || '').trim().toLowerCase()

const safeExternalUrl = (value: unknown) => {
  const rawUrl = String(value || '').trim()
  if (!rawUrl) {
    return null
  }
  try {
    const parsed = new URL(rawUrl)
    return ['http:', 'https:'].includes(parsed.protocol) ? rawUrl : null
  } catch {
    return null
  }
}

const normalizeVideoEmbedUrl = (value: unknown) => {
  const rawUrl = String(value || '').trim()
  if (!rawUrl) {
    return ''
  }
  try {
    const parsed = new URL(rawUrl)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
    if (host === 'youtu.be') {
      const videoId = parsed.pathname.replace(/^\/+/, '').split('/')[0]
      return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : rawUrl
    }
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        const videoId = parsed.pathname.split('/embed/', 2)[1]?.split('/')[0]
        return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : rawUrl
      }
      const videoId = parsed.searchParams.get('v')
      return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : rawUrl
    }
  } catch {
    return rawUrl
  }
  return rawUrl
}

const getLessonCounts = async (admin: ReturnType<typeof createClient>, moduleIds: string[]) => {
  if (!moduleIds.length) {
    return new Map<string, number>()
  }
  const { data } = await admin.from(TABLES.lesson).select('module_id').in('module_id', moduleIds)
  const counts = new Map<string, number>()
  for (const row of data || []) {
    counts.set(row.module_id, (counts.get(row.module_id) || 0) + 1)
  }
  return counts
}

const buildModuleRoutingMetadata = (module: any, lessonCount = 0) => {
  const hasInternalLessons = lessonCount > 0
  const contentType = normalizeContentType(module.content_type)
  const detailPath = `/training/modules/${encodeURIComponent(module.id)}`
  const learnPath = hasInternalLessons ? `${detailPath}/learn` : null
  const prerequisitePayload = safeJsonParse(module.prerequisites, {})
  const metadata = prerequisitePayload && typeof prerequisitePayload === 'object' && !Array.isArray(prerequisitePayload)
    ? prerequisitePayload.metadata || {}
    : {}
  const externalUrl = safeExternalUrl(metadata.external_url) || safeExternalUrl(module.content_url)
  const isExternal = ['external', 'partner', 'affiliate'].includes(contentType)
  const routeType = hasInternalLessons ? 'internal_lessons' : isExternal && externalUrl ? 'external_detail' : 'module_detail'
  const primaryPath = hasInternalLessons ? learnPath : detailPath

  return {
    route_type: routeType,
    primary_path: primaryPath,
    detail_path: detailPath,
    learn_path: learnPath,
    external_url: externalUrl,
    is_external: isExternal,
    has_internal_lessons: hasInternalLessons,
  }
}

const buildModuleMetadata = (module: any, lessonCount = 0) => {
  const routing = buildModuleRoutingMetadata(module, lessonCount)
  return {
    target_domains: parseJsonArray(module.target_domains),
    lesson_count: lessonCount,
    has_internal_lessons: lessonCount > 0,
    routing,
    start_path: routing.primary_path,
    route_path: routing.primary_path,
    detail_path: routing.detail_path,
    learn_path: routing.learn_path,
    external_url: routing.external_url,
  }
}

const serializeModule = (module: any, lessonCount = 0, includeDetails = false) => {
  const payload = safeJsonParse(module.prerequisites, {})
  const isObjectPayload = payload && typeof payload === 'object' && !Array.isArray(payload)
  const requirements = isObjectPayload ? payload.requirements || [] : Array.isArray(payload) ? payload : []
  const resources = isObjectPayload ? payload.resources || [] : []
  const sections = isObjectPayload ? payload.sections || [] : []
  const metadata = isObjectPayload ? payload.metadata || {} : {}
  const learningObjectives = parseJsonArray(module.learning_objectives)

  const serialized = {
    id: module.id,
    title: module.title,
    description: module.description,
    role_specific: module.role_specific,
    difficulty_level: module.difficulty_level,
    estimated_duration_minutes: module.estimated_duration_minutes,
    content_type: module.content_type,
    content_url: module.content_url,
    is_premium: Boolean(module.is_premium),
    learning_objectives: learningObjectives,
    prerequisites: requirements,
    metadata,
    access_tier: metadata.access_tier || 'free',
    ...buildModuleMetadata(module, lessonCount),
  }

  if (includeDetails) {
    return {
      ...serialized,
      resources,
      content_sections: sections,
      created_at: module.created_at || null,
    }
  }

  return serialized
}

const serializeProgress = (progress: any, moduleTitle?: string) => {
  if (!progress) {
    return null
  }
  return {
    module_id: progress.module_id,
    module_title: moduleTitle,
    status: progress.status,
    progress_percentage: progress.progress_percentage || 0,
    time_spent_minutes: progress.time_spent_minutes || 0,
    current_lesson_id: progress.current_lesson_id,
    started_at: progress.started_at,
    last_accessed: progress.last_accessed,
    completed_at: progress.completed_at,
  }
}

const buildProgressSummary = (progressPayload: any[]) => {
  const completedModules = progressPayload.filter((progress) => progress.status === 'completed').length
  const totalLearningTime = progressPayload.reduce((total, progress) => total + (progress.time_spent_minutes || 0), 0)
  const inProgress = progressPayload
    .filter((progress) => progress.status === 'in_progress')
    .sort((a, b) => String(b.last_accessed || '').localeCompare(String(a.last_accessed || '')))

  return {
    completed_modules: completedModules,
    total_learning_time: totalLearningTime,
    resume_module: inProgress[0] || null,
  }
}

const getBearerToken = (req: Request) => {
  const header = req.headers.get('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || ''
}

const mapUserMetadata = (authUser: any, payload: Record<string, unknown> = {}) => {
  const metadata = authUser?.user_metadata || {}
  const email = String(payload.email || authUser?.email || metadata.email || '').trim().toLowerCase()
  const firstName = String(
    payload.first_name || metadata.first_name || metadata.given_name || authUser?.given_name || 'AI'
  ).trim()
  const lastName = String(
    payload.last_name || metadata.last_name || metadata.family_name || authUser?.family_name || 'Learner'
  ).trim()

  return {
    email,
    first_name: firstName || 'AI',
    last_name: lastName || 'Learner',
    role: typeof payload.role === 'string' ? payload.role.trim() || null : metadata.role || null,
    organization:
      typeof payload.organization === 'string' ? payload.organization.trim() || null : metadata.organization || null,
  }
}

const buildUserPayload = (profile: any) => ({
  id: profile.id,
  email: profile.email,
  first_name: profile.first_name || '',
  last_name: profile.last_name || '',
  role: profile.role || '',
  organization: profile.organization || '',
  subscription_tier: profile.subscription_tier || 'free',
  created_at: profile.created_at || null,
})

const upsertProfileForAuthUser = async (
  admin: ReturnType<typeof createClient>,
  authUser: any,
  payload: Record<string, unknown> = {}
) => {
  const subject = String(authUser?.id || '').trim()
  const mapped = mapUserMetadata(authUser, payload)
  if (!subject || !mapped.email) {
    throw new Error('Supabase user id and email are required.')
  }

  let { data: profile, error } = await admin
    .from(TABLES.user)
    .select('*')
    .eq('auth_provider', 'supabase')
    .eq('auth_subject', subject)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!profile) {
    const byId = await admin.from(TABLES.user).select('*').eq('id', subject).maybeSingle()
    if (byId.error) {
      throw byId.error
    }
    profile = byId.data
  }

  if (!profile) {
    const byEmail = await admin.from(TABLES.user).select('*').eq('email', mapped.email).maybeSingle()
    if (byEmail.error) {
      throw byEmail.error
    }
    profile = byEmail.data
  }

  const values = {
    email: mapped.email,
    first_name: mapped.first_name,
    last_name: mapped.last_name,
    role: mapped.role,
    organization: mapped.organization,
    auth_provider: 'supabase',
    auth_subject: subject,
    password_hash: 'supabase_managed',
    updated_at: nowIso(),
  }

  if (profile) {
    const updated = await admin.from(TABLES.user).update(values).eq('id', profile.id).select('*').single()
    if (updated.error) {
      throw updated.error
    }
    return updated.data
  }

  const inserted = await admin
    .from(TABLES.user)
    .insert({
      id: subject,
      ...values,
      subscription_tier: 'free',
      created_at: nowIso(),
    })
    .select('*')
    .single()

  if (inserted.error) {
    throw inserted.error
  }
  return inserted.data
}

const requireAuth = async (ctx: ApiContext, required = true): Promise<AuthContext | null> => {
  const accessToken = getBearerToken(ctx.req)
  if (!accessToken) {
    if (!required) {
      return null
    }
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { data, error } = await ctx.admin.auth.getUser(accessToken)
  if (error || !data?.user) {
    if (!required) {
      return null
    }
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const profile = await upsertProfileForAuthUser(ctx.admin, data.user)
  return {
    accessToken,
    authUser: data.user,
    profile,
    userId: profile.id,
  }
}

const handleAuth = async (ctx: ApiContext) => {
  const method = ctx.req.method
  if (['/api/auth/register', '/api/auth/login', '/api/auth/exchange'].includes(ctx.routePath) && method === 'POST') {
    return errorResponse(ctx.req, `${ctx.routePath} is no longer supported. Sign in through Supabase OAuth on the frontend.`, 410, {
      code: 'SUPABASE_ONLY_AUTH',
    })
  }

  if (ctx.routePath === '/api/auth/profile' && method === 'GET') {
    const auth = await requireAuth(ctx)
    return jsonResponse(ctx.req, { user: buildUserPayload(auth!.profile) })
  }

  if (ctx.routePath === '/api/auth/profile' && method === 'PUT') {
    const auth = await requireAuth(ctx)
    const body = await readJsonBody(ctx.req)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return errorResponse(ctx.req, 'Invalid request payload', 400)
    }

    const update: Record<string, unknown> = { updated_at: nowIso() }
    for (const key of ['first_name', 'last_name', 'role', 'organization']) {
      if (key in body) {
        const value = body[key]
        update[key] = typeof value === 'string' && value.trim() ? value.trim() : null
      }
    }
    if (!update.first_name) {
      delete update.first_name
    }
    if (!update.last_name) {
      delete update.last_name
    }

    const { data, error } = await ctx.admin.from(TABLES.user).update(update).eq('id', auth!.userId).select('*').single()
    if (error) {
      throw error
    }
    return jsonResponse(ctx.req, { message: 'Profile updated successfully', user: buildUserPayload(data) })
  }

  if (ctx.routePath === '/api/auth/sync' && method === 'POST') {
    const auth = await requireAuth(ctx)
    const body = (await readJsonBody(ctx.req)) || {}
    const profile = await upsertProfileForAuthUser(ctx.admin, auth!.authUser, body)
    return jsonResponse(ctx.req, { message: 'User synced successfully', user: buildUserPayload(profile) })
  }

  return null
}

const groupQuestionsByDomain = () => {
  const grouped = new Map<string, any[]>()
  for (const domain of DOMAINS) {
    grouped.set(domain, [])
  }
  for (const question of SAMPLE_QUESTIONS) {
    grouped.get(question.domain)?.push(question)
  }
  return grouped
}

const shuffled = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5)

const formatQuestion = (question: any) => {
  const pairs = [
    ['A', question.option_a],
    ['B', question.option_b],
    ['C', question.option_c],
    ['D', question.option_d],
  ]
  const originalCorrectText = Object.fromEntries(pairs)[question.correct_answer]
  const randomizedPairs = shuffled(pairs)
  const formatted = { ...question }
  randomizedPairs.forEach(([, text], index) => {
    const letter = String.fromCharCode('A'.charCodeAt(0) + index)
    formatted[`option_${letter.toLowerCase()}`] = text
    if (text === originalCorrectText) {
      formatted.correct_answer = letter
    }
  })
  return {
    id: formatted.id,
    domain: formatted.domain,
    question_text: formatted.question_text,
    option_a: formatted.option_a,
    option_b: formatted.option_b,
    option_c: formatted.option_c,
    option_d: formatted.option_d,
  }
}

const normalizeQuestionIdList = (value: unknown) => {
  if (!Array.isArray(value)) {
    return []
  }
  const seen = new Set<string>()
  const ids: string[] = []
  for (const raw of value) {
    const id = String(raw || '').trim()
    if (id && !seen.has(id)) {
      seen.add(id)
      ids.push(id)
    }
  }
  return ids
}

const getQuestionsByIds = (ids: string[]) => {
  const questionById = new Map(SAMPLE_QUESTIONS.map((question) => [question.id, question]))
  return ids.map((id) => questionById.get(id)).filter(Boolean)
}

const resolveGradingQuestions = (answers: Record<string, unknown>, selectedIds: string[]) => {
  const selectedQuestions = getQuestionsByIds(selectedIds)
  if (selectedQuestions.length) {
    return selectedQuestions
  }
  const answerQuestions = getQuestionsByIds(normalizeQuestionIdList(Object.keys(answers)))
  return answerQuestions.length ? answerQuestions : SAMPLE_QUESTIONS
}

const classifyScore = (totalCorrect: number) => {
  if (totalCorrect <= 6) return 'Beginner'
  if (totalCorrect <= 11) return 'Intermediate'
  return 'Advanced'
}

const generateRecommendations = (
  domainScores: Record<string, number>,
  domainTotals: Record<string, number>,
  totalCorrect: number,
  scoreBand: string
) => {
  const courseMap: Record<string, string[]> = {
    Beginner: ['Google AI Essentials (Free)', 'Coursera AI for Everyone by Andrew Ng', 'LinkedIn Learning AI Foundations'],
    Intermediate: ['IBM Applied AI Professional Certificate', 'Microsoft AI Business School courses', 'Ethics in AI specialization'],
    Advanced: ['Wharton AI Strategy for Business', 'MIT AI Leadership programs', 'Advanced prompt engineering courses'],
  }
  const description =
    scoreBand === 'Beginner'
      ? 'You are building your AI literacy. Start with foundational concepts before moving to advanced use cases.'
      : scoreBand === 'Intermediate'
        ? 'Solid baseline understanding. Focus on applied practice and ethical considerations to level up.'
        : 'You demonstrate strong AI literacy. Continue refining strategic application and leadership skills.'

  const recommendations: any[] = [
    {
      type: 'overall',
      title: `${scoreBand} LitmusAI Readiness`,
      description,
      priority: scoreBand === 'Beginner' ? 'high' : 'medium',
      action: `Recommended next steps: ${(courseMap[scoreBand] || []).join('; ')}`,
    },
  ]

  const domainActions: Record<string, string> = {
    'AI Fundamentals': 'Review core AI terminology, model types, and common pitfalls.',
    'Practical Usage': 'Practice structured prompting and workflows that combine AI with human review.',
    'Ethics & Critical Thinking': 'Deepen your understanding of bias, governance, and responsible use policies.',
    'AI Impact & Applications': 'Explore industry case studies to connect AI capabilities with high-value outcomes.',
    'Strategic Understanding': 'Align AI initiatives with business strategy, training, and ethical guardrails.',
  }

  for (const domain of Object.keys(domainTotals)) {
    if (!domainTotals[domain]) continue
    if ((domainScores[domain] || 0) <= 1) {
      recommendations.push({
        type: 'domain',
        domain,
        title: `Deepen ${domain} skills`,
        description: domainActions[domain] || '',
        priority: 'medium',
        action: 'Focus your next learning sprint on this competency area.',
      })
    }
  }
  return recommendations
}

const handleAssessment = async (ctx: ApiContext) => {
  if (ctx.routePath === '/api/assessment/questions' && ctx.req.method === 'GET') {
    const grouped = groupQuestionsByDomain()
    const selected = DOMAINS.flatMap((domain) => shuffled(grouped.get(domain) || []).slice(0, QUESTIONS_PER_DOMAIN))
    const questions = shuffled(selected).map(formatQuestion)
    return jsonResponse(ctx.req, { questions, total_questions: questions.length, domains: DOMAINS })
  }

  if (ctx.routePath === '/api/assessment/submit' && ctx.req.method === 'POST') {
    const auth = await requireAuth(ctx, false)
    const body = await readJsonBody(ctx.req)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return errorResponse(ctx.req, 'Invalid request payload', 400)
    }
    const answers = body.answers
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return errorResponse(ctx.req, 'Answers are required', 400)
    }

    const selectedIds = normalizeQuestionIdList(
      body.selected_question_ids || body.selectedQuestionIds || body.selected_ids || body.question_ids
    )
    const selectedQuestions = resolveGradingQuestions(answers, selectedIds)
    const optionMap = body.option_map && typeof body.option_map === 'object' ? body.option_map : {}
    const domainScores = Object.fromEntries(DOMAINS.map((domain) => [domain, 0]))
    const domainTotals = Object.fromEntries(DOMAINS.map((domain) => [domain, 0]))
    const detailedResults: any[] = []
    let totalScore = 0

    for (const question of selectedQuestions) {
      const qId = question.id
      const domain = question.domain
      const correct = question.correct_answer
      const userAnswer = String((answers as Record<string, unknown>)[qId] || '').trim()
      const answerOptions = optionMap[qId] || {}
      const userAnswerText = String(answerOptions[userAnswer.toUpperCase()] || '')
      const correctAnswerText = question[`option_${correct.toLowerCase()}`]
      const isCorrect = userAnswerText
        ? userAnswerText.trim().toLowerCase() === String(correctAnswerText).trim().toLowerCase()
        : userAnswer.toUpperCase() === correct.toUpperCase()

      domainTotals[domain] += 1
      if (isCorrect) {
        totalScore += 1
        domainScores[domain] += 1
      }
      detailedResults.push({
        question_id: qId,
        domain,
        user_answer: userAnswer,
        user_answer_text: userAnswerText,
        correct_answer: correct,
        correct_answer_text: correctAnswerText,
        is_correct: isCorrect,
        explanation: question.explanation,
      })
    }

    const maxScore = selectedQuestions.length
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const scoreBand = classifyScore(totalScore)
    const recommendations = generateRecommendations(domainScores, domainTotals, totalScore, scoreBand)
    const domainScoresPayload = Object.fromEntries(
      DOMAINS.map((domain) => [domain, { score: domainScores[domain] || 0, total: domainTotals[domain] || 0 }])
    )

    if (auth?.userId) {
      const { error } = await ctx.admin.from(TABLES.assessmentResult).insert({
        user_id: auth.userId,
        total_score: totalScore,
        max_score: maxScore,
        percentage,
        functional_score: domainScoresPayload['AI Fundamentals'].score,
        ethical_score: domainScoresPayload['Practical Usage'].score,
        rhetorical_score: domainScoresPayload['Ethics & Critical Thinking'].score,
        pedagogical_score: domainScoresPayload['AI Impact & Applications'].score,
        domain_scores: domainScoresPayload,
        time_taken_minutes: Number(body.time_taken_minutes || 0),
        recommendations: JSON.stringify({
          insights: recommendations,
          strategic_score: domainScoresPayload['Strategic Understanding'].score,
        }),
        completed_at: nowIso(),
      })
      if (error) {
        throw error
      }
    }

    return jsonResponse(ctx.req, {
      total_score: totalScore,
      max_score: maxScore,
      percentage: Math.round(percentage * 10) / 10,
      domain_scores: domainScoresPayload,
      recommendations,
      detailed_results: detailedResults,
      time_taken_minutes: Number(body.time_taken_minutes || 0),
      score_band: scoreBand,
      saved: Boolean(auth?.userId),
    })
  }

  if (ctx.routePath === '/api/assessment/history' && ctx.req.method === 'GET') {
    const auth = await requireAuth(ctx)
    const { data, error } = await ctx.admin
      .from(TABLES.assessmentResult)
      .select('*')
      .eq('user_id', auth!.userId)
      .order('completed_at', { ascending: false })
    if (error) throw error

    const domainTotals = Object.fromEntries(DOMAINS.map((domain) => [domain, SAMPLE_QUESTIONS.filter((q) => q.domain === domain).length]))
    const history = (data || []).map((result: any) => {
      const storedRecommendations = safeJsonParse(result.recommendations, {})
      const recommendations = Array.isArray(storedRecommendations)
        ? storedRecommendations
        : storedRecommendations.insights || []
      const strategicScore = Array.isArray(storedRecommendations) ? 0 : storedRecommendations.strategic_score || 0
      const storedDomainScores = safeJsonParse(result.domain_scores, {})
      const legacyFallback: Record<string, number> = {
        'AI Fundamentals': result.functional_score || 0,
        'Practical Usage': result.ethical_score || 0,
        'Ethics & Critical Thinking': result.rhetorical_score || 0,
        'AI Impact & Applications': result.pedagogical_score || 0,
        'Strategic Understanding': strategicScore,
      }
      const domain_scores = Object.fromEntries(
        DOMAINS.map((domain) => {
          const entry = storedDomainScores[domain] || {}
          return [
            domain,
            {
              score: entry.score ?? legacyFallback[domain] ?? 0,
              total: entry.total || domainTotals[domain] || 0,
            },
          ]
        })
      )
      return {
        id: result.id,
        total_score: result.total_score,
        max_score: result.max_score,
        percentage: result.percentage,
        score_band: classifyScore(result.total_score || 0),
        domain_scores,
        time_taken_minutes: result.time_taken_minutes,
        completed_at: result.completed_at,
        recommendations,
      }
    })
    return jsonResponse(ctx.req, { history })
  }

  if (ctx.routePath === '/api/assessment/recommendations' && ctx.req.method === 'GET') {
    const auth = await requireAuth(ctx)
    const latest = await ctx.admin
      .from(TABLES.assessmentResult)
      .select('*')
      .eq('user_id', auth!.userId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (latest.error) throw latest.error

    const modulesQuery = ctx.admin.from(TABLES.trainingModule).select('*').eq('is_active', true)
    const modulesResult = latest.data
      ? await modulesQuery
      : await modulesQuery.eq('difficulty_level', 1).limit(6)
    if (modulesResult.error) throw modulesResult.error

    const lessonCounts = await getLessonCounts(ctx.admin, (modulesResult.data || []).map((module: any) => module.id))
    if (!latest.data) {
      const recommendations = (modulesResult.data || []).map((module: any) => ({
        ...serializeCourseRecommendation(module, lessonCounts.get(module.id) || 0, 'Great starting point for AI literacy', 'low', 0),
      }))
      return jsonResponse(ctx.req, {
        recommendations,
        message: 'Take an assessment to get personalized recommendations',
      })
    }

    const domainScoresData = safeJsonParse(latest.data.domain_scores, {})
    const weakDomains = Object.entries(domainScoresData)
      .map(([domain, value]: [string, any]) => {
        const total = Number(value?.total || 1)
        const score = Number(value?.score || 0)
        const percentage = total > 0 ? (score / total) * 100 : 0
        return { domain, score, total, percentage }
      })
      .filter((entry) => entry.percentage < 50)

    const weakDomainNames = new Set(weakDomains.map((entry) => entry.domain))
    const selectedModules = (modulesResult.data || [])
      .filter((module: any) => {
        const domains = parseJsonArray(module.target_domains)
        return weakDomainNames.size === 0 || domains.some((domain) => weakDomainNames.has(domain))
      })
      .slice(0, 6)

    const recommendations = selectedModules.map((module: any) =>
      serializeCourseRecommendation(
        module,
        lessonCounts.get(module.id) || 0,
        weakDomainNames.size ? 'Targets a skill gap from your latest assessment' : 'Good next step from your latest assessment',
        weakDomainNames.size ? 'high' : 'medium',
        weakDomainNames.size ? 50 : 0
      )
    )

    return jsonResponse(ctx.req, {
      recommendations,
      assessment_score: latest.data.percentage,
      weak_domains: weakDomains,
    })
  }

  return null
}

const serializeCourseRecommendation = (
  module: any,
  lessonCount: number,
  reason: string,
  priority: string,
  skillGapPercentage = 0
) => ({
  id: module.id,
  title: module.title,
  description: module.description,
  difficulty_level: module.difficulty_level,
  estimated_duration_minutes: module.estimated_duration_minutes,
  content_type: module.content_type,
  is_premium: Boolean(module.is_premium),
  role_specific: module.role_specific,
  reason,
  priority,
  skill_gap_percentage: skillGapPercentage,
  ...buildModuleMetadata(module, lessonCount),
})

const getProgressLookup = async (admin: ReturnType<typeof createClient>, userId: string | null, moduleIds: string[]) => {
  if (!userId || !moduleIds.length) return new Map<string, any>()
  const { data, error } = await admin
    .from(TABLES.userProgress)
    .select('*')
    .eq('user_id', userId)
    .in('module_id', moduleIds)
  if (error) throw error
  return new Map((data || []).map((progress: any) => [progress.module_id, progress]))
}

const handleTraining = async (ctx: ApiContext) => {
  if (ctx.routePath === '/api/training/modules' && ctx.req.method === 'GET') {
    const auth = await requireAuth(ctx, false)
    const roleFilter = ctx.url.searchParams.get('role')
    const accessTier = ctx.url.searchParams.get('tier')
    let query = ctx.admin.from(TABLES.trainingModule).select('*').eq('is_active', true)
    if (roleFilter && roleFilter !== 'All') {
      query = query.or(`role_specific.eq.${roleFilter},role_specific.eq.General`)
    }
    const { data, error } = await query.order('title', { ascending: true })
    if (error) throw error

    const lessonCounts = await getLessonCounts(ctx.admin, (data || []).map((module: any) => module.id))
    let modules = (data || []).map((module: any) => serializeModule(module, lessonCounts.get(module.id) || 0))
    if (accessTier) {
      modules = modules.filter((module: any) => module.access_tier === accessTier)
    }

    const responsePayload: Record<string, unknown> = { modules }
    const progressPayload: any[] = []
    if (auth?.userId && modules.length) {
      const progressLookup = await getProgressLookup(ctx.admin, auth.userId, modules.map((module: any) => module.id))
      for (const modulePayload of modules) {
        const progress = serializeProgress(progressLookup.get(modulePayload.id), modulePayload.title)
        modulePayload.user_progress = progress
        if (progress) progressPayload.push(progress)
      }
      responsePayload.summary = buildProgressSummary(progressPayload)
      responsePayload.resume_module = (responsePayload.summary as any).resume_module
    }
    if (!data?.length) {
      responsePayload.message = 'No training modules configured yet. Import or seed training modules in Supabase.'
    } else if (accessTier && !modules.length) {
      responsePayload.message = `No modules available for tier ${accessTier}.`
    }
    return jsonResponse(ctx.req, responsePayload)
  }

  const moduleDetailMatch = ctx.routePath.match(/^\/api\/training\/modules\/([^/]+)$/)
  if (moduleDetailMatch && ctx.req.method === 'GET') {
    const auth = await requireAuth(ctx, false)
    const moduleId = decodePathPart(moduleDetailMatch[1])
    const { data: module, error } = await ctx.admin
      .from(TABLES.trainingModule)
      .select('*')
      .eq('id', moduleId)
      .eq('is_active', true)
      .maybeSingle()
    if (error) throw error
    if (!module) return errorResponse(ctx.req, 'Module not found', 404)

    const lessonCounts = await getLessonCounts(ctx.admin, [moduleId])
    const serialized = serializeModule(module, lessonCounts.get(moduleId) || 0, true)
    if (auth?.userId) {
      const { data: progress, error: progressError } = await ctx.admin
        .from(TABLES.userProgress)
        .select('*')
        .eq('user_id', auth.userId)
        .eq('module_id', moduleId)
        .maybeSingle()
      if (progressError) throw progressError
      ;(serialized as any).progress = serializeProgress(progress, module.title)
    } else {
      ;(serialized as any).progress = null
    }
    return jsonResponse(ctx.req, { module: serialized })
  }

  if (ctx.routePath === '/api/training/progress' && ctx.req.method === 'GET') {
    const auth = await requireAuth(ctx)
    const { data: progressRows, error } = await ctx.admin
      .from(TABLES.userProgress)
      .select('*')
      .eq('user_id', auth!.userId)
    if (error) throw error
    const moduleIds = (progressRows || []).map((progress: any) => progress.module_id)
    const modules = moduleIds.length
      ? await ctx.admin.from(TABLES.trainingModule).select('id,title').in('id', moduleIds)
      : { data: [], error: null }
    if (modules.error) throw modules.error
    const titleById = new Map((modules.data || []).map((module: any) => [module.id, module.title]))
    const progress = (progressRows || []).map((row: any) => serializeProgress(row, titleById.get(row.module_id)))
    return jsonResponse(ctx.req, { progress, summary: buildProgressSummary(progress) })
  }

  const enrollMatch = ctx.routePath.match(/^\/api\/training\/enroll\/([^/]+)$/)
  if (enrollMatch && ctx.req.method === 'POST') {
    const auth = await requireAuth(ctx)
    const moduleId = decodePathPart(enrollMatch[1])
    const moduleResult = await ctx.admin
      .from(TABLES.trainingModule)
      .select('*')
      .eq('id', moduleId)
      .eq('is_active', true)
      .maybeSingle()
    if (moduleResult.error) throw moduleResult.error
    if (!moduleResult.data) return errorResponse(ctx.req, 'Module not found', 404)

    const progress = await upsertModuleProgress(ctx.admin, auth!.userId, moduleId, {
      status: 'in_progress',
      progress_percentage: 0,
      time_spent_minutes: 0,
      started_at: nowIso(),
      last_accessed: nowIso(),
    })
    return jsonResponse(ctx.req, {
      message: 'Successfully enrolled in module',
      module_id: moduleId,
      status: progress.status,
      progress: serializeProgress(progress, moduleResult.data.title),
    })
  }

  const progressMatch = ctx.routePath.match(/^\/api\/training\/progress\/([^/]+)$/)
  if (progressMatch && ctx.req.method === 'PUT') {
    const auth = await requireAuth(ctx)
    const moduleId = decodePathPart(progressMatch[1])
    const body = (await readJsonBody(ctx.req)) || {}
    const moduleResult = await ctx.admin
      .from(TABLES.trainingModule)
      .select('*')
      .eq('id', moduleId)
      .eq('is_active', true)
      .maybeSingle()
    if (moduleResult.error) throw moduleResult.error
    if (!moduleResult.data) return errorResponse(ctx.req, 'Module not found', 404)

    const existing = await ctx.admin
      .from(TABLES.userProgress)
      .select('*')
      .eq('user_id', auth!.userId)
      .eq('module_id', moduleId)
      .maybeSingle()
    if (existing.error) throw existing.error

    const progressPercentage = Math.min(
      100,
      Math.max(Number(body.progress_percentage || 0), Number(existing.data?.progress_percentage || 0))
    )
    const timeSpent = Math.max(Number(body.time_spent_minutes || 0), Number(existing.data?.time_spent_minutes || 0))
    const markComplete = body.status === 'completed' || progressPercentage >= 100
    const progress = await upsertModuleProgress(ctx.admin, auth!.userId, moduleId, {
      status: markComplete ? 'completed' : 'in_progress',
      progress_percentage: progressPercentage,
      time_spent_minutes: timeSpent,
      current_lesson_id: body.current_lesson_id || existing.data?.current_lesson_id || null,
      started_at: existing.data?.started_at || nowIso(),
      last_accessed: nowIso(),
      completed_at: markComplete ? existing.data?.completed_at || nowIso() : null,
    })
    return jsonResponse(ctx.req, {
      message: 'Progress updated successfully',
      module_id: moduleId,
      status: progress.status,
      progress_percentage: progress.progress_percentage,
      time_spent_minutes: progress.time_spent_minutes,
      completed_at: progress.completed_at,
      progress: serializeProgress(progress, moduleResult.data.title),
    })
  }

  return null
}

const upsertModuleProgress = async (
  admin: ReturnType<typeof createClient>,
  userId: string,
  moduleId: string,
  values: Record<string, unknown>
) => {
  const payload = {
    user_id: userId,
    module_id: moduleId,
    ...values,
  }
  const { data, error } = await admin
    .from(TABLES.userProgress)
    .upsert(payload, { onConflict: 'user_id,module_id' })
    .select('*')
    .single()
  if (error) throw error
  return data
}

const serializeLessonProgress = (progress: any) => ({
  status: progress.status,
  time_spent_minutes: progress.time_spent_minutes || 0,
  quiz_score: progress.quiz_score,
  quiz_attempts: progress.quiz_attempts || 0,
  started_at: progress.started_at,
  completed_at: progress.completed_at,
})

const normalizeLessonContent = (lesson: any, module?: any) => {
  const contentData = safeJsonParse(lesson.content, {})
  if (!contentData || typeof contentData !== 'object' || Array.isArray(contentData)) {
    return {}
  }
  if (lesson.content_type === 'video') {
    const videoUrl = contentData.video_url || contentData.embed_url || contentData.url || contentData.videoUrl || module?.content_url
    const normalizedUrl = normalizeVideoEmbedUrl(videoUrl)
    if (normalizedUrl) {
      contentData.video_url = normalizedUrl
    }
  }
  return contentData
}

const serializeModuleProgress = (moduleProgress: any, lessons: any[], progressMap: Map<string, any>) => {
  const totalLessons = lessons.length
  const completedLessons = lessons.filter((lesson) => progressMap.get(lesson.id)?.status === 'completed').length
  const totalTimeSpent = Array.from(progressMap.values()).reduce((total, progress) => total + (progress.time_spent_minutes || 0), 0)
  const resumeLesson = lessons.find((lesson) => progressMap.get(lesson.id)?.status !== 'completed') || lessons[lessons.length - 1]
  const lessonIds = new Set(lessons.map((lesson) => lesson.id))
  const currentLessonId = lessonIds.has(moduleProgress?.current_lesson_id) ? moduleProgress.current_lesson_id : resumeLesson?.id || null
  const computedPercentage = totalLessons > 0 ? Math.trunc((completedLessons / totalLessons) * 100) : 0
  const status = moduleProgress?.status || (progressMap.size ? (completedLessons === totalLessons ? 'completed' : 'in_progress') : 'not_started')

  return {
    module_id: moduleProgress?.module_id || lessons[0]?.module_id || null,
    status,
    progress_percentage: moduleProgress?.progress_percentage ?? computedPercentage,
    completed_lessons: completedLessons,
    total_lessons: totalLessons,
    time_spent_minutes: moduleProgress?.time_spent_minutes ?? totalTimeSpent,
    current_lesson_id: currentLessonId,
    resume_lesson_id: resumeLesson?.id || null,
    started_at: moduleProgress?.started_at || null,
    last_accessed: moduleProgress?.last_accessed || null,
    completed_at: moduleProgress?.completed_at || null,
  }
}

const recalculateModuleProgress = async (admin: ReturnType<typeof createClient>, userId: string, moduleId: string) => {
  const lessonsResult = await admin.from(TABLES.lesson).select('*').eq('module_id', moduleId).order('order_index')
  if (lessonsResult.error) throw lessonsResult.error
  const lessons = lessonsResult.data || []
  if (!lessons.length) return null

  const progressResult = await admin
    .from(TABLES.lessonProgress)
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
  if (progressResult.error) throw progressResult.error

  const progressByLesson = new Map((progressResult.data || []).map((progress: any) => [progress.lesson_id, progress]))
  const completedLessons = lessons.filter((lesson: any) => progressByLesson.get(lesson.id)?.status === 'completed').length
  const progressPercentage = Math.trunc((completedLessons / lessons.length) * 100)
  const totalTimeSpent = (progressResult.data || []).reduce((total: number, progress: any) => total + (progress.time_spent_minutes || 0), 0)
  const nextIncomplete = lessons.find((lesson: any) => progressByLesson.get(lesson.id)?.status !== 'completed') || lessons[lessons.length - 1]

  return upsertModuleProgress(admin, userId, moduleId, {
    progress_percentage: progressPercentage,
    time_spent_minutes: totalTimeSpent,
    current_lesson_id: nextIncomplete?.id || null,
    last_accessed: nowIso(),
    started_at: progressResult.data?.find((progress: any) => progress.started_at)?.started_at || nowIso(),
    status: progressPercentage === 100 ? 'completed' : progressResult.data?.length || totalTimeSpent > 0 ? 'in_progress' : 'not_started',
    completed_at: progressPercentage === 100 ? nowIso() : null,
  })
}

const handleCourse = async (ctx: ApiContext) => {
  const moduleLessonsMatch = ctx.routePath.match(/^\/api\/course\/modules\/([^/]+)\/lessons$/)
  if (moduleLessonsMatch && ctx.req.method === 'GET') {
    const auth = await requireAuth(ctx)
    const moduleId = decodePathPart(moduleLessonsMatch[1])
    const moduleResult = await ctx.admin.from(TABLES.trainingModule).select('*').eq('id', moduleId).maybeSingle()
    if (moduleResult.error) throw moduleResult.error
    if (!moduleResult.data) return errorResponse(ctx.req, 'Module not found', 404)

    const lessonsResult = await ctx.admin.from(TABLES.lesson).select('*').eq('module_id', moduleId).order('order_index')
    if (lessonsResult.error) throw lessonsResult.error
    const lessons = lessonsResult.data || []
    const lessonIds = lessons.map((lesson: any) => lesson.id)
    const progressResult = lessonIds.length
      ? await ctx.admin.from(TABLES.lessonProgress).select('*').eq('user_id', auth!.userId).in('lesson_id', lessonIds)
      : { data: [], error: null }
    if (progressResult.error) throw progressResult.error
    const moduleProgress = await ctx.admin
      .from(TABLES.userProgress)
      .select('*')
      .eq('user_id', auth!.userId)
      .eq('module_id', moduleId)
      .maybeSingle()
    if (moduleProgress.error) throw moduleProgress.error
    const progressMap = new Map((progressResult.data || []).map((progress: any) => [progress.lesson_id, progress]))
    const lessonsData = lessons.map((lesson: any) => {
      const progress = progressMap.get(lesson.id)
      const content = lesson.content_type === 'video' ? normalizeLessonContent(lesson, moduleResult.data) : {}
      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        order_index: lesson.order_index,
        content_type: lesson.content_type,
        estimated_duration_minutes: lesson.estimated_duration_minutes,
        is_required: lesson.is_required,
        status: progress?.status || 'not_started',
        time_spent_minutes: progress?.time_spent_minutes || 0,
        quiz_score: progress?.quiz_score || null,
        completed_at: progress?.completed_at || null,
        has_video_url: Boolean(content.video_url),
        video_url: content.video_url,
      }
    })
    return jsonResponse(ctx.req, {
      module: {
        id: moduleResult.data.id,
        title: moduleResult.data.title,
        description: moduleResult.data.description,
        total_lessons: lessons.length,
        ...buildModuleMetadata(moduleResult.data, lessons.length),
      },
      lessons: lessonsData,
      module_progress: serializeModuleProgress(moduleProgress.data, lessons, progressMap),
    })
  }

  const lessonMatch = ctx.routePath.match(/^\/api\/course\/lessons\/([^/]+)$/)
  if (lessonMatch && ctx.req.method === 'GET') {
    const auth = await requireAuth(ctx)
    const lessonId = decodePathPart(lessonMatch[1])
    const lessonResult = await ctx.admin.from(TABLES.lesson).select('*').eq('id', lessonId).maybeSingle()
    if (lessonResult.error) throw lessonResult.error
    if (!lessonResult.data) return errorResponse(ctx.req, 'Lesson not found', 404)
    const lesson = lessonResult.data
    const moduleResult = await ctx.admin.from(TABLES.trainingModule).select('*').eq('id', lesson.module_id).maybeSingle()
    if (moduleResult.error) throw moduleResult.error

    const progress = await upsertLessonProgress(ctx.admin, auth!.userId, lesson, {
      status: 'in_progress',
      started_at: nowIso(),
      last_accessed: nowIso(),
    })
    await upsertModuleProgress(ctx.admin, auth!.userId, lesson.module_id, {
      status: 'in_progress',
      started_at: progress.started_at || nowIso(),
      current_lesson_id: lessonId,
      last_accessed: nowIso(),
    })

    return jsonResponse(ctx.req, {
      id: lesson.id,
      module_id: lesson.module_id,
      title: lesson.title,
      description: lesson.description,
      order_index: lesson.order_index,
      content_type: lesson.content_type,
      content: normalizeLessonContent(lesson, moduleResult.data),
      estimated_duration_minutes: lesson.estimated_duration_minutes,
      is_required: lesson.is_required,
      progress: serializeLessonProgress(progress),
    })
  }

  const completeMatch = ctx.routePath.match(/^\/api\/course\/lessons\/([^/]+)\/complete$/)
  if (completeMatch && ctx.req.method === 'POST') {
    const auth = await requireAuth(ctx)
    const lessonId = decodePathPart(completeMatch[1])
    const body = (await readJsonBody(ctx.req)) || {}
    const lessonResult = await ctx.admin.from(TABLES.lesson).select('*').eq('id', lessonId).maybeSingle()
    if (lessonResult.error) throw lessonResult.error
    if (!lessonResult.data) return errorResponse(ctx.req, 'Lesson not found', 404)
    const progress = await upsertLessonProgress(ctx.admin, auth!.userId, lessonResult.data, {
      status: 'completed',
      completed_at: nowIso(),
      last_accessed: nowIso(),
      time_spent_minutes: Number(body.time_spent_minutes || 0),
      quiz_score: 'quiz_score' in body ? Number(body.quiz_score) : null,
      quiz_attempts: lessonResult.data.content_type === 'quiz' && 'quiz_score' in body ? 1 : 0,
    })
    await recalculateModuleProgress(ctx.admin, auth!.userId, lessonResult.data.module_id)
    return jsonResponse(ctx.req, {
      message: 'Lesson completed successfully',
      progress: {
        status: progress.status,
        completed_at: progress.completed_at,
        quiz_score: progress.quiz_score,
      },
    })
  }

  const progressMatch = ctx.routePath.match(/^\/api\/course\/lessons\/([^/]+)\/progress$/)
  if (progressMatch && ctx.req.method === 'PUT') {
    const auth = await requireAuth(ctx)
    const lessonId = decodePathPart(progressMatch[1])
    const body = (await readJsonBody(ctx.req)) || {}
    const lessonResult = await ctx.admin.from(TABLES.lesson).select('*').eq('id', lessonId).maybeSingle()
    if (lessonResult.error) throw lessonResult.error
    if (!lessonResult.data) return errorResponse(ctx.req, 'Lesson not found', 404)
    const existing = await ctx.admin
      .from(TABLES.lessonProgress)
      .select('*')
      .eq('user_id', auth!.userId)
      .eq('lesson_id', lessonId)
      .maybeSingle()
    if (existing.error) throw existing.error
    await upsertLessonProgress(ctx.admin, auth!.userId, lessonResult.data, {
      status: body.status || existing.data?.status || 'in_progress',
      started_at: existing.data?.started_at || nowIso(),
      last_accessed: nowIso(),
      time_spent_minutes: Math.max(Number(body.time_spent_minutes || 0), Number(existing.data?.time_spent_minutes || 0)),
    })
    await recalculateModuleProgress(ctx.admin, auth!.userId, lessonResult.data.module_id)
    return jsonResponse(ctx.req, { message: 'Progress updated successfully' })
  }

  return null
}

const upsertLessonProgress = async (
  admin: ReturnType<typeof createClient>,
  userId: string,
  lesson: any,
  values: Record<string, unknown>
) => {
  const existing = await admin
    .from(TABLES.lessonProgress)
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lesson.id)
    .maybeSingle()
  if (existing.error) throw existing.error
  const payload = {
    ...existing.data,
    user_id: userId,
    lesson_id: lesson.id,
    module_id: lesson.module_id,
    ...values,
  }
  if (values.quiz_attempts && existing.data?.quiz_attempts) {
    payload.quiz_attempts = Number(existing.data.quiz_attempts || 0) + Number(values.quiz_attempts || 0)
  }
  const { data, error } = await admin
    .from(TABLES.lessonProgress)
    .upsert(payload, { onConflict: 'user_id,lesson_id' })
    .select('*')
    .single()
  if (error) throw error
  return data
}

const normalizeTier = (value: unknown) => String(value || 'free').toLowerCase()
const hasTierAccess = (userTier: unknown, requiredTier: unknown) =>
  (TIER_RANK[normalizeTier(userTier)] || 0) >= (TIER_RANK[normalizeTier(requiredTier)] || 0)

const serializeCertificationType = (record: any) => ({
  id: record.id,
  title: record.title,
  description: record.description,
  requirements: safeJsonParse(record.requirements, []),
  estimated_time: record.estimated_time,
  skills_validated: safeJsonParse(record.skills_validated, []),
  access_tier: record.access_tier || 'free',
  is_premium: Boolean(record.is_premium),
  updated_at: record.updated_at,
})

const evaluateCertificationReadiness = (certType: any, assessment: any, completedModules: number) => {
  const reasons: string[] = []
  if (certType.id === 'ai-fundamentals') {
    if (!assessment) reasons.push('Complete the AI readiness assessment to unlock this certificate.')
  } else if (certType.id === 'litmusai-professional') {
    if (!assessment || Number(assessment.percentage || 0) < 70) reasons.push('Score at least 70% on the AI readiness assessment.')
    if (completedModules < 3) reasons.push('Complete at least 3 training modules before applying.')
  } else if (certType.id === 'ai-ethics-specialist') {
    const ethics = safeJsonParse(assessment?.domain_scores, {})['Ethics & Critical Thinking']?.score || assessment?.rhetorical_score || 0
    if (ethics < 3) reasons.push('Increase your Ethics & Critical Thinking score to 3 or higher.')
    if (completedModules < 2) reasons.push('Complete at least 2 training modules to demonstrate applied practice.')
  }
  return { eligible: reasons.length === 0, reasons }
}

const generateVerificationCode = () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
}

const serializeAwardedCertification = (certification: any, certType?: any) => ({
  catalog_id: certification.catalog_id,
  certification_type: certification.certification_type,
  verification_code: certification.verification_code,
  issued_at: certification.issued_at,
  expires_at: certification.expires_at,
  skills_validated: parseJsonArray(certification.skills_validated).length
    ? parseJsonArray(certification.skills_validated)
    : certType
      ? parseJsonArray(certType.skills_validated)
      : [],
})

const handleCertification = async (ctx: ApiContext) => {
  if (ctx.routePath === '/api/certification/available' && ctx.req.method === 'GET') {
    const auth = await requireAuth(ctx, false)
    const currentTier = normalizeTier(auth?.profile?.subscription_tier)
    const certs = await ctx.admin.from(TABLES.certificationType).select('*').order('title')
    if (certs.error) throw certs.error
    let latestAssessment: any = null
    let completedModules = 0
    if (auth?.userId) {
      const latest = await ctx.admin
        .from(TABLES.assessmentResult)
        .select('*')
        .eq('user_id', auth.userId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (latest.error) throw latest.error
      latestAssessment = latest.data
      const progress = await ctx.admin
        .from(TABLES.userProgress)
        .select('id')
        .eq('user_id', auth.userId)
        .eq('status', 'completed')
      if (progress.error) throw progress.error
      completedModules = progress.data?.length || 0
    }
    const certifications = (certs.data || []).map((record: any) => {
      const serialized = serializeCertificationType(record)
      const requiredTier = record.access_tier || (record.is_premium ? 'professional' : 'free')
      const readiness = auth?.userId
        ? evaluateCertificationReadiness(record, latestAssessment, completedModules)
        : { eligible: false, reasons: ['Sign in to evaluate your certification readiness.'] }
      const upgradeRequired = !hasTierAccess(currentTier, requiredTier)
      const missingRequirements = [...readiness.reasons]
      if (upgradeRequired) missingRequirements.push(`Upgrade to ${requiredTier} to unlock this certification.`)
      return {
        ...serialized,
        required_tier: requiredTier,
        current_tier: currentTier,
        upgrade_required: upgradeRequired,
        eligible: readiness.eligible && !upgradeRequired,
        missing_requirements: missingRequirements,
      }
    })
    return jsonResponse(ctx.req, {
      certifications,
      ...(certifications.length ? {} : { message: 'No certification catalog configured. Seed certification types in Supabase.' }),
    })
  }

  if (ctx.routePath === '/api/certification/earned' && ctx.req.method === 'GET') {
    const auth = await requireAuth(ctx)
    const { data, error } = await ctx.admin
      .from(TABLES.certification)
      .select('*')
      .eq('user_id', auth!.userId)
      .order('issued_at', { ascending: false })
    if (error) throw error
    const catalogIds = Array.from(new Set((data || []).map((certification: any) => certification.catalog_id).filter(Boolean)))
    const catalogResult = catalogIds.length
      ? await ctx.admin.from(TABLES.certificationType).select('*').in('id', catalogIds)
      : { data: [], error: null }
    if (catalogResult.error) throw catalogResult.error
    const catalogById = new Map((catalogResult.data || []).map((catalog: any) => [catalog.id, catalog]))
    const certifications = (data || []).map((certification: any) => ({
      id: certification.id,
      catalog_id: certification.catalog_id,
      certification_type: certification.certification_type,
      verification_code: certification.verification_code,
      issued_at: certification.issued_at,
      expires_at: certification.expires_at,
      is_valid: certification.is_valid,
      badge_url: certification.badge_url,
      skills_validated: parseJsonArray(certification.skills_validated).length
        ? parseJsonArray(certification.skills_validated)
        : parseJsonArray(catalogById.get(certification.catalog_id)?.skills_validated),
      access_tier: catalogById.get(certification.catalog_id)?.access_tier || null,
    }))
    return jsonResponse(ctx.req, { certifications })
  }

  const verifyMatch = ctx.routePath.match(/^\/api\/certification\/verify\/([^/]+)$/)
  if (verifyMatch && ctx.req.method === 'GET') {
    const code = decodePathPart(verifyMatch[1])
    const { data, error } = await ctx.admin
      .from(TABLES.certification)
      .select('*')
      .eq('verification_code', code)
      .maybeSingle()
    if (error) throw error
    if (!data) return jsonResponse(ctx.req, { valid: false, message: 'Certification not found or invalid' }, 404)
    const userResult = await ctx.admin.from(TABLES.user).select('first_name,last_name').eq('id', data.user_id).maybeSingle()
    if (userResult.error) throw userResult.error
    const catalogResult = data.catalog_id
      ? await ctx.admin.from(TABLES.certificationType).select('*').eq('id', data.catalog_id).maybeSingle()
      : { data: null, error: null }
    if (catalogResult.error) throw catalogResult.error
    return jsonResponse(ctx.req, {
      valid: true,
      certification: {
        certification_type: data.certification_type,
        catalog_id: data.catalog_id,
        holder_name: `${userResult.data?.first_name || ''} ${userResult.data?.last_name || ''}`.trim(),
        issued_at: data.issued_at,
        expires_at: data.expires_at,
        skills_validated: parseJsonArray(data.skills_validated).length
          ? parseJsonArray(data.skills_validated)
          : parseJsonArray(catalogResult.data?.skills_validated),
        access_tier: catalogResult.data?.access_tier || null,
        is_valid: data.is_valid,
      },
    })
  }

  const applyMatch = ctx.routePath.match(/^\/api\/certification\/apply\/([^/]+)$/)
  if (applyMatch && ctx.req.method === 'POST') {
    const auth = await requireAuth(ctx)
    const certificationId = decodePathPart(applyMatch[1])
    const certType = await ctx.admin.from(TABLES.certificationType).select('*').eq('id', certificationId).maybeSingle()
    if (certType.error) throw certType.error
    if (!certType.data) return errorResponse(ctx.req, 'Certification not found', 404)
    const requiredTier = certType.data.access_tier || (certType.data.is_premium ? 'professional' : 'free')
    const userTier = normalizeTier(auth!.profile.subscription_tier)
    if (!hasTierAccess(userTier, requiredTier)) {
      return jsonResponse(ctx.req, {
        error: 'upgrade_required',
        message: `${certType.data.title} is available to ${requiredTier} plans. Upgrade your subscription to continue.`,
        required_tier: requiredTier,
        current_tier: userTier,
      }, 403)
    }

    const existing = await ctx.admin
      .from(TABLES.certification)
      .select('*')
      .eq('user_id', auth!.userId)
      .eq('catalog_id', certType.data.id)
      .order('issued_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (existing.error) throw existing.error
    if (existing.data) {
      return jsonResponse(ctx.req, {
        status: 'already_issued',
        message: 'Certification already granted for this user.',
        certification: serializeAwardedCertification(existing.data, certType.data),
      })
    }

    const latest = await ctx.admin
      .from(TABLES.assessmentResult)
      .select('*')
      .eq('user_id', auth!.userId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (latest.error) throw latest.error
    const completed = await ctx.admin
      .from(TABLES.userProgress)
      .select('id')
      .eq('user_id', auth!.userId)
      .eq('status', 'completed')
    if (completed.error) throw completed.error
    const readiness = evaluateCertificationReadiness(certType.data, latest.data, completed.data?.length || 0)
    if (!readiness.eligible) {
      return jsonResponse(ctx.req, {
        message: 'Certification requirements not met yet.',
        status: 'requirements_not_met',
        missing_requirements: readiness.reasons,
      }, 422)
    }

    const issuedAt = new Date()
    const expiresAt = certType.data.is_premium ? new Date(issuedAt.getTime() + 730 * 24 * 60 * 60 * 1000).toISOString() : null
    const { data, error } = await ctx.admin
      .from(TABLES.certification)
      .insert({
        user_id: auth!.userId,
        certification_type: certType.data.title,
        catalog_id: certType.data.id,
        verification_code: generateVerificationCode(),
        issued_at: issuedAt.toISOString(),
        expires_at: expiresAt,
        skills_validated: JSON.stringify(parseJsonArray(certType.data.skills_validated)),
      })
      .select('*')
      .single()
    if (error) throw error
    return jsonResponse(ctx.req, {
      status: 'issued',
      message: 'Certification granted successfully',
      certification: serializeAwardedCertification(data, certType.data),
    }, 201)
  }

  return null
}

const mockModeEnabled = () => {
  if (truthy(env('STRIPE_MOCK_MODE'))) return true
  if (truthy(env('DISABLE_STRIPE_AUTO_MOCK'))) return false
  return !env('STRIPE_SECRET_KEY') && !['production', 'prod'].includes(env('ENVIRONMENT', env('APP_ENV')).toLowerCase())
}

const normalizePlanId = (value: unknown): keyof typeof PLAN_DEFINITIONS => {
  const normalized = String(value || 'free').trim().toLowerCase()
  return PLAN_ALIAS[normalized] || (normalized in PLAN_DEFINITIONS ? (normalized as keyof typeof PLAN_DEFINITIONS) : 'free')
}

const planConfig = (planId: keyof typeof PLAN_DEFINITIONS) => {
  const definition = PLAN_DEFINITIONS[planId]
  const priceEnv = 'stripe_price_env' in definition ? definition.stripe_price_env : ''
  const priceId = priceEnv ? env(priceEnv) : ''
  const stripeSecret = env('STRIPE_SECRET_KEY')
  const amountCents = 'amount_cents' in definition ? definition.amount_cents : null
  const configured = Boolean(stripeSecret) && (amountCents !== null || Boolean(priceId))
  return { definition, priceId, stripeSecret, amountCents, configured }
}

const serializePlan = (planId: keyof typeof PLAN_DEFINITIONS, mockMode: boolean) => {
  const config = planConfig(planId)
  const definition = config.definition
  const priceEnv = 'stripe_price_env' in definition ? definition.stripe_price_env : ''
  const checkoutEnabled = (config.configured || mockMode) && (!priceEnv || Boolean(config.priceId || config.amountCents))
  let statusMessage: string | null = null
  if (priceEnv && !config.configured) {
    statusMessage = mockMode
      ? 'Stripe not configured. Using sandbox checkout flow.'
      : !env('STRIPE_SECRET_KEY')
        ? 'Stripe secret key is missing. Set STRIPE_SECRET_KEY to enable checkout.'
        : 'Using on-the-fly Stripe price data based on plan amount.'
  }
  return {
    id: planId,
    name: definition.name,
    description: definition.description,
    amount: definition.amount_cents / 100,
    currency: definition.currency,
    billing_interval: 'billing_interval' in definition ? definition.billing_interval : 'month',
    features: definition.features,
    cta: definition.cta,
    is_free: Boolean('is_free' in definition && definition.is_free),
    configured: config.configured,
    checkout_enabled: checkoutEnabled,
    status_message: statusMessage,
  }
}

const subscriptionPayloadFromUser = (user: any) => {
  const planId = normalizePlanId(user.subscription_tier)
  const definition = PLAN_DEFINITIONS[planId]
  const amountCents = definition.amount_cents || 0
  const hasSubscription = planId !== 'free' && Boolean(user.stripe_subscription_id || user.stripe_customer_id || user.subscription_status)
  return {
    has_subscription: hasSubscription,
    plan: planId,
    status: hasSubscription ? user.subscription_status : null,
    amount: amountCents / 100,
    interval: 'billing_interval' in definition ? definition.billing_interval : 'month',
    customer_id: user.stripe_customer_id,
    subscription_id: user.stripe_subscription_id,
  }
}

const stripeRequest = async (path: string, init: RequestInit = {}) => {
  const stripeSecret = env('STRIPE_SECRET_KEY')
  if (!stripeSecret) throw new Error('Stripe is not configured')
  const response = await fetch(`https://api.stripe.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${stripeSecret}`,
      'Stripe-Version': '2026-02-25.clover',
      ...(init.body instanceof URLSearchParams ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      ...(init.headers || {}),
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body?.error?.message || `Stripe request failed with ${response.status}`)
  }
  return body
}

const syncUserSubscriptionFromStripe = async (admin: ReturnType<typeof createClient>, user: any, stripeSubscription: any, planHint?: string) => {
  const item = stripeSubscription?.items?.data?.[0] || {}
  const price = item.price || {}
  const recurring = price.recurring || {}
  const amountCents = Number(price.unit_amount || 0)
  const planId = normalizePlanId(planHint || (amountCents === 4900 ? 'premium' : amountCents === 9900 ? 'enterprise' : 'free'))
  const { data, error } = await admin
    .from(TABLES.user)
    .update({
      subscription_status: stripeSubscription.status,
      subscription_tier: planId,
      stripe_subscription_id: stripeSubscription.id || user.stripe_subscription_id,
      stripe_customer_id: stripeSubscription.customer || user.stripe_customer_id,
      updated_at: nowIso(),
    })
    .eq('id', user.id)
    .select('*')
    .single()
  if (error) throw error
  return {
    has_subscription: true,
    plan: planId,
    status: stripeSubscription.status,
    amount: amountCents / 100,
    interval: recurring.interval || 'month',
    customer_id: data.stripe_customer_id,
    subscription_id: data.stripe_subscription_id,
  }
}

const getFrontendUrl = () => env('FRONTEND_URL', 'http://localhost:5173')
const resolveFrontendUrl = (path: string) => `${stripTrailingSlash(getFrontendUrl())}${path.startsWith('/') ? path : `/${path}`}`

const sanitizeFrontendRedirectUrl = (requestedUrl: unknown, fallbackPath: string) => {
  const fallbackUrl = resolveFrontendUrl(fallbackPath)
  const rawUrl = String(requestedUrl || '').trim()
  if (!rawUrl) return fallbackUrl
  try {
    const requested = new URL(rawUrl)
    const frontend = new URL(getFrontendUrl())
    return requested.protocol === frontend.protocol && requested.host === frontend.host ? rawUrl : fallbackUrl
  } catch {
    return fallbackUrl
  }
}

const handleBilling = async (ctx: ApiContext) => {
  if (ctx.routePath === '/api/billing/config' && ctx.req.method === 'GET') {
    const mockMode = mockModeEnabled()
    return jsonResponse(ctx.req, {
      publishable_key: env('STRIPE_PUBLISHABLE_KEY'),
      plans: Object.keys(PLAN_DEFINITIONS).map((planId) => serializePlan(planId as keyof typeof PLAN_DEFINITIONS, mockMode)),
      mock_mode: mockMode,
    })
  }

  if (ctx.routePath === '/api/billing/subscription' && ctx.req.method === 'GET') {
    const auth = await requireAuth(ctx)
    if (!mockModeEnabled() && env('STRIPE_SECRET_KEY') && auth!.profile.stripe_subscription_id) {
      try {
        const stripeSubscription = await stripeRequest(`/v1/subscriptions/${auth!.profile.stripe_subscription_id}`)
        return jsonResponse(ctx.req, await syncUserSubscriptionFromStripe(ctx.admin, auth!.profile, stripeSubscription))
      } catch {
        return jsonResponse(ctx.req, subscriptionPayloadFromUser(auth!.profile))
      }
    }
    return jsonResponse(ctx.req, subscriptionPayloadFromUser(auth!.profile))
  }

  if (ctx.routePath === '/api/billing/checkout-session' && ctx.req.method === 'POST') {
    const auth = await requireAuth(ctx)
    const body = (await readJsonBody(ctx.req)) || {}
    const planId = normalizePlanId(body.plan)
    const config = planConfig(planId)
    if ('is_free' in config.definition && config.definition.is_free) {
      return errorResponse(ctx.req, 'Free plan does not require checkout', 400)
    }
    if (!config.configured && !mockModeEnabled()) return errorResponse(ctx.req, 'Stripe is not fully configured for this plan', 503)
    const email = String(auth!.profile.email || auth!.authUser.email || '').trim().toLowerCase()
    if (!email) return errorResponse(ctx.req, 'Verified account email is required to start checkout', 400)
    const successUrl = sanitizeFrontendRedirectUrl(body.success_url, '/billing?success=true')
    const cancelUrl = sanitizeFrontendRedirectUrl(body.cancel_url, '/billing?canceled=true')

    if (mockModeEnabled()) {
      return jsonResponse(ctx.req, { url: `${successUrl}&mock_checkout=true` })
    }

    const form = new URLSearchParams()
    form.set('mode', 'subscription')
    form.set('payment_method_types[0]', 'card')
    form.set('line_items[0][quantity]', '1')
    if (config.priceId) {
      form.set('line_items[0][price]', config.priceId)
    } else {
      form.set('line_items[0][price_data][currency]', config.definition.currency)
      form.set('line_items[0][price_data][product_data][name]', config.definition.name)
      form.set('line_items[0][price_data][product_data][description]', config.definition.description)
      form.set('line_items[0][price_data][unit_amount]', String(config.amountCents))
      form.set('line_items[0][price_data][recurring][interval]', 'billing_interval' in config.definition ? config.definition.billing_interval : 'month')
    }
    form.set('success_url', `${successUrl}&session_id={CHECKOUT_SESSION_ID}`)
    form.set('cancel_url', cancelUrl)
    form.set('metadata[user_id]', auth!.userId)
    form.set('metadata[plan_id]', planId)
    form.set('metadata[email]', email)
    if (auth!.profile.stripe_customer_id) form.set('customer', auth!.profile.stripe_customer_id)
    else form.set('customer_email', email)

    const session = await stripeRequest('/v1/checkout/sessions', { method: 'POST', body: form })
    return jsonResponse(ctx.req, { url: session.url })
  }

  if (ctx.routePath === '/api/billing/checkout-session/complete' && ctx.req.method === 'POST') {
    const auth = await requireAuth(ctx)
    const body = (await readJsonBody(ctx.req)) || {}
    const sessionId = String(body.session_id || '').trim()
    if (!sessionId) return errorResponse(ctx.req, 'session_id is required', 400)
    const session = await stripeRequest(`/v1/checkout/sessions/${sessionId}?expand[]=subscription`)
    const metadata = session.metadata || {}
    const belongsToUser =
      metadata.user_id === auth!.userId ||
      String(metadata.email || session.customer_email || session.customer_details?.email || '').toLowerCase() === String(auth!.profile.email || '').toLowerCase()
    if (!belongsToUser) return errorResponse(ctx.req, 'Checkout session does not belong to the authenticated user', 403)
    if (!session.subscription || typeof session.subscription !== 'object') {
      return errorResponse(ctx.req, 'Checkout session did not include a Stripe subscription', 400)
    }
    if (session.customer) {
      auth!.profile.stripe_customer_id = session.customer
    }
    return jsonResponse(ctx.req, await syncUserSubscriptionFromStripe(ctx.admin, auth!.profile, session.subscription, metadata.plan_id))
  }

  if (ctx.routePath === '/api/billing/customer-portal' && ctx.req.method === 'POST') {
    const auth = await requireAuth(ctx)
    if (!auth!.profile.stripe_customer_id) return errorResponse(ctx.req, 'No active subscription customer found', 404)
    const body = (await readJsonBody(ctx.req)) || {}
    const returnUrl = sanitizeFrontendRedirectUrl(body.return_url, '/billing')
    if (mockModeEnabled()) return jsonResponse(ctx.req, { url: `${returnUrl}?portal=mock` })
    const form = new URLSearchParams()
    form.set('customer', auth!.profile.stripe_customer_id)
    form.set('return_url', returnUrl)
    const session = await stripeRequest('/v1/billing_portal/sessions', { method: 'POST', body: form })
    return jsonResponse(ctx.req, { url: session.url })
  }

  if (ctx.routePath === '/api/billing/webhooks/stripe' && ctx.req.method === 'POST') {
    const rawBody = await ctx.req.text()
    const signature = ctx.req.headers.get('stripe-signature') || ''
    const verified = await verifyStripeWebhook(rawBody, signature, env('STRIPE_WEBHOOK_SECRET'))
    if (!verified) return errorResponse(ctx.req, 'Webhook Error: invalid Stripe signature', 400)
    const event = JSON.parse(rawBody)
    const object = event?.data?.object || {}
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(ctx.admin, object)
    } else if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      await handleSubscriptionUpdated(ctx.admin, object)
    } else if (event.type === 'customer.subscription.deleted') {
      await handleSubscriptionDeleted(ctx.admin, object)
    }
    return jsonResponse(ctx.req, { received: true })
  }

  return null
}

const hex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')

const verifyStripeWebhook = async (payload: string, signatureHeader: string, secret: string) => {
  if (!secret || !signatureHeader) return false
  const parts = Object.fromEntries(signatureHeader.split(',').map((part) => {
    const [key, value] = part.split('=')
    return [key, value]
  }))
  const timestamp = parts.t
  const expected = parts.v1
  if (!timestamp || !expected) return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`)))
  return signature.length === expected.length && signature === expected
}

const findUserForCheckoutSession = async (admin: ReturnType<typeof createClient>, checkoutSession: any) => {
  const metadata = checkoutSession.metadata || {}
  if (metadata.user_id) {
    const byId = await admin.from(TABLES.user).select('*').eq('id', metadata.user_id).maybeSingle()
    if (byId.error) throw byId.error
    if (byId.data) return byId.data
  }
  const email = String(metadata.email || checkoutSession.customer_email || checkoutSession.customer_details?.email || '').toLowerCase()
  if (!email) return null
  const byEmail = await admin.from(TABLES.user).select('*').eq('email', email).maybeSingle()
  if (byEmail.error) throw byEmail.error
  return byEmail.data
}

const handleCheckoutCompleted = async (admin: ReturnType<typeof createClient>, checkoutSession: any) => {
  const user = await findUserForCheckoutSession(admin, checkoutSession)
  if (!user) return
  let subscription = checkoutSession.subscription
  if (typeof subscription === 'string') {
    subscription = await stripeRequest(`/v1/subscriptions/${subscription}`)
  }
  if (subscription && typeof subscription === 'object') {
    user.stripe_customer_id = checkoutSession.customer || user.stripe_customer_id
    await syncUserSubscriptionFromStripe(admin, user, subscription, checkoutSession.metadata?.plan_id)
  }
}

const handleSubscriptionUpdated = async (admin: ReturnType<typeof createClient>, stripeSubscription: any) => {
  const bySubscription = stripeSubscription.id
    ? await admin.from(TABLES.user).select('*').eq('stripe_subscription_id', stripeSubscription.id).maybeSingle()
    : { data: null, error: null }
  if (bySubscription.error) throw bySubscription.error
  const user = bySubscription.data || (
    stripeSubscription.customer
      ? (await admin.from(TABLES.user).select('*').eq('stripe_customer_id', stripeSubscription.customer).maybeSingle()).data
      : null
  )
  if (user) await syncUserSubscriptionFromStripe(admin, user, stripeSubscription)
}

const handleSubscriptionDeleted = async (admin: ReturnType<typeof createClient>, stripeSubscription: any) => {
  const userResult = stripeSubscription.id
    ? await admin.from(TABLES.user).select('*').eq('stripe_subscription_id', stripeSubscription.id).maybeSingle()
    : { data: null, error: null }
  if (userResult.error) throw userResult.error
  if (!userResult.data) return
  const { error } = await admin
    .from(TABLES.user)
    .update({
      subscription_tier: 'free',
      subscription_status: 'canceled',
      stripe_customer_id: stripeSubscription.customer || userResult.data.stripe_customer_id,
      stripe_subscription_id: stripeSubscription.id || userResult.data.stripe_subscription_id,
      updated_at: nowIso(),
    })
    .eq('id', userResult.data.id)
  if (error) throw error
}

const routeRequest = async (ctx: ApiContext) => {
  if (ctx.routePath === '/api/health' && ctx.req.method === 'GET') {
    return jsonResponse(ctx.req, { status: 'healthy', timestamp: nowIso(), runtime: 'supabase-edge' })
  }

  const handlers = [
    handleAuth,
    handleAssessment,
    handleTraining,
    handleCourse,
    handleCertification,
    handleBilling,
  ]

  for (const handler of handlers) {
    const response = await handler(ctx)
    if (response) return response
  }

  return errorResponse(ctx.req, `No route for ${ctx.req.method} ${ctx.routePath}`, 404)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders(req) })
  }

  const url = new URL(req.url)
  const ctx: ApiContext = {
    admin: getAdminClient(),
    req,
    url,
    routePath: normalizeRoutePath(url),
  }

  try {
    return await routeRequest(ctx)
  } catch (error) {
    if (error instanceof Response) {
      const body = await error.text()
      return new Response(body, {
        status: error.status,
        headers: {
          ...corsHeaders(req),
          'Content-Type': 'application/json',
        },
      })
    }

    console.error('platform-api failed', error)
    return errorResponse(req, 'Internal server error', 500, {
      details: error instanceof Error ? error.message : String(error),
    })
  }
})
