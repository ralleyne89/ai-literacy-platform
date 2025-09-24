from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from models import db, Assessment, AssessmentResult, User
from datetime import datetime
import json

assessment_bp = Blueprint('assessment', __name__)

# Sample assessment questions - in production, these would be in the database
SAMPLE_QUESTIONS = [
    {
        "id": "1",
        "domain": "Functional",
        "question_text": "Which of the following best describes the primary function of a Large Language Model (LLM)?",
        "option_a": "To store and retrieve large amounts of data efficiently",
        "option_b": "To generate human-like text based on patterns learned from training data",
        "option_c": "To perform complex mathematical calculations at high speed",
        "option_d": "To create visual representations of data and information",
        "correct_answer": "B",
        "explanation": "LLMs are designed to understand and generate human-like text by learning patterns from vast amounts of text data during training."
    },
    {
        "id": "2",
        "domain": "Ethical",
        "question_text": "What is the most important consideration when using AI tools for hiring decisions?",
        "option_a": "Ensuring the AI can process applications faster than humans",
        "option_b": "Making sure the AI reduces hiring costs significantly",
        "option_c": "Checking for bias and ensuring fair treatment of all candidates",
        "option_d": "Implementing AI that can work without any human oversight",
        "correct_answer": "C",
        "explanation": "Bias detection and fair treatment are crucial ethical considerations when using AI in hiring to avoid discrimination."
    },
    {
        "id": "3",
        "domain": "Rhetorical",
        "question_text": "When communicating AI-generated content to stakeholders, what should you prioritize?",
        "option_a": "Hiding the fact that AI was used to maintain credibility",
        "option_b": "Emphasizing the speed at which the content was created",
        "option_c": "Being transparent about AI use and explaining the value it provides",
        "option_d": "Focusing only on the technical capabilities of the AI system",
        "correct_answer": "C",
        "explanation": "Transparency about AI use builds trust and helps stakeholders understand the value and limitations of AI-generated content."
    },
    {
        "id": "4",
        "domain": "Pedagogical",
        "question_text": "What is the most effective approach to learning AI tools in a workplace setting?",
        "option_a": "Reading comprehensive technical documentation independently",
        "option_b": "Watching online tutorials without hands-on practice",
        "option_c": "Combining theoretical knowledge with practical, role-specific applications",
        "option_d": "Focusing exclusively on the latest AI trends and technologies",
        "correct_answer": "C",
        "explanation": "Effective AI learning combines understanding concepts with practical application in real workplace scenarios."
    },
    {
        "id": "5",
        "domain": "Functional",
        "question_text": "Which prompt engineering technique is most effective for getting specific, actionable outputs from AI?",
        "option_a": "Using very short, one-word prompts",
        "option_b": "Providing clear context, specific instructions, and desired output format",
        "option_c": "Writing extremely long prompts with every possible detail",
        "option_d": "Using technical jargon and complex terminology",
        "correct_answer": "B",
        "explanation": "Clear context, specific instructions, and format specifications help AI generate more useful and actionable outputs."
    }
]

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
                # Note: correct_answer and explanation are not included in the response
            })
        
        return jsonify({
            'questions': questions,
            'total_questions': len(questions),
            'domains': ['Functional', 'Ethical', 'Rhetorical', 'Pedagogical']
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
        domain_scores = {'Functional': 0, 'Ethical': 0, 'Rhetorical': 0, 'Pedagogical': 0}
        domain_totals = {'Functional': 0, 'Ethical': 0, 'Rhetorical': 0, 'Pedagogical': 0}
        
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
        recommendations = generate_recommendations(domain_scores, domain_totals, percentage)
        
        # Save results if user is authenticated
        user_id = None
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except:
            pass  # User not authenticated, continue without saving
        
        if user_id:
            result = AssessmentResult(
                user_id=user_id,
                total_score=total_score,
                max_score=max_score,
                percentage=percentage,
                functional_score=domain_scores['Functional'],
                ethical_score=domain_scores['Ethical'],
                rhetorical_score=domain_scores['Rhetorical'],
                pedagogical_score=domain_scores['Pedagogical'],
                time_taken_minutes=time_taken,
                recommendations=json.dumps(recommendations)
            )
            db.session.add(result)
            db.session.commit()
        
        return jsonify({
            'total_score': total_score,
            'max_score': max_score,
            'percentage': round(percentage, 1),
            'domain_scores': {
                'functional': {'score': domain_scores['Functional'], 'total': domain_totals['Functional']},
                'ethical': {'score': domain_scores['Ethical'], 'total': domain_totals['Ethical']},
                'rhetorical': {'score': domain_scores['Rhetorical'], 'total': domain_totals['Rhetorical']},
                'pedagogical': {'score': domain_scores['Pedagogical'], 'total': domain_totals['Pedagogical']}
            },
            'recommendations': recommendations,
            'detailed_results': detailed_results,
            'time_taken_minutes': time_taken,
            'saved': user_id is not None
        }), 200
        
    except Exception as e:
        if user_id:
            db.session.rollback()
        return jsonify({'error': 'Failed to submit assessment', 'details': str(e)}), 500

def generate_recommendations(domain_scores, domain_totals, overall_percentage):
    """Generate personalized recommendations based on assessment results"""
    recommendations = []
    
    # Overall performance recommendations
    if overall_percentage >= 80:
        recommendations.append({
            'type': 'overall',
            'title': 'Excellent AI Literacy Foundation',
            'description': 'You demonstrate strong AI literacy across all domains. Consider advanced training modules and certification.',
            'priority': 'high',
            'action': 'Explore our Professional certification track'
        })
    elif overall_percentage >= 60:
        recommendations.append({
            'type': 'overall',
            'title': 'Good AI Understanding',
            'description': 'You have a solid foundation. Focus on strengthening weaker areas for comprehensive AI literacy.',
            'priority': 'medium',
            'action': 'Take targeted training modules in lower-scoring domains'
        })
    else:
        recommendations.append({
            'type': 'overall',
            'title': 'Building AI Literacy',
            'description': 'Great start! Focus on foundational concepts and practical applications to build your AI skills.',
            'priority': 'high',
            'action': 'Start with our beginner-friendly training modules'
        })
    
    # Domain-specific recommendations
    for domain, score in domain_scores.items():
        total = domain_totals[domain]
        percentage = (score / total) * 100 if total > 0 else 0
        
        if percentage < 50:
            recommendations.append({
                'type': 'domain',
                'domain': domain.lower(),
                'title': f'Strengthen {domain} AI Skills',
                'description': f'Focus on {domain.lower()} aspects of AI to improve your overall literacy.',
                'priority': 'high',
                'action': f'Take {domain.lower()}-focused training modules'
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
            history.append({
                'id': result.id,
                'total_score': result.total_score,
                'max_score': result.max_score,
                'percentage': result.percentage,
                'domain_scores': {
                    'functional': result.functional_score,
                    'ethical': result.ethical_score,
                    'rhetorical': result.rhetorical_score,
                    'pedagogical': result.pedagogical_score
                },
                'time_taken_minutes': result.time_taken_minutes,
                'completed_at': result.completed_at.isoformat(),
                'recommendations': json.loads(result.recommendations) if result.recommendations else []
            })
        
        return jsonify({'history': history}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get assessment history', 'details': str(e)}), 500
