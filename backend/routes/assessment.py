from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from models import db, Assessment, AssessmentResult, User
from datetime import datetime
import json

assessment_bp = Blueprint('assessment', __name__)

# Sample assessment questions - in production, these would be in the database
DOMAINS = [
    'AI Fundamentals',
    'Practical Usage',
    'Ethics & Critical Thinking',
    'AI Impact & Applications',
    'Strategic Understanding'
]

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
        "option_b": "The AI generating plausible but false information",
        "option_c": "User input errors",
        "option_d": "Internet connectivity issues",
        "correct_answer": "B",
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
    }
]

DOMAIN_TOTALS = {
    domain: sum(1 for question in SAMPLE_QUESTIONS if question['domain'] == domain)
    for domain in DOMAINS
}

@assessment_bp.route('/questions', methods=['GET'])
def get_assessment_questions():
    """Get assessment questions - no authentication required for free tier"""
    try:
        # In production, this would query the database
        # For now, return sample questions
        questions = []
        for q in SAMPLE_QUESTIONS:
            questions.append({
                'id': q['id'],
                'domain': q['domain'],
                'question_text': q['question_text'],
                'option_a': q['option_a'],
                'option_b': q['option_b'],
                'option_c': q['option_c'],
                'option_d': q['option_d']
                # correct_answer and explanation intentionally omitted from payload
            })

        return jsonify({
            'questions': questions,
            'total_questions': len(questions),
            'domains': DOMAINS
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get questions', 'details': str(e)}), 500

@assessment_bp.route('/submit', methods=['POST'])
def submit_assessment():
    """Submit assessment answers and get results"""
    try:
        data = request.get_json()
        
        if not data.get('answers'):
            return jsonify({'error': 'Answers are required'}), 400
        
        answers = data['answers']  # Expected format: {'1': 'A', '2': 'B', ...}
        time_taken = data.get('time_taken_minutes', 0)
        
        # Calculate scores
        total_score = 0
        max_score = len(SAMPLE_QUESTIONS)
        domain_scores = {domain: 0 for domain in DOMAINS}
        domain_totals = {domain: 0 for domain in DOMAINS}
        
        detailed_results = []
        
        for question in SAMPLE_QUESTIONS:
            q_id = question['id']
            domain = question['domain']
            correct = question['correct_answer']
            user_answer = answers.get(q_id, '')
            
            domain_totals[domain] += 1
            
            is_correct = user_answer.upper() == correct.upper()
            if is_correct:
                total_score += 1
                domain_scores[domain] += 1
            
            detailed_results.append({
                'question_id': q_id,
                'domain': domain,
                'user_answer': user_answer,
                'correct_answer': correct,
                'is_correct': is_correct,
                'explanation': question['explanation']
            })
        
        percentage = (total_score / max_score) * 100 if max_score > 0 else 0
        
        # Generate recommendations based on performance
        score_band = classify_score(total_score)
        recommendations = generate_recommendations(domain_scores, domain_totals, total_score, score_band)
        
        # Save results if user is authenticated
        user_id = None
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except:
            pass  # User not authenticated, continue without saving
        
        if user_id:
            # Persisting the first four domain scores to fit the current schema
            domain_values = [domain_scores.get(domain, 0) for domain in DOMAINS]
            padded_values = domain_values + [0] * (4 - len(domain_values))

            result = AssessmentResult(
                user_id=user_id,
                total_score=total_score,
                max_score=max_score,
                percentage=percentage,
                functional_score=padded_values[0],
                ethical_score=padded_values[1],
                rhetorical_score=padded_values[2],
                pedagogical_score=padded_values[3],
                time_taken_minutes=time_taken,
                recommendations=json.dumps({
                    'insights': recommendations,
                    'strategic_score': domain_scores.get('Strategic Understanding', 0)
                })
            )
            db.session.add(result)
            db.session.commit()

        domain_scores_response = {}
        for domain in DOMAINS:
            domain_scores_response[domain] = {
                'score': domain_scores[domain],
                'total': domain_totals[domain]
            }

        return jsonify({
            'total_score': total_score,
            'max_score': max_score,
            'percentage': round(percentage, 1),
            'domain_scores': domain_scores_response,
            'recommendations': recommendations,
            'detailed_results': detailed_results,
            'time_taken_minutes': time_taken,
            'score_band': score_band,
            'saved': user_id is not None
        }), 200
        
    except Exception as e:
        if user_id:
            db.session.rollback()
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

@assessment_bp.route('/history', methods=['GET'])
@jwt_required()
def get_assessment_history():
    """Get user's assessment history"""
    try:
        user_id = get_jwt_identity()
        
        results = AssessmentResult.query.filter_by(user_id=user_id)\
                                      .order_by(AssessmentResult.completed_at.desc())\
                                      .all()
        
        history = []
        for result in results:
            strategic_score = None
            recommendation_payload = []
            if result.recommendations:
                try:
                    parsed = json.loads(result.recommendations)
                    if isinstance(parsed, dict):
                        recommendation_payload = parsed.get('insights', [])
                        strategic_score = parsed.get('strategic_score')
                    else:
                        recommendation_payload = parsed
                except Exception:
                    recommendation_payload = []

            score_lookup = {
                'AI Fundamentals': result.functional_score or 0,
                'Practical Usage': result.ethical_score or 0,
                'Ethics & Critical Thinking': result.rhetorical_score or 0,
                'AI Impact & Applications': result.pedagogical_score or 0,
                'Strategic Understanding': strategic_score or 0
            }

            domain_scores_payload = {}
            for domain in DOMAINS:
                domain_scores_payload[domain] = {
                    'score': score_lookup.get(domain, 0),
                    'total': DOMAIN_TOTALS.get(domain, 0)
                }

            history.append({
                'id': result.id,
                'total_score': result.total_score,
                'max_score': result.max_score,
                'percentage': result.percentage,
                'score_band': classify_score(result.total_score),
                'domain_scores': domain_scores_payload,
                'time_taken_minutes': result.time_taken_minutes,
                'completed_at': result.completed_at.isoformat(),
                'recommendations': recommendation_payload
            })

        return jsonify({'history': history}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get assessment history', 'details': str(e)}), 500
