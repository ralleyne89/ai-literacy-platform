from flask import Blueprint, request, jsonify, g
from models import db, AssessmentResult, User, TrainingModule, UserProgress
from collections import Counter
import base64
import hashlib
import hmac
import json
import os
import random
import re
import time
import urllib.error
import urllib.request
import uuid
from routes import get_supabase_identity, supabase_jwt_required
from training_metadata import build_module_metadata
from logging_config import get_logger


logger = get_logger(__name__)

assessment_bp = Blueprint('assessment', __name__)

# Sample assessment questions - in production, these would be in the database
DOMAINS = [
    'AI Fundamentals',
    'Practical Usage',
    'Ethics & Critical Thinking',
    'AI Impact & Applications',
    'Strategic Understanding'
]

QUESTIONS_PER_DOMAIN = 3
ASSESSMENT_LEVELS = ('beginner', 'intermediate', 'advanced')
DEFAULT_ASSESSMENT_LEVEL = 'beginner'
LEVEL_DIFFICULTY_FLOORS = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3,
}
LEVEL_PROMPT_GUIDANCE = {
    'beginner': 'Use plain-language concepts, common workplace scenarios, and avoid jargon-heavy traps.',
    'intermediate': 'Use applied workplace scenarios that require tradeoff reasoning and responsible-use judgment.',
    'advanced': 'Use strategic, governance, evaluation, and implementation scenarios with nuanced distractors.',
}
OPENROUTER_DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1'
QUESTION_SET_TOKEN_TTL_SECONDS = 60 * 60 * 2

SAMPLE_QUESTIONS = [
    {
        "id": "1",
        "domain": "AI Fundamentals",
        "question_text": "What is the primary difference between AI and traditional software?",
        "option_a": "AI can learn and adapt from data",
        "option_b": "AI is faster than traditional software",
        "option_c": "AI uses more memory",
        "option_d": "AI is more expensive",
        "correct_answer": "A",
        "explanation": "Unlike traditional software, AI systems can learn from data and improve performance without explicit programming for every scenario."
    },
    {
        "id": "2",
        "domain": "AI Fundamentals",
        "question_text": "What does “machine learning” mean?",
        "option_a": "Teaching humans about machines",
        "option_b": "A type of AI that learns patterns from data",
        "option_c": "Programming robots to move",
        "option_d": "Computer maintenance procedures",
        "correct_answer": "B",
        "explanation": "Machine learning is a subset of AI focused on algorithms that learn patterns from data to make predictions or decisions."
    },
    {
        "id": "3",
        "domain": "AI Fundamentals",
        "question_text": "What causes AI “hallucinations”?",
        "option_a": "Hardware malfunctions",
        "option_b": "User input errors",
        "option_c": "The AI generating plausible but false information",
        "option_d": "Internet connectivity issues",
        "correct_answer": "C",
        "explanation": "Hallucinations happen when AI fills gaps with confident but incorrect information based on patterns it has learned."
    },
    {
        "id": "4",
        "domain": "Practical Usage",
        "question_text": "When writing a prompt for an AI tool, you should:",
        "option_a": "Be vague to let AI be creative",
        "option_b": "Be specific and clear about what you want",
        "option_c": "Use only technical jargon",
        "option_d": "Keep it to one word",
        "correct_answer": "B",
        "explanation": "Clear, specific prompts give AI models the context they need to produce accurate, useful outputs."
    },
    {
        "id": "5",
        "domain": "Practical Usage",
        "question_text": "What’s the best practice when using AI for research or work?",
        "option_a": "Accept all AI results without checking",
        "option_b": "Verify important information with reliable sources",
        "option_c": "Only use AI-generated sources",
        "option_d": "Never use AI for professional work",
        "correct_answer": "B",
        "explanation": "AI outputs should be validated, especially for critical work—treat them as a starting point, not the final answer."
    },
    {
        "id": "6",
        "domain": "Practical Usage",
        "question_text": "An AI tool gives you conflicting information on the same topic. You should:",
        "option_a": "Use the first response",
        "option_b": "Research the topic independently to verify",
        "option_c": "Choose the longer response",
        "option_d": "Ask the same question again",
        "correct_answer": "B",
        "explanation": "When AI responses conflict, cross-checking with trustworthy human-vetted sources ensures accuracy."
    },
    {
        "id": "7",
        "domain": "Ethics & Critical Thinking",
        "question_text": "What is “algorithmic bias”?",
        "option_a": "AI systems running slowly",
        "option_b": "AI systems making unfair decisions based on training data",
        "option_c": "Programming syntax errors",
        "option_d": "Hardware processing limitations",
        "correct_answer": "B",
        "explanation": "Algorithmic bias occurs when AI models inherit or amplify unfair patterns found in their training data."
    },
    {
        "id": "8",
        "domain": "Ethics & Critical Thinking",
        "question_text": "You notice an AI hiring tool consistently rejects qualified candidates from certain groups. This indicates:",
        "option_a": "The system is working efficiently",
        "option_b": "Potential discriminatory bias that needs investigation",
        "option_c": "Normal performance variation",
        "option_d": "Cost-saving optimization",
        "correct_answer": "B",
        "explanation": "Consistent rejection of specific groups is a warning sign of bias that requires immediate review and mitigation."
    },
    {
        "id": "9",
        "domain": "Ethics & Critical Thinking",
        "question_text": "Before trusting AI-generated content, you should:",
        "option_a": "Always trust it completely",
        "option_b": "Consider the source, context, and verify key facts",
        "option_c": "Only check if it looks suspicious",
        "option_d": "Never trust AI content",
        "correct_answer": "B",
        "explanation": "Evaluating source credibility and validating important details prevents misinformation from spreading."
    },
    {
        "id": "10",
        "domain": "AI Impact & Applications",
        "question_text": "Which task is current AI BEST suited for?",
        "option_a": "Providing emotional counseling",
        "option_b": "Recognizing patterns in large amounts of data",
        "option_c": "Making complex ethical decisions",
        "option_d": "Replacing all human judgment",
        "correct_answer": "B",
        "explanation": "AI excels at analyzing large datasets to surface patterns, trends, and insights quickly."
    },
    {
        "id": "11",
        "domain": "AI Impact & Applications",
        "question_text": "How is AI most likely to affect jobs in the next 5 years?",
        "option_a": "Eliminate all human jobs",
        "option_b": "Automate some tasks while creating new types of work",
        "option_c": "Only affect technology jobs",
        "option_d": "Have no impact on employment",
        "correct_answer": "B",
        "explanation": "AI will automate repetitive tasks but also create new opportunities that require human oversight and strategic thinking."
    },
    {
        "id": "12",
        "domain": "AI Impact & Applications",
        "question_text": "What’s a realistic expectation for AI tools today?",
        "option_a": "They can solve any business problem perfectly",
        "option_b": "They can assist with analysis and draft generation",
        "option_c": "They always provide 100% accurate information",
        "option_d": "They can replace human creativity entirely",
        "correct_answer": "B",
        "explanation": "Modern AI is a powerful assistant for analysis and content creation, but still requires human oversight."
    },
    {
        "id": "13",
        "domain": "Strategic Understanding",
        "question_text": "When should you choose NOT to use AI for a task?",
        "option_a": "When it costs money",
        "option_b": "When human empathy, ethics, or critical judgment are essential",
        "option_c": "When the technology is new",
        "option_d": "Never - AI should be used for everything",
        "correct_answer": "B",
        "explanation": "Tasks that depend on empathy, ethical nuance, or high-stakes judgment should remain human-led."
    },
    {
        "id": "14",
        "domain": "Strategic Understanding",
        "question_text": "What does successful human-AI collaboration look like?",
        "option_a": "Humans competing against AI",
        "option_b": "AI and humans complementing each other’s strengths",
        "option_c": "AI doing all the work",
        "option_d": "Humans avoiding AI entirely",
        "correct_answer": "B",
        "explanation": "The strongest outcomes happen when humans and AI combine strengths—strategy and creativity with speed and scale."
    },
    {
        "id": "15",
        "domain": "Strategic Understanding",
        "question_text": "You’re implementing AI in your organization. What’s most important?",
        "option_a": "Choosing the most expensive AI solution",
        "option_b": "Training employees and establishing ethical guidelines",
        "option_c": "Replacing as many human workers as possible",
        "option_d": "Focusing only on cost savings",
        "correct_answer": "B",
        "explanation": "Successful AI adoption depends on skilled people and clear ethical guardrails, not just technology investments."
    },
    {
        "id": "16",
        "domain": "AI Fundamentals",
        "question_text": "Which phrase best describes “training data” for AI models?",
        "option_a": "Data used to operate software without user input",
        "option_b": "Examples that teach the model patterns and relationships",
        "option_c": "The final output produced by the model",
        "option_d": "A list of software bugs to fix",
        "correct_answer": "B",
        "explanation": "Training data consists of examples that let the model learn patterns over many iterations."
    },
    {
        "id": "17",
        "domain": "AI Fundamentals",
        "question_text": "Why is data quality important for AI systems?",
        "option_a": "Better data always makes models run faster",
        "option_b": "High-quality data improves reliability and reduces harmful outputs",
        "option_c": "Poor data is only a user interface issue",
        "option_d": "Data quality does not matter once a model is deployed",
        "correct_answer": "B",
        "explanation": "Model quality is tied closely to the quality of the data used to train it, especially for fairness and accuracy."
    },
    {
        "id": "18",
        "domain": "Practical Usage",
        "question_text": "If an AI-generated response includes wrong details, what should you do first?",
        "option_a": "Ignore it and move on",
        "option_b": "Verify with trusted references",
        "option_c": "Ask the AI to confirm its confidence",
        "option_d": "Post it immediately to stakeholders",
        "correct_answer": "B",
        "explanation": "Verification with trusted sources is the fastest way to correct possible inaccuracies."
    },
    {
        "id": "19",
        "domain": "Practical Usage",
        "question_text": "Which prompt style is most useful for brainstorming ideas?",
        "option_a": "A strict, single-word instruction",
        "option_b": "A broad open prompt with role, context, constraints, and format",
        "option_c": "A request without context",
        "option_d": "No prompt is needed; AI auto-generates ideas by default",
        "correct_answer": "B",
        "explanation": "Rich context and constraints help AI give outputs that are easier to use and evaluate."
    },
    {
        "id": "20",
        "domain": "Ethics & Critical Thinking",
        "question_text": "What should you do if AI output reveals sensitive personal data?",
        "option_a": "Share it with your team immediately",
        "option_b": "Redact or report it through your privacy process",
        "option_c": "Store it and forget about it",
        "option_d": "Use it in your marketing campaign",
        "correct_answer": "B",
        "explanation": "Sensitive outputs should be handled under privacy and data-protection practices, not treated as ordinary output."
    },
    {
        "id": "21",
        "domain": "Ethics & Critical Thinking",
        "question_text": "Which practice helps reduce model bias risks in production?",
        "option_a": "Testing with diverse user groups and auditing outputs",
        "option_b": "Restricting model updates forever",
        "option_c": "Only using one dataset source",
        "option_d": "Avoiding any feedback process",
        "correct_answer": "A",
        "explanation": "Ongoing evaluation with diverse scenarios is key to catching fairness gaps before harm occurs."
    },
    {
        "id": "22",
        "domain": "AI Impact & Applications",
        "question_text": "Where is AI most commonly adopted for short-cycle operational gain?",
        "option_a": "Only for legal sentencing decisions",
        "option_b": "Customer support triage and document automation",
        "option_c": "Replacing board-level leadership roles",
        "option_d": "Replacing all manual tasks instantly",
        "correct_answer": "B",
        "explanation": "AI often delivers fast ROI in repetitive support, routing, and document-heavy workflows."
    },
    {
        "id": "23",
        "domain": "AI Impact & Applications",
        "question_text": "What is a practical first application for teams new to AI?",
        "option_a": "Full autonomous company operations",
        "option_b": "Automated meeting minute drafts with human review",
        "option_c": "Replacing all strategic decisions with AI",
        "option_d": "Hiring no human reviewers",
        "correct_answer": "B",
        "explanation": "Pilot projects with human review build confidence before scaling AI use."
    },
    {
        "id": "24",
        "domain": "Strategic Understanding",
        "question_text": "How should leadership frame AI adoption goals?",
        "option_a": "As a shortcut for governance and compliance",
        "option_b": "As measurable business outcomes with responsible guardrails",
        "option_c": "As a way to reduce all employee ownership",
        "option_d": "As a trend to satisfy investors only",
        "correct_answer": "B",
        "explanation": "AI strategy works best when outcomes, risk controls, and ownership are clearly defined."
    },
    {
        "id": "25",
        "domain": "Strategic Understanding",
        "question_text": "What is a strong indicator of AI strategy maturity?",
        "option_a": "Adopting the newest model every quarter",
        "option_b": "Measuring outcomes, iterating, and balancing ethics with speed",
        "option_c": "Avoiding AI whenever uncertainty exists",
        "option_d": "Deploying without cross-team communication",
        "correct_answer": "B",
        "explanation": "Mature strategy couples experimentation with accountability, governance, and measurable value."
    }
]


def _normalize_assessment_level(value, default=DEFAULT_ASSESSMENT_LEVEL):
    if value is None:
        return default

    normalized = str(value).strip().lower()
    if not normalized:
        return default
    if normalized in ASSESSMENT_LEVELS:
        return normalized
    return default


def _is_valid_assessment_level(value):
    if value is None or str(value).strip() == '':
        return True
    return str(value).strip().lower() in ASSESSMENT_LEVELS


def _question_public_payload(question):
    return {
        'id': str(question['id']),
        'domain': question['domain'],
        'question_text': question['question_text'],
        'option_a': question['option_a'],
        'option_b': question['option_b'],
        'option_c': question['option_c'],
        'option_d': question['option_d'],
    }


def _prepare_question_for_delivery(question):
    q = question.copy()
    q['id'] = str(q['id'])
    option_pairs = [
        ('A', q['option_a']),
        ('B', q['option_b']),
        ('C', q['option_c']),
        ('D', q['option_d'])
    ]
    original_correct_text = dict(option_pairs)[q['correct_answer'].upper()]
    random.shuffle(option_pairs)

    for idx, (_, text) in enumerate(option_pairs):
        letter = chr(ord('A') + idx)
        q[f'option_{letter.lower()}'] = text
        if text == original_correct_text:
            q['correct_answer'] = letter

    return _question_public_payload(q), q


def _get_question_set_secret():
    return str(os.getenv('ASSESSMENT_QUESTION_SET_SECRET') or '').strip()


def _b64url_encode(raw):
    return base64.urlsafe_b64encode(raw).rstrip(b'=').decode('ascii')


def _b64url_decode(value):
    padding = '=' * (-len(value) % 4)
    return base64.urlsafe_b64decode((value + padding).encode('ascii'))


def _sign_payload(payload, secret):
    encoded_payload = _b64url_encode(
        json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')
    )
    signature = hmac.new(
        secret.encode('utf-8'),
        encoded_payload.encode('ascii'),
        hashlib.sha256,
    ).digest()
    return f'{encoded_payload}.{_b64url_encode(signature)}'


def _decode_signed_payload(token):
    secret = _get_question_set_secret()
    if not secret or not isinstance(token, str) or '.' not in token:
        return None

    encoded_payload, encoded_signature = token.split('.', 1)
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        encoded_payload.encode('ascii'),
        hashlib.sha256,
    ).digest()

    try:
        provided_signature = _b64url_decode(encoded_signature)
    except Exception:
        return None

    if not hmac.compare_digest(provided_signature, expected_signature):
        return None

    try:
        payload = json.loads(_b64url_decode(encoded_payload).decode('utf-8'))
    except Exception:
        return None

    expires_at = payload.get('exp')
    if not isinstance(expires_at, int) or expires_at < int(time.time()):
        return None

    return payload


def _answer_hash(question, answer_letter, assessment_level, secret):
    option_text = question.get(f'option_{answer_letter.lower()}', '')
    message = '|'.join([
        'assessment-question-set-v1',
        str(assessment_level),
        str(question.get('id', '')),
        str(answer_letter).upper(),
        str(option_text),
    ])
    return hmac.new(secret.encode('utf-8'), message.encode('utf-8'), hashlib.sha256).hexdigest()


def _create_question_set_token(grading_questions, assessment_level, model):
    secret = _get_question_set_secret()
    if not secret:
        return None

    now = int(time.time())
    payload_questions = []
    for question in grading_questions:
        correct_answer = str(question['correct_answer']).upper()
        public_question = _question_public_payload(question)
        payload_questions.append({
            **public_question,
            'answer_hash': _answer_hash(question, correct_answer, assessment_level, secret),
        })

    return _sign_payload({
        'v': 1,
        'kind': 'assessment_question_set',
        'assessment_level': assessment_level,
        'generation_source': 'openrouter',
        'model': model,
        'iat': now,
        'exp': now + QUESTION_SET_TOKEN_TTL_SECONDS,
        'questions': payload_questions,
    }, secret)


def _resolve_question_set_token(token):
    payload = _decode_signed_payload(token)
    if not payload or payload.get('kind') != 'assessment_question_set' or payload.get('v') != 1:
        return None

    assessment_level = _normalize_assessment_level(payload.get('assessment_level'), default=None)
    questions = payload.get('questions')
    if not assessment_level or not isinstance(questions, list) or len(questions) != len(DOMAINS) * QUESTIONS_PER_DOMAIN:
        return None

    secret = _get_question_set_secret()
    domain_counts = Counter()
    grading_questions = []
    selected_question_ids = []

    for question in questions:
        if not isinstance(question, dict):
            return None

        question_id = _normalize_question_id(question.get('id'))
        domain = str(question.get('domain') or '').strip()
        question_text = str(question.get('question_text') or '').strip()
        answer_hash = str(question.get('answer_hash') or '').strip()
        option_values = {
            'A': str(question.get('option_a') or '').strip(),
            'B': str(question.get('option_b') or '').strip(),
            'C': str(question.get('option_c') or '').strip(),
            'D': str(question.get('option_d') or '').strip(),
        }

        if not question_id or domain not in DOMAINS or not question_text or not answer_hash:
            return None
        if any(not option_text for option_text in option_values.values()):
            return None

        grading_question = {
            'id': question_id,
            'domain': domain,
            'question_text': question_text,
            'option_a': option_values['A'],
            'option_b': option_values['B'],
            'option_c': option_values['C'],
            'option_d': option_values['D'],
            'correct_answer': '',
            'explanation': '',
        }

        for answer_letter in ('A', 'B', 'C', 'D'):
            if hmac.compare_digest(
                _answer_hash(grading_question, answer_letter, assessment_level, secret),
                answer_hash,
            ):
                grading_question['correct_answer'] = answer_letter
                break

        if not grading_question['correct_answer']:
            return None

        domain_counts[domain] += 1
        grading_questions.append(grading_question)
        selected_question_ids.append(question_id)

    if domain_counts != Counter({domain: QUESTIONS_PER_DOMAIN for domain in DOMAINS}):
        return None

    return {
        'assessment_level': assessment_level,
        'generation_source': payload.get('generation_source') or 'openrouter',
        'selected_question_ids': selected_question_ids,
        'questions': grading_questions,
    }


def _openrouter_settings():
    api_key = str(os.getenv('OPENROUTER_API_KEY') or '').strip()
    model = str(os.getenv('OPENROUTER_MODEL') or '').strip()
    base_url = str(os.getenv('OPENROUTER_BASE_URL') or OPENROUTER_DEFAULT_BASE_URL).strip().rstrip('/')
    question_set_secret = _get_question_set_secret()

    if not api_key or not model or not question_set_secret:
        return None

    return {
        'api_key': api_key,
        'model': model,
        'base_url': base_url or OPENROUTER_DEFAULT_BASE_URL,
    }


def _assessment_generation_prompt(assessment_level):
    domain_list = '\n'.join(f'- {domain}: exactly {QUESTIONS_PER_DOMAIN} questions' for domain in DOMAINS)
    return (
        'Generate a level-aware AI literacy assessment question set. '
        f'The learner level is "{assessment_level}". '
        f'{LEVEL_PROMPT_GUIDANCE.get(assessment_level, LEVEL_PROMPT_GUIDANCE[DEFAULT_ASSESSMENT_LEVEL])} '
        'Return JSON only, with this exact shape: '
        '{"questions":[{"domain":"AI Fundamentals","question_text":"...","option_a":"...",'
        '"option_b":"...","option_c":"...","option_d":"...","correct_answer":"A",'
        '"explanation":"..."}]}. '
        'Rules: return exactly 15 total questions; use only these domains and counts:\n'
        f'{domain_list}\n'
        'Each question must have four plausible answer choices, one correct answer letter A-D, '
        'workplace-relevant wording, and no markdown.'
    )


def _post_openrouter_chat_completion(*, api_key, model, base_url, messages):
    request_body = json.dumps({
        'model': model,
        'messages': messages,
        'temperature': 0.4,
        'response_format': {'type': 'json_object'},
    }).encode('utf-8')
    request_url = f'{base_url}/chat/completions'
    http_request = urllib.request.Request(
        request_url,
        data=request_body,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        method='POST',
    )

    with urllib.request.urlopen(http_request, timeout=20) as response:
        return json.loads(response.read().decode('utf-8'))


def _extract_openrouter_message_text(openrouter_response):
    try:
        content = openrouter_response['choices'][0]['message']['content']
    except (KeyError, IndexError, TypeError):
        return ''

    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict) and item.get('type') in ('text', 'output_text'):
                parts.append(str(item.get('text') or ''))
        return ''.join(parts)
    return ''


def _parse_json_from_text(text):
    if not isinstance(text, str):
        return None

    stripped = text.strip()
    fenced = re.match(r'^```(?:json)?\s*(.*?)\s*```$', stripped, re.DOTALL | re.IGNORECASE)
    if fenced:
        stripped = fenced.group(1).strip()

    try:
        return json.loads(stripped)
    except (TypeError, ValueError):
        start = stripped.find('{')
        end = stripped.rfind('}')
        if start == -1 or end == -1 or end <= start:
            return None
        try:
            return json.loads(stripped[start:end + 1])
        except (TypeError, ValueError):
            return None


def _domain_slug(domain):
    return re.sub(r'[^a-z0-9]+', '-', domain.lower()).strip('-')


def _coerce_option_values(raw_question):
    raw_options = raw_question.get('options')
    if isinstance(raw_options, list):
        return [str(value or '').strip() for value in raw_options[:4]]
    if isinstance(raw_options, dict):
        return [
            str(raw_options.get(letter) or raw_options.get(letter.lower()) or '').strip()
            for letter in ('A', 'B', 'C', 'D')
        ]
    return [
        str(raw_question.get('option_a') or '').strip(),
        str(raw_question.get('option_b') or '').strip(),
        str(raw_question.get('option_c') or '').strip(),
        str(raw_question.get('option_d') or '').strip(),
    ]


def _normalize_generated_questions(parsed_payload, assessment_level):
    if isinstance(parsed_payload, dict):
        raw_questions = parsed_payload.get('questions')
    else:
        raw_questions = parsed_payload

    if not isinstance(raw_questions, list) or len(raw_questions) != len(DOMAINS) * QUESTIONS_PER_DOMAIN:
        return None

    questions_by_domain = {domain: [] for domain in DOMAINS}
    for raw_question in raw_questions:
        if not isinstance(raw_question, dict):
            return None

        domain = str(raw_question.get('domain') or '').strip()
        question_text = str(
            raw_question.get('question_text') or raw_question.get('question') or ''
        ).strip()
        correct_answer_raw = str(raw_question.get('correct_answer') or raw_question.get('answer') or '').strip()
        option_values = _coerce_option_values(raw_question)
        correct_answer = correct_answer_raw.upper()
        if correct_answer not in ('A', 'B', 'C', 'D'):
            normalized_correct_text = correct_answer_raw.lower()
            for option_index, option_value in enumerate(option_values):
                if option_value.lower() == normalized_correct_text:
                    correct_answer = chr(ord('A') + option_index)
                    break

        if (
            domain not in questions_by_domain
            or not question_text
            or len(option_values) != 4
            or any(not option for option in option_values)
            or correct_answer not in ('A', 'B', 'C', 'D')
        ):
            return None

        question_number = len(questions_by_domain[domain]) + 1
        questions_by_domain[domain].append({
            'id': f'generated-{assessment_level}-{_domain_slug(domain)}-{question_number}-{uuid.uuid4().hex[:8]}',
            'domain': domain,
            'question_text': question_text,
            'option_a': option_values[0],
            'option_b': option_values[1],
            'option_c': option_values[2],
            'option_d': option_values[3],
            'correct_answer': correct_answer,
            'explanation': str(raw_question.get('explanation') or '').strip(),
        })

    if any(len(questions_by_domain[domain]) != QUESTIONS_PER_DOMAIN for domain in DOMAINS):
        return None

    normalized_questions = []
    for domain in DOMAINS:
        normalized_questions.extend(questions_by_domain[domain])
    random.shuffle(normalized_questions)
    return normalized_questions


def _generate_openrouter_question_set(assessment_level):
    settings = _openrouter_settings()
    if not settings:
        return None

    try:
        openrouter_response = _post_openrouter_chat_completion(
            api_key=settings['api_key'],
            model=settings['model'],
            base_url=settings['base_url'],
            messages=[
                {
                    'role': 'system',
                    'content': 'You create valid JSON assessment content for AI literacy learning products.',
                },
                {
                    'role': 'user',
                    'content': _assessment_generation_prompt(assessment_level),
                },
            ],
        )
        parsed_payload = _parse_json_from_text(_extract_openrouter_message_text(openrouter_response))
        generated_questions = _normalize_generated_questions(parsed_payload, assessment_level)
        if not generated_questions:
            logger.warning('openrouter_assessment_questions_invalid', assessment_level=assessment_level)
            return None

        public_questions = []
        grading_questions = []
        for question in generated_questions:
            public_question, grading_question = _prepare_question_for_delivery(question)
            public_questions.append(public_question)
            grading_questions.append(grading_question)

        question_set_token = _create_question_set_token(
            grading_questions,
            assessment_level,
            settings['model'],
        )
        if not question_set_token:
            logger.warning('openrouter_assessment_questions_unsigned', assessment_level=assessment_level)
            return None

        return {
            'questions': public_questions,
            'selected_question_ids': [question['id'] for question in public_questions],
            'question_set_token': question_set_token,
            'generation_source': 'openrouter',
        }
    except (urllib.error.URLError, TimeoutError, ValueError, TypeError, KeyError) as exc:
        logger.warning(
            'openrouter_assessment_questions_failed',
            assessment_level=assessment_level,
            error=str(exc),
        )
        return None


def _group_questions_by_domain():
    questions_by_domain = {domain: [] for domain in DOMAINS}
    for question in SAMPLE_QUESTIONS:
        domain = question['domain']
        if domain in questions_by_domain:
            questions_by_domain[domain].append(question)
    return questions_by_domain


def _select_random_questions(questions_by_domain, assessment_level=DEFAULT_ASSESSMENT_LEVEL):
    selected_questions = []
    assessment_level = _normalize_assessment_level(assessment_level)
    for domain in DOMAINS:
        domain_questions = questions_by_domain.get(domain, [])
        ordered_questions = sorted(
            domain_questions,
            key=lambda question: int(str(question.get('id', '0')).split('-')[-1] or 0),
        )
        if len(domain_questions) >= QUESTIONS_PER_DOMAIN:
            if assessment_level == 'beginner':
                candidate_questions = ordered_questions[:QUESTIONS_PER_DOMAIN]
            elif assessment_level == 'intermediate':
                candidate_questions = ordered_questions[1:1 + QUESTIONS_PER_DOMAIN]
            else:
                candidate_questions = ordered_questions[-QUESTIONS_PER_DOMAIN:]

            if len(candidate_questions) < QUESTIONS_PER_DOMAIN:
                existing_ids = {question['id'] for question in candidate_questions}
                candidate_questions.extend(
                    question for question in ordered_questions if question['id'] not in existing_ids
                )

            selected_questions.extend(
                random.sample(candidate_questions[:QUESTIONS_PER_DOMAIN], QUESTIONS_PER_DOMAIN)
            )
        else:
            selected_questions.extend(domain_questions)

    random.shuffle(selected_questions)
    return selected_questions


def _normalize_question_id(raw_question_id):
    if raw_question_id is None:
        return None
    normalized = str(raw_question_id).strip()
    return normalized if normalized else None


def _normalize_question_id_list(raw_question_ids):
    if not isinstance(raw_question_ids, list):
        return []

    normalized = []
    seen = set()
    for raw_question_id in raw_question_ids:
        normalized_id = _normalize_question_id(raw_question_id)
        if normalized_id is None or normalized_id in seen:
            continue
        seen.add(normalized_id)
        normalized.append(normalized_id)
    return normalized


def _get_questions_by_ids(selected_question_ids):
    question_by_id = {str(question['id']): question for question in SAMPLE_QUESTIONS}
    return [
        question_by_id[question_id]
        for question_id in _normalize_question_id_list(selected_question_ids)
        if question_id in question_by_id
    ]


def _resolve_grading_questions(answers, selected_question_ids):
    selected_questions = _get_questions_by_ids(selected_question_ids)
    if selected_questions:
        return selected_questions

    answer_ids = _normalize_question_id_list(list(answers.keys()))
    fallback_questions = _get_questions_by_ids(answer_ids)
    return fallback_questions if fallback_questions else SAMPLE_QUESTIONS


def _format_question(question):
    public_question, _ = _prepare_question_for_delivery(question)
    return public_question

DOMAIN_TOTALS = {
    domain: sum(1 for question in SAMPLE_QUESTIONS if question['domain'] == domain)
    for domain in DOMAINS
}

WORKPLACE_TRACKS = ('General', 'Sales', 'HR', 'Marketing', 'Operations')

TRACK_ALIASES = {
    'general': 'General',
    'sales': 'Sales',
    'business development': 'Sales',
    'business-development': 'Sales',
    'bd': 'Sales',
    'hr': 'HR',
    'human resources': 'HR',
    'people': 'HR',
    'people ops': 'HR',
    'people operations': 'HR',
    'marketing': 'Marketing',
    'growth': 'Marketing',
    'operations': 'Operations',
    'ops': 'Operations',
}

TRACK_DOMAIN_HINTS = {
    'General': {'AI Fundamentals', 'Practical Usage', 'Ethics & Critical Thinking'},
    'Sales': {'Practical Usage', 'AI Impact & Applications'},
    'HR': {'Ethics & Critical Thinking', 'AI Impact & Applications'},
    'Marketing': {'Practical Usage', 'Strategic Understanding'},
    'Operations': {'Strategic Understanding', 'AI Impact & Applications'},
}


def _normalize_workplace_track(value):
    normalized = str(value or '').strip().lower()
    return TRACK_ALIASES.get(normalized, 'General')


def _parse_domain_scores_payload(value):
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (TypeError, ValueError):
            value = {}

    return value if isinstance(value, dict) else {}


def _assessment_domain_entries(assessment):
    domain_scores_data = _parse_domain_scores_payload(assessment.domain_scores if assessment else {})
    entries = []

    for domain in DOMAINS:
        if domain not in domain_scores_data:
            continue

        raw_entry = domain_scores_data.get(domain, {})
        if isinstance(raw_entry, dict):
            score = raw_entry.get('score', 0) or 0
            total = raw_entry.get('total', 0) or 0
        else:
            score = 0
            total = 0

        if not total:
            total = DOMAIN_TOTALS.get(domain, 0)

        percentage = (score / total * 100) if total > 0 else 0
        entries.append({
            'domain': domain,
            'score': score,
            'total': total,
            'percentage': percentage,
            'gap_percentage': max(0, 100 - percentage),
        })

    return entries


def _recommended_difficulty(assessment):
    percentage = assessment.percentage if assessment and assessment.percentage is not None else 0
    if percentage < 50:
        score_based_difficulty = 1
    elif percentage < 75:
        score_based_difficulty = 2
    else:
        score_based_difficulty = 3

    assessment_level = _normalize_assessment_level(
        getattr(assessment, 'assessment_level', None),
        default=None,
    )
    if assessment_level and assessment_level != 'beginner':
        level_floor = LEVEL_DIFFICULTY_FLOORS.get(assessment_level, 1)
        if percentage < 50:
            level_floor = max(1, level_floor - 1)
        return max(score_based_difficulty, level_floor)

    return score_based_difficulty


def _assessment_level_from_result(assessment):
    return _normalize_assessment_level(getattr(assessment, 'assessment_level', None))


def _fallback_question_set(assessment_level):
    questions_by_domain = _group_questions_by_domain()
    selected_questions = _select_random_questions(questions_by_domain, assessment_level)
    questions = [
        _format_question(question) for question in selected_questions
    ]

    return {
        'questions': questions,
        'total_questions': len(questions),
        'domains': DOMAINS,
        'selected_question_ids': [str(question['id']) for question in questions],
        'assessment_level': assessment_level,
        'generation_source': 'curated_fallback',
        'question_set_token': None,
    }


def _certification_source_domains(assessment, completed_module_ids, completed_modules_count):
    source_domains = set()

    if not assessment:
        source_domains.add('AI Fundamentals')
    elif assessment.percentage is None or assessment.percentage < 70:
        source_domains.update(['AI Fundamentals', 'Practical Usage', 'Strategic Understanding'])

    ethics_entry = next(
        (entry for entry in _assessment_domain_entries(assessment) if entry['domain'] == 'Ethics & Critical Thinking'),
        None,
    )
    if not assessment or (ethics_entry and ethics_entry['score'] < 3):
        source_domains.add('Ethics & Critical Thinking')

    if 'module-ai-fundamentals-intro' not in completed_module_ids:
        source_domains.add('AI Fundamentals')
    if completed_modules_count < 3:
        source_domains.update(['Practical Usage', 'AI Impact & Applications'])

    return source_domains


def _next_action_label(module_metadata, certification_relevant=False):
    if certification_relevant:
        return 'Build certification readiness'
    if module_metadata.get('has_internal_lessons'):
        return 'Start workplace lessons'
    if module_metadata.get('external_url'):
        return 'Open recommended course'
    return 'Review module'


def _recommendation_priority(score):
    if score >= 65:
        return 'high'
    if score >= 40:
        return 'medium'
    return 'low'


def _recommendation_confidence(score):
    return round(max(0.35, min(0.98, score / 100)), 2)


def _score_module_recommendation(
    module,
    *,
    module_metadata,
    profile_track,
    weak_domains,
    fallback_domains,
    certification_domains,
    ideal_difficulty,
):
    target_domains = module_metadata.get('target_domains') or []
    target_domain_set = set(target_domains)
    weak_domain_map = {entry['domain']: entry for entry in weak_domains}
    weak_matches = [domain for domain in target_domains if domain in weak_domain_map]
    fallback_matches = [domain for domain in target_domains if domain in fallback_domains]
    certification_matches = [domain for domain in target_domains if domain in certification_domains]
    module_track = _normalize_workplace_track(module.role_specific)
    source_domains = weak_matches or fallback_matches or certification_matches or target_domains[:2]

    score = 8
    if weak_matches:
        score += sum(weak_domain_map[domain]['gap_percentage'] for domain in weak_matches) / len(weak_matches) * 0.45
    elif fallback_matches:
        score += 12
    elif not target_domain_set:
        score += 6

    if module_track == profile_track and module_track != 'General':
        score += 24
    elif module_track == 'General':
        score += 14
    elif target_domain_set & TRACK_DOMAIN_HINTS.get(profile_track, set()):
        score += 10

    difficulty_delta = abs((module.difficulty_level or 1) - ideal_difficulty)
    score += max(0, 16 - (difficulty_delta * 6))

    if module_metadata.get('has_internal_lessons'):
        score += 12
    elif module_metadata.get('external_url'):
        score += 4

    if certification_matches:
        score += 10

    return {
        'score': score,
        'track': module_track,
        'source_domains': source_domains,
        'certification_relevant': bool(certification_matches),
    }

@assessment_bp.route('/questions', methods=['GET'])
def get_assessment_questions():
    """Get assessment questions - no authentication required for free tier"""
    try:
        if not _is_valid_assessment_level(request.args.get('level')):
            return jsonify({
                'error': 'Invalid assessment level',
                'valid_levels': list(ASSESSMENT_LEVELS),
            }), 400

        assessment_level = _normalize_assessment_level(request.args.get('level'))
        generated_question_set = _generate_openrouter_question_set(assessment_level)
        if generated_question_set:
            return jsonify({
                'questions': generated_question_set['questions'],
                'total_questions': len(generated_question_set['questions']),
                'domains': DOMAINS,
                'selected_question_ids': generated_question_set['selected_question_ids'],
                'assessment_level': assessment_level,
                'generation_source': generated_question_set['generation_source'],
                'question_set_token': generated_question_set['question_set_token'],
            }), 200

        return jsonify(_fallback_question_set(assessment_level)), 200
        
    except Exception as e:
        logger.exception('assessment_questions_failed', error=str(e))
        return jsonify({'error': 'Failed to get questions', 'details': str(e)}), 500

@assessment_bp.route('/submit', methods=['POST'])
@supabase_jwt_required(optional=True)
def submit_assessment():
    """Submit assessment answers and get results"""
    user_id = None
    try:
        data = request.get_json() or {}
        
        if not data.get('answers'):
            return jsonify({'error': 'Answers are required'}), 400
        if not isinstance(data.get('answers'), dict):
            return jsonify({'error': 'Answers must be an object keyed by question id'}), 400
        if not _is_valid_assessment_level(data.get('assessment_level')):
            return jsonify({
                'error': 'Invalid assessment level',
                'valid_levels': list(ASSESSMENT_LEVELS),
            }), 400

        answers = data['answers']  # Expected format: {'1': 'A', '2': 'B', ...}
        option_map_payload = data.get('option_map', {})
        if not isinstance(option_map_payload, dict):
            option_map_payload = {}
        time_taken = data.get('time_taken_minutes', 0)
        raw_selected_question_ids = data.get('selected_question_ids') or data.get('selectedQuestionIds') or data.get(
            'selected_ids'
        ) or data.get('question_ids')
        selected_question_ids = _normalize_question_id_list(raw_selected_question_ids)
        assessment_level = _normalize_assessment_level(data.get('assessment_level'))
        grading_source = 'curated_fallback'
        raw_question_set_token = data.get('question_set_token')
        question_set_data = _resolve_question_set_token(raw_question_set_token)
        if raw_question_set_token and not question_set_data:
            return jsonify({'error': 'Question set token is invalid or expired'}), 400
        if question_set_data:
            selected_questions = question_set_data['questions']
            selected_question_ids = question_set_data['selected_question_ids']
            assessment_level = question_set_data['assessment_level']
            grading_source = question_set_data['generation_source']
        else:
            selected_questions = _resolve_grading_questions(answers, selected_question_ids)
        
        # Calculate scores
        total_score = 0
        max_score = len(selected_questions)
        domain_scores = {domain: 0 for domain in DOMAINS}
        domain_totals = {domain: 0 for domain in DOMAINS}
        
        detailed_results = []
        
        for question in selected_questions:
            q_id = question['id']
            domain = question['domain']
            correct = question['correct_answer']
            user_answer = answers.get(q_id, '')
            if user_answer is None:
                user_answer = ''
            user_answer = str(user_answer).strip()
            answer_options = option_map_payload.get(q_id, {})
            user_answer_text = answer_options.get(user_answer.upper(), '')
            correct_answer_text = question[f"option_{correct.lower()}"]

            domain_totals[domain] += 1
            
            if user_answer_text:
                is_correct = user_answer_text.strip().lower() == correct_answer_text.strip().lower()
            else:
                is_correct = user_answer.upper() == correct.upper()
            if is_correct:
                total_score += 1
                domain_scores[domain] += 1
            
            detailed_results.append({
                'question_id': q_id,
                'domain': domain,
                'user_answer': user_answer,
                'user_answer_text': user_answer_text,
                'correct_answer': correct,
                'correct_answer_text': correct_answer_text,
                'is_correct': is_correct,
                'explanation': question['explanation']
            })
        
        percentage = (total_score / max_score) * 100 if max_score > 0 else 0
        
        # Generate recommendations based on performance
        score_band = classify_score(total_score)
        recommendations = generate_recommendations(domain_scores, domain_totals, total_score, score_band)

        domain_scores_payload = {
            domain: {
                'score': domain_scores.get(domain, 0),
                'total': domain_totals.get(domain, 0)
            }
            for domain in DOMAINS
        }
        
        # Save results if user is authenticated
        user_id = g.get('current_user_id')
        if user_id is None:
            user_id = get_supabase_identity(optional=True)
        
        if user_id:
            legacy_field_map = [
                ('functional_score', 'AI Fundamentals'),
                ('ethical_score', 'Practical Usage'),
                ('rhetorical_score', 'Ethics & Critical Thinking'),
                ('pedagogical_score', 'AI Impact & Applications')
            ]

            result = AssessmentResult(
                user_id=user_id,
                total_score=total_score,
                max_score=max_score,
                percentage=percentage,
                assessment_level=assessment_level,
                domain_scores=domain_scores_payload,
                time_taken_minutes=time_taken,
                recommendations=json.dumps({
                    'insights': recommendations,
                    'strategic_score': domain_scores.get('Strategic Understanding', 0),
                    'assessment_level': assessment_level,
                    'generation_source': grading_source,
                })
            )

            for attr, domain in legacy_field_map:
                setattr(result, attr, domain_scores_payload.get(domain, {}).get('score', 0))

            db.session.add(result)
            db.session.commit()

            logger.info(
                'assessment_submitted',
                user_id=user_id,
                total_score=total_score,
                percentage=round(percentage, 1),
                score_band=score_band,
                assessment_level=assessment_level,
                generation_source=grading_source,
            )
        else:
            logger.info(
                'assessment_completed_anonymously',
                total_score=total_score,
                percentage=round(percentage, 1),
                score_band=score_band,
                assessment_level=assessment_level,
                generation_source=grading_source,
            )

        response_payload = {
            'total_score': total_score,
            'max_score': max_score,
            'percentage': round(percentage, 1),
            'assessment_level': assessment_level,
            'generation_source': grading_source,
            'selected_question_ids': selected_question_ids,
            'domain_scores': domain_scores_payload,
            'recommendations': recommendations,
            'detailed_results': detailed_results,
            'time_taken_minutes': time_taken,
            'score_band': score_band,
            'saved': user_id is not None
        }

        return jsonify(response_payload), 200
        
    except Exception as e:
        db.session.rollback()
        logger.exception('assessment_submit_failed', error=str(e))
        return jsonify({'error': 'Failed to submit assessment', 'details': str(e)}), 500

def classify_score(total_correct):
    if total_correct <= 6:
        return 'Beginner'
    if total_correct <= 11:
        return 'Intermediate'
    return 'Advanced'


def generate_recommendations(domain_scores, domain_totals, total_correct, score_band):
    """Generate personalized recommendations based on assessment results"""
    recommendations = []
    course_map = {
        'Beginner': [
            'Google AI Essentials (Free)',
            'Coursera "AI for Everyone" by Andrew Ng',
            'LinkedIn Learning "AI Foundations"'
        ],
        'Intermediate': [
            'IBM Applied AI Professional Certificate',
            'Microsoft AI Business School courses',
            '“Ethics in AI” specialization'
        ],
        'Advanced': [
            'Wharton AI Strategy for Business',
            'MIT AI Leadership programs',
            'Advanced prompt engineering courses'
        ]
    }

    if score_band == 'Beginner':
        priority = 'high'
        description = 'You’re building your AI literacy. Start with foundational concepts before moving to advanced use cases.'
    elif score_band == 'Intermediate':
        priority = 'medium'
        description = 'Solid baseline understanding. Focus on applied practice and ethical considerations to level up.'
    else:
        priority = 'medium'
        description = 'You demonstrate strong AI literacy. Continue refining strategic application and leadership skills.'

    course_list = '; '.join(course_map[score_band])
    recommendations.append({
        'type': 'overall',
        'title': f'{score_band} LitmusAI Readiness',
        'description': description,
        'priority': priority,
        'action': f'Recommended next steps: {course_list}'
    })

    domain_actions = {
        'AI Fundamentals': 'Review core AI terminology, model types, and common pitfalls.',
        'Practical Usage': 'Practice structured prompting and workflows that combine AI with human review.',
        'Ethics & Critical Thinking': 'Deepen your understanding of bias, governance, and responsible use policies.',
        'AI Impact & Applications': 'Explore industry case studies to connect AI capabilities with high-value outcomes.',
        'Strategic Understanding': 'Align AI initiatives with business strategy, training, and ethical guardrails.'
    }

    for domain, total in domain_totals.items():
        if total == 0:
            continue
        score = domain_scores[domain]
        if score <= 1:
            recommendations.append({
                'type': 'domain',
                'domain': domain,
                'title': f'Deepen {domain} skills',
                'description': domain_actions.get(domain, ''),
                'priority': 'medium',
                'action': 'Focus your next learning sprint on this competency area.'
            })

    return recommendations


def serialize_course_recommendation(
    module,
    *,
    reason,
    priority,
    skill_gap_percentage=0,
    track=None,
    source_domains=None,
    next_action_label=None,
    recommended_path=None,
    confidence=None,
):
    module_metadata = build_module_metadata(module)
    extra_fields = {}
    if track:
        extra_fields['track'] = track
    if source_domains is not None:
        extra_fields['source_domains'] = source_domains
    if next_action_label:
        extra_fields['next_action_label'] = next_action_label
    if recommended_path:
        extra_fields['recommended_path'] = recommended_path
    if confidence is not None:
        extra_fields['confidence'] = confidence

    return {
        'id': module.id,
        'title': module.title,
        'description': module.description,
        'difficulty_level': module.difficulty_level,
        'estimated_duration_minutes': module.estimated_duration_minutes,
        'content_type': module.content_type,
        'is_premium': module.is_premium,
        'role_specific': module.role_specific,
        'reason': reason,
        'priority': priority,
        'skill_gap_percentage': skill_gap_percentage,
        **module_metadata,
        **extra_fields,
    }

@assessment_bp.route('/history', methods=['GET'])
@supabase_jwt_required()
def get_assessment_history():
    """Get user's assessment history"""
    try:
        user_id = g.get('current_user_id') or get_supabase_identity()
        
        results = AssessmentResult.query.filter_by(user_id=user_id)\
                                      .order_by(AssessmentResult.completed_at.desc())\
                                      .all()
        
        history = []
        for result in results:
            recommendation_payload = []
            legacy_strategic_score = 0
            stored_recommendations = result.recommendations
            if stored_recommendations:
                try:
                    parsed = json.loads(stored_recommendations)
                    if isinstance(parsed, dict):
                        recommendation_payload = parsed.get('insights', [])
                        legacy_strategic_score = parsed.get('strategic_score', 0) or 0
                    elif isinstance(parsed, list):
                        recommendation_payload = parsed
                except Exception:
                    recommendation_payload = []

            domain_scores_payload = {}
            stored_domain_scores = result.domain_scores
            if isinstance(stored_domain_scores, str):
                try:
                    stored_domain_scores = json.loads(stored_domain_scores)
                except ValueError:
                    stored_domain_scores = {}

            if not isinstance(stored_domain_scores, dict):
                stored_domain_scores = {}

            legacy_fallback = {
                'AI Fundamentals': result.functional_score or 0,
                'Practical Usage': result.ethical_score or 0,
                'Ethics & Critical Thinking': result.rhetorical_score or 0,
                'AI Impact & Applications': result.pedagogical_score or 0,
                'Strategic Understanding': legacy_strategic_score
            }

            for domain in DOMAINS:
                stored_entry = stored_domain_scores.get(domain, {}) if stored_domain_scores else {}
                score_value = stored_entry.get('score') if isinstance(stored_entry, dict) else None
                total_value = stored_entry.get('total') if isinstance(stored_entry, dict) else None

                domain_scores_payload[domain] = {
                    'score': score_value if score_value is not None else legacy_fallback.get(domain, 0),
                    'total': total_value if total_value else DOMAIN_TOTALS.get(domain, 0)
                }

            history.append({
                'id': result.id,
                'total_score': result.total_score,
                'max_score': result.max_score,
                'percentage': result.percentage,
                'assessment_level': _assessment_level_from_result(result),
                'score_band': classify_score(result.total_score),
                'domain_scores': domain_scores_payload,
                'time_taken_minutes': result.time_taken_minutes,
                'completed_at': result.completed_at.isoformat(),
                'recommendations': recommendation_payload
            })

        logger.info('assessment_history_requested', user_id=user_id, results=len(history))
        return jsonify({'history': history}), 200

    except Exception as e:
        logger.exception('assessment_history_failed', error=str(e))
        return jsonify({'error': 'Failed to get assessment history', 'details': str(e)}), 500


@assessment_bp.route('/recommendations', methods=['GET'])
@supabase_jwt_required()
def get_course_recommendations():
    """Get personalized course recommendations based on latest assessment results"""
    try:
        user_id = g.get('current_user_id') or get_supabase_identity()

        # Get the latest assessment result
        latest_result = AssessmentResult.query.filter_by(user_id=user_id)\
                                             .order_by(AssessmentResult.completed_at.desc())\
                                             .first()

        user = User.query.get(user_id)
        profile_track = _normalize_workplace_track(user.role if user else None)
        completed_progress = UserProgress.query.filter_by(user_id=user_id, status='completed').all()
        completed_module_ids = {progress.module_id for progress in completed_progress}
        completed_modules_count = len(completed_progress)
        all_modules = TrainingModule.query.filter_by(is_active=True).all()

        if not latest_result:
            certification_domains = _certification_source_domains(None, completed_module_ids, completed_modules_count)
            scored_recommendations = []

            for module in all_modules:
                module_metadata = build_module_metadata(module)
                score_data = _score_module_recommendation(
                    module,
                    module_metadata=module_metadata,
                    profile_track=profile_track,
                    weak_domains=[],
                    fallback_domains=TRACK_DOMAIN_HINTS.get(profile_track, set()),
                    certification_domains=certification_domains,
                    ideal_difficulty=1,
                )
                score = score_data['score'] - (18 if module.id in completed_module_ids else 0)
                scored_recommendations.append((
                    score,
                    serialize_course_recommendation(
                        module,
                        reason='Great starting point for workplace AI literacy',
                        priority=_recommendation_priority(score),
                        skill_gap_percentage=0,
                        track=score_data['track'],
                        source_domains=score_data['source_domains'],
                        next_action_label=_next_action_label(
                            module_metadata,
                            certification_relevant=score_data['certification_relevant'],
                        ),
                        recommended_path=module_metadata.get('start_path'),
                        confidence=_recommendation_confidence(score),
                    ),
                ))

            scored_recommendations.sort(
                key=lambda item: (
                    -item[0],
                    item[1]['track'] != profile_track,
                    -int(item[1].get('has_internal_lessons', False)),
                    item[1]['title'],
                )
            )

            return jsonify({
                'recommendations': [item[1] for item in scored_recommendations[:6]],
                'message': 'Take an assessment to get personalized recommendations',
                'assessment_level': None,
            }), 200

        domain_entries = _assessment_domain_entries(latest_result)
        assessment_level = _assessment_level_from_result(latest_result)
        weak_domains = [entry for entry in domain_entries if entry['percentage'] < 50]
        weak_domains.sort(key=lambda x: x['percentage'])
        fallback_domains = {
            entry['domain']
            for entry in sorted(domain_entries, key=lambda x: x['percentage'])[:3]
        }
        certification_domains = _certification_source_domains(
            latest_result,
            completed_module_ids,
            completed_modules_count,
        )

        scored_recommendations = []
        weak_domain_map = {entry['domain']: entry for entry in weak_domains}
        ideal_difficulty = _recommended_difficulty(latest_result)

        for module in all_modules:
            module_metadata = build_module_metadata(module)
            score_data = _score_module_recommendation(
                module,
                module_metadata=module_metadata,
                profile_track=profile_track,
                weak_domains=weak_domains,
                fallback_domains=fallback_domains,
                certification_domains=certification_domains,
                ideal_difficulty=ideal_difficulty,
            )
            source_domains = score_data['source_domains']
            matched_weak_domains = [domain for domain in source_domains if domain in weak_domain_map]
            if matched_weak_domains:
                primary_domain = matched_weak_domains[0]
                primary_gap = weak_domain_map[primary_domain]
                reason = (
                    f'Strengthen your {primary_domain} skills '
                    f'(scored {primary_gap["score"]}/{primary_gap["total"]})'
                )
                skill_gap_percentage = round(primary_gap['gap_percentage'], 1)
            elif score_data['certification_relevant']:
                reason = 'Supports certification readiness requirements'
                skill_gap_percentage = 0
            elif score_data['track'] == profile_track and profile_track != 'General':
                reason = f'Fits your {profile_track} workplace AI track'
                skill_gap_percentage = 0
            elif assessment_level == 'advanced':
                reason = 'Matches your advanced self-rating with deeper applied practice'
                skill_gap_percentage = 0
            elif assessment_level == 'beginner':
                reason = 'Keeps your next step approachable from your self-rating'
                skill_gap_percentage = 0
            else:
                reason = 'Good next step from your latest assessment'
                skill_gap_percentage = 0

            score = score_data['score'] - (18 if module.id in completed_module_ids else 0)
            scored_recommendations.append((
                score,
                serialize_course_recommendation(
                    module,
                    reason=reason,
                    priority=_recommendation_priority(score),
                    skill_gap_percentage=skill_gap_percentage,
                    track=score_data['track'],
                    source_domains=source_domains,
                    next_action_label=_next_action_label(
                        module_metadata,
                        certification_relevant=score_data['certification_relevant'],
                    ),
                    recommended_path=module_metadata.get('start_path'),
                    confidence=_recommendation_confidence(score),
                ),
            ))

        scored_recommendations.sort(
            key=lambda item: (
                -item[0],
                item[1]['track'] != profile_track,
                -int(item[1].get('has_internal_lessons', False)),
                item[1]['title'],
            )
        )
        recommendations = [item[1] for item in scored_recommendations[:6]]

        logger.info(
            'course_recommendations_generated',
            user_id=user_id,
            weak_domains=len(weak_domains),
            recommendations=len(recommendations)
        )

        return jsonify({
            'recommendations': recommendations,
            'assessment_score': latest_result.percentage,
            'assessment_level': assessment_level,
            'weak_domains': [d['domain'] for d in weak_domains[:3]],
            'weak_domain_details': weak_domains[:3]
        }), 200

    except Exception as e:
        logger.exception('course_recommendations_failed', error=str(e))
        return jsonify({'error': 'Failed to get recommendations', 'details': str(e)}), 500
