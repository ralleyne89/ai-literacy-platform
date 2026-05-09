#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const OPENROUTER_DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1'
const DEFAULT_MODELS = [
  'openai/gpt-4o-mini',
  'openai/gpt-5-nano',
  'openai/gpt-5-mini',
  'deepseek/deepseek-v4-flash',
  'qwen/qwen3-235b-a22b-2507',
]
const ASSESSMENT_LEVELS = ['beginner', 'intermediate', 'advanced']
const DOMAINS = [
  'AI Fundamentals',
  'Practical Usage',
  'Ethics & Critical Thinking',
  'AI Impact & Applications',
  'Strategic Understanding',
]
const QUESTIONS_PER_DOMAIN = 3
const LEVEL_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}
const LEVEL_GUIDANCE = {
  beginner: 'Use plain-language concepts, common workplace scenarios, and avoid jargon-heavy traps.',
  intermediate: 'Use applied workplace scenarios that require tradeoff reasoning and responsible-use judgment.',
  advanced: 'Use strategic, governance, evaluation, and implementation scenarios with nuanced distractors.',
}
const QUESTION_COUNT = DOMAINS.length * QUESTIONS_PER_DOMAIN
const WORKPLACE_TERMS = [
  'business',
  'client',
  'company',
  'customer',
  'employee',
  'manager',
  'organization',
  'policy',
  'project',
  'stakeholder',
  'team',
  'vendor',
  'workflow',
  'workplace',
]
const ADVANCED_TERMS = [
  'audit',
  'benchmark',
  'compliance',
  'evaluation',
  'governance',
  'implementation',
  'model drift',
  'monitoring',
  'policy',
  'risk',
  'strategy',
  'vendor',
]

const openRouterQuestionSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    questions: {
      type: 'array',
      minItems: QUESTION_COUNT,
      maxItems: QUESTION_COUNT,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          domain: { type: 'string', enum: DOMAINS },
          question_text: { type: 'string', minLength: 24 },
          option_a: { type: 'string', minLength: 1 },
          option_b: { type: 'string', minLength: 1 },
          option_c: { type: 'string', minLength: 1 },
          option_d: { type: 'string', minLength: 1 },
          correct_answer: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
          explanation: { type: 'string', minLength: 12 },
        },
        required: [
          'domain',
          'question_text',
          'option_a',
          'option_b',
          'option_c',
          'option_d',
          'correct_answer',
          'explanation',
        ],
      },
    },
  },
  required: ['questions'],
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const text = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) {
      continue
    }
    const index = line.indexOf('=')
    const key = line.slice(0, index).trim()
    let value = line.slice(index + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function loadLocalEnv() {
  for (const file of ['.env.local', '.env']) {
    loadEnvFile(path.resolve(process.cwd(), file))
  }
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    write: true,
    levels: ASSESSMENT_LEVELS,
    models: DEFAULT_MODELS,
    out: '',
  }

  for (const arg of argv) {
    if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--no-write') {
      options.write = false
    } else if (arg.startsWith('--models=')) {
      options.models = splitCsv(arg.slice('--models='.length))
    } else if (arg.startsWith('--levels=')) {
      const levels = splitCsv(arg.slice('--levels='.length))
      const invalid = levels.filter((level) => !ASSESSMENT_LEVELS.includes(level))
      if (invalid.length) {
        throw new Error(`Invalid levels: ${invalid.join(', ')}`)
      }
      options.levels = levels
    } else if (arg.startsWith('--out=')) {
      options.out = arg.slice('--out='.length).trim()
    } else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (!options.models.length) {
    throw new Error('At least one model is required.')
  }
  if (!options.levels.length) {
    throw new Error('At least one assessment level is required.')
  }

  return options
}

function splitCsv(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function printHelp() {
  console.log(`Usage: node scripts/evaluate-openrouter-assessment-models.mjs [options]

Options:
  --dry-run            Verify env and OpenRouter model metadata without generating questions.
  --models=a,b,c       Comma-separated OpenRouter model IDs.
  --levels=a,b,c       Comma-separated levels: beginner, intermediate, advanced.
  --out=path           Report output path. Defaults to docs/model-evals/<timestamp>.json.
  --no-write           Do not write a JSON report.
  --help               Show this help.
`)
}

function buildPrompt(assessmentLevel) {
  return [
    `Generate exactly ${QUESTION_COUNT} ${LEVEL_LABELS[assessmentLevel].toLowerCase()} AI literacy assessment questions.`,
    LEVEL_GUIDANCE[assessmentLevel],
    `Use exactly these domains: ${DOMAINS.join('; ')}.`,
    `Create exactly ${QUESTIONS_PER_DOMAIN} questions per domain.`,
    'Every question needs four plausible options, exactly one correct answer, and a brief explanation.',
    'Keep wording practical for adult workplace learners and do not repeat the same scenario.',
    'Return JSON only with this shape: {"questions":[{"domain":"AI Fundamentals","question_text":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_answer":"A","explanation":"..."}]}.',
  ].join(' ')
}

async function getOpenRouterModels(baseUrl) {
  const response = await fetch(`${baseUrl}/models`)
  if (!response.ok) {
    throw new Error(`OpenRouter model metadata failed with ${response.status}`)
  }
  const data = await response.json()
  return new Map((data.data || []).map((model) => [model.id, model]))
}

function metadataSummary(model) {
  const pricing = model?.pricing || {}
  return {
    id: model?.id,
    name: model?.name,
    context_length: model?.context_length,
    input_per_million_tokens: toPerMillion(pricing.prompt),
    output_per_million_tokens: toPerMillion(pricing.completion),
    supported_parameters: model?.supported_parameters || [],
  }
}

function toPerMillion(value) {
  const numeric = Number(value || 0)
  return Number.isFinite(numeric) ? Number((numeric * 1_000_000).toFixed(6)) : null
}

async function runGeneration({ apiKey, baseUrl, model, level, metadata }) {
  const supported = metadata.supported_parameters || []
  const body = {
    model,
    stream: false,
    messages: [
      {
        role: 'system',
        content:
          'You create fair, workplace-oriented AI literacy multiple-choice assessments. Return only JSON that matches the provided schema.',
      },
      {
        role: 'user',
        content: buildPrompt(level),
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'assessment_question_set',
        strict: true,
        schema: openRouterQuestionSchema,
      },
    },
  }

  if (supported.includes('max_completion_tokens')) {
    body.max_completion_tokens = 4500
  } else if (supported.includes('max_tokens')) {
    body.max_tokens = 4500
  }
  if (supported.includes('temperature')) {
    body.temperature = 0.35
  }

  const startedAt = Date.now()
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost/ai-literacy-platform',
      'X-OpenRouter-Title': 'AI Literacy Platform model evaluation',
    },
    body: JSON.stringify(body),
  })
  const elapsed_ms = Date.now() - startedAt
  const responseText = await response.text()

  if (!response.ok) {
    return {
      model,
      level,
      ok: false,
      elapsed_ms,
      error: `HTTP ${response.status}`,
      response_preview: responseText.slice(0, 500),
    }
  }

  let data
  try {
    data = JSON.parse(responseText)
  } catch (error) {
    return {
      model,
      level,
      ok: false,
      elapsed_ms,
      error: `Invalid OpenRouter response JSON: ${error.message}`,
      response_preview: responseText.slice(0, 500),
    }
  }

  const content = data?.choices?.[0]?.message?.content
  const parsed = parseOpenRouterContent(content)
  const questions = sanitizeGeneratedQuestions(parsed?.questions, level)
  const score = scoreQuestions(questions, level)

  return {
    model,
    level,
    ok: Boolean(questions.length),
    elapsed_ms,
    finish_reason: data?.choices?.[0]?.finish_reason || null,
    native_finish_reason: data?.choices?.[0]?.native_finish_reason || null,
    usage: data?.usage || null,
    score,
    sample_question: questions[0]
      ? {
          domain: questions[0].domain,
          question_text: questions[0].question_text,
          correct_answer: questions[0].correct_answer,
          explanation: questions[0].explanation,
        }
      : null,
    validation: {
      parsed_json: Boolean(parsed),
      accepted_questions: questions.length,
      expected_questions: QUESTION_COUNT,
    },
  }
}

function parseOpenRouterContent(value) {
  if (!value) {
    return null
  }
  if (typeof value === 'object') {
    return value
  }
  if (typeof value !== 'string') {
    return null
  }
  try {
    return JSON.parse(value)
  } catch {
    const match = value.match(/\{[\s\S]*\}/)
    if (!match) {
      return null
    }
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

function sanitizeGeneratedQuestions(value, assessmentLevel) {
  if (!Array.isArray(value) || value.length !== QUESTION_COUNT) {
    return []
  }
  const counts = Object.fromEntries(DOMAINS.map((domain) => [domain, 0]))
  const questions = []

  for (const raw of value) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return []
    }
    const domain = normalizeDomainName(raw.domain)
    const correctAnswer = String(raw.correct_answer || '').trim().toUpperCase()
    const sanitized = {
      id: '',
      domain,
      question_text: String(raw.question_text || '').trim(),
      option_a: String(raw.option_a || '').trim(),
      option_b: String(raw.option_b || '').trim(),
      option_c: String(raw.option_c || '').trim(),
      option_d: String(raw.option_d || '').trim(),
      correct_answer: correctAnswer,
      explanation: String(raw.explanation || '').trim(),
    }
    const optionValues = [sanitized.option_a, sanitized.option_b, sanitized.option_c, sanitized.option_d]
    const uniqueOptionValues = new Set(optionValues.map((option) => option.toLowerCase()))
    if (
      !domain ||
      !sanitized.question_text ||
      optionValues.some((option) => !option) ||
      uniqueOptionValues.size !== optionValues.length ||
      !['A', 'B', 'C', 'D'].includes(correctAnswer) ||
      !sanitized.explanation
    ) {
      return []
    }
    counts[domain] += 1
    sanitized.id = `eval-${assessmentLevel}-${domainSlug(domain)}-${counts[domain]}`
    questions.push(sanitized)
  }

  return DOMAINS.every((domain) => counts[domain] === QUESTIONS_PER_DOMAIN) ? questions : []
}

function normalizeDomainName(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return DOMAINS.find((domain) => domain.toLowerCase() === normalized) || ''
}

function domainSlug(domain) {
  return domain.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function scoreQuestions(questions, level) {
  if (!questions.length) {
    return {
      total: 0,
      structural: 0,
      diversity: 0,
      level_fit: 0,
      workplace_relevance: 0,
      notes: ['No valid question set accepted by sanitizer.'],
    }
  }

  const allText = questions
    .flatMap((question) => [
      question.question_text,
      question.option_a,
      question.option_b,
      question.option_c,
      question.option_d,
      question.explanation,
    ])
    .join(' ')
    .toLowerCase()
  const normalizedQuestions = questions.map((question) => normalizeForSimilarity(question.question_text))
  const uniqueQuestionCount = new Set(normalizedQuestions).size
  const explanationLengths = questions.map((question) => question.explanation.split(/\s+/).filter(Boolean).length)
  const strongExplanations = explanationLengths.filter((length) => length >= 8).length
  const workplaceHits = countHits(allText, WORKPLACE_TERMS)
  const advancedHits = countHits(allText, ADVANCED_TERMS)

  const structural = 40
  const diversity = Math.round(20 * (uniqueQuestionCount / questions.length))
  const workplace_relevance = Math.min(20, Math.round((workplaceHits / 10) * 20))
  const explanation_score = Math.round(10 * (strongExplanations / questions.length))
  let level_fit = 10
  const notes = []

  if (level === 'beginner' && advancedHits > 12) {
    level_fit -= 4
    notes.push('Beginner set may lean too advanced based on governance/evaluation terminology.')
  }
  if (level === 'advanced' && advancedHits < 8) {
    level_fit -= 4
    notes.push('Advanced set may need more governance, evaluation, or implementation depth.')
  }
  if (uniqueQuestionCount < questions.length) {
    notes.push('Repeated or near-repeated question stems detected.')
  }
  if (strongExplanations < questions.length) {
    notes.push('Some explanations are short.')
  }

  return {
    total: structural + diversity + workplace_relevance + explanation_score + Math.max(0, level_fit),
    structural,
    diversity,
    workplace_relevance,
    explanation_score,
    level_fit: Math.max(0, level_fit),
    notes,
  }
}

function normalizeForSimilarity(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(the|a|an|to|of|for|and|or|in|on|with|when|what|which|should)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function countHits(text, terms) {
  return terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0)
}

function summarize(results) {
  const byModel = new Map()
  for (const result of results) {
    if (!byModel.has(result.model)) {
      byModel.set(result.model, [])
    }
    byModel.get(result.model).push(result)
  }

  return [...byModel.entries()]
    .map(([model, modelResults]) => {
      const successful = modelResults.filter((result) => result.ok)
      const totalScore = successful.reduce((sum, result) => sum + result.score.total, 0)
      const totalMs = modelResults.reduce((sum, result) => sum + result.elapsed_ms, 0)
      const usage = modelResults.reduce(
        (acc, result) => {
          acc.prompt_tokens += Number(result.usage?.prompt_tokens || 0)
          acc.completion_tokens += Number(result.usage?.completion_tokens || 0)
          acc.total_tokens += Number(result.usage?.total_tokens || 0)
          acc.cost += Number(result.usage?.cost || 0)
          return acc
        },
        { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost: 0 },
      )

      return {
        model,
        success_rate: successful.length / modelResults.length,
        average_score: successful.length ? Math.round(totalScore / successful.length) : 0,
        average_elapsed_ms: Math.round(totalMs / modelResults.length),
        usage,
      }
    })
    .sort((a, b) => b.success_rate - a.success_rate || b.average_score - a.average_score)
}

function defaultOutputPath() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return path.join('docs', 'model-evals', `openrouter-assessment-${timestamp}.json`)
}

async function main() {
  loadLocalEnv()
  const options = parseArgs(process.argv.slice(2))
  const baseUrl = String(process.env.OPENROUTER_BASE_URL || OPENROUTER_DEFAULT_BASE_URL).replace(/\/$/, '')
  const apiKey = String(process.env.OPENROUTER_API_KEY || '').trim()
  const metadata = await getOpenRouterModels(baseUrl)
  const candidateModels = options.models.map((modelId) => ({
    requested_id: modelId,
    metadata: metadata.get(modelId) || null,
  }))
  const missingModels = candidateModels.filter((candidate) => !candidate.metadata)
  const runnableModels = candidateModels.filter((candidate) => candidate.metadata)

  const report = {
    generated_at: new Date().toISOString(),
    dry_run: options.dryRun,
    base_url: baseUrl,
    has_openrouter_key: Boolean(apiKey),
    levels: options.levels,
    candidates: candidateModels.map((candidate) => ({
      requested_id: candidate.requested_id,
      found: Boolean(candidate.metadata),
      metadata: candidate.metadata ? metadataSummary(candidate.metadata) : null,
      supports_json_schema: Boolean(candidate.metadata?.supported_parameters?.includes('structured_outputs')),
      supports_response_format: Boolean(candidate.metadata?.supported_parameters?.includes('response_format')),
    })),
    results: [],
    summary: [],
  }

  if (missingModels.length) {
    console.warn(`Skipping missing model IDs: ${missingModels.map((candidate) => candidate.requested_id).join(', ')}`)
  }

  if (options.dryRun || !apiKey) {
    if (!apiKey) {
      console.warn('OPENROUTER_API_KEY is not set. Live generations were not run.')
    }
    console.log(JSON.stringify(report, null, 2))
    return
  }

  for (const candidate of runnableModels) {
    for (const level of options.levels) {
      console.log(`Evaluating ${candidate.requested_id} at ${level} level...`)
      const result = await runGeneration({
        apiKey,
        baseUrl,
        model: candidate.requested_id,
        level,
        metadata: candidate.metadata,
      })
      report.results.push(result)
    }
  }

  report.summary = summarize(report.results)

  if (options.write) {
    const outputPath = options.out || defaultOutputPath()
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`)
    report.output_path = outputPath
  }

  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
