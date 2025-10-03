from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, TrainingModule, UserProgress
from datetime import datetime
import json
import uuid

training_bp = Blueprint('training', __name__)

DEFAULT_MODULES = [
    {
        'id': 'module-ai-sales',
        'title': 'AI Fundamentals for Sales Teams',
        'description': 'Leverage AI for lead generation, customer insights, and pipeline prioritization with practical playbooks for sales.',
        'role_specific': 'Sales',
        'difficulty_level': 1,
        'estimated_duration_minutes': 45,
        'content_type': 'video',
        'is_premium': False,
        'content_url': 'https://www.youtube.com/embed/f6BtsZ-eZkU',
        'learning_objectives': [
            'Understand AI-assisted prospecting workflows',
            'Automate lead scoring and next-best action recommendations',
            'Build sales enablement assets with generative AI'
        ],
        'prerequisites': [
            'Familiarity with your CRM or sales engagement platform',
            'Baseline understanding of your sales funnel stages'
        ],
        'resources': [
            {
                'label': 'AI Discovery Call Script Template',
                'url': 'https://drive.google.com/your-template'
            },
            {
                'label': 'Sample AI-Assisted Prospecting Workflow',
                'url': 'https://www.notion.so/your-workflow'
            }
        ],
        'content_sections': [
            {
                'title': 'AI Opportunity Landscape for Sales',
                'summary': 'Where AI accelerates outbound, inbound, and account expansion motions.',
                'duration_minutes': 8
            },
            {
                'title': 'Prompt Engineering for Sales Emails',
                'summary': 'Framework and live demo for writing hyper-personalized outreach prompts.',
                'duration_minutes': 14
            },
            {
                'title': 'Hands-on Lab: Build a Sales Playbook',
                'summary': 'Guided exercise to build a multi-touch campaign using generative AI.',
                'duration_minutes': 18
            }
        ]
    },
    {
        'id': 'module-ethical-hr',
        'title': 'Ethical AI in HR Practices',
        'description': 'Implement AI hiring and talent management responsibly with governance guardrails and bias mitigation steps.',
        'role_specific': 'HR',
        'difficulty_level': 2,
        'estimated_duration_minutes': 55,
        'content_type': 'video',
        'is_premium': False,
        'content_url': 'https://www.youtube.com/embed/szO4cFfF07I',
        'learning_objectives': [
            'Audit datasets and models for potential bias',
            'Design fair review workflows combining humans and AI',
            'Create transparent AI usage policies for employees'
        ],
        'prerequisites': [
            'Basic understanding of your talent lifecycle',
            'Awareness of regional employment regulations'
        ],
        'resources': [
            {
                'label': 'Bias Assessment Checklist',
                'url': 'https://example.com/bias-checklist.pdf'
            },
            {
                'label': 'Responsible AI Policy Template',
                'url': 'https://example.com/ai-policy-template'
            }
        ],
        'content_sections': [
            {
                'title': 'Foundations of Responsible AI in People Ops',
                'summary': 'Core principles for ethical automation in recruitment and performance cycles.',
                'duration_minutes': 10
            },
            {
                'title': 'Mitigating Bias During Screening',
                'summary': 'Human-in-the-loop review techniques and tooling recommendations.',
                'duration_minutes': 20
            },
            {
                'title': 'Designing Transparent Employee Communication',
                'summary': 'How to explain AI decisions to candidates and employees.',
                'duration_minutes': 15
            }
        ]
    },
    {
        'id': 'module-marketing-ai',
        'title': 'AI-Powered Marketing Campaigns',
        'description': 'Create adaptive marketing campaigns using AI for content, segmentation, and performance optimization.',
        'role_specific': 'Marketing',
        'difficulty_level': 2,
        'estimated_duration_minutes': 60,
        'content_type': 'video',
        'is_premium': True,
        'content_url': 'https://www.youtube.com/embed/x4PeQ0P5Y14',
        'learning_objectives': [
            'Generate campaign briefs and creative variations using AI',
            'Build dynamic audience segments from zero-party data',
            'Automate experimentation with AI-assisted analytics'
        ],
        'prerequisites': [
            'Access to your marketing automation platform',
            'Baseline persona definitions and ICP clarity'
        ],
        'resources': [
            {
                'label': 'AI Campaign Brief Prompt Pack',
                'url': 'https://example.com/marketing-prompts'
            }
        ],
        'content_sections': [
            {
                'title': 'From ICP to AI-Powered Segmentation',
                'summary': 'Translate personas into AI-ready segmentation prompts.',
                'duration_minutes': 12
            },
            {
                'title': 'Content Generation Systems',
                'summary': 'Build a structured prompting system for multi-channel content.',
                'duration_minutes': 18
            },
            {
                'title': 'Measurement & Iteration',
                'summary': 'Instrument AI-assisted campaign dashboards for rapid iteration.',
                'duration_minutes': 17
            }
        ]
    },
    {
        'id': 'module-ops-ai',
        'title': 'Operational Efficiency with AI',
        'description': 'Automate operations with AI copilots for process documentation, forecasting, and scenario planning.',
        'role_specific': 'Operations',
        'difficulty_level': 3,
        'estimated_duration_minutes': 65,
        'content_type': 'interactive',
        'is_premium': True,
        'content_url': 'https://www.youtube.com/embed/9dME8NwB1Vw',
        'learning_objectives': [
            'Map processes to automation opportunities',
            'Deploy decision-support copilots for forecasting',
            'Design resilient human-in-loop oversight models'
        ],
        'prerequisites': [
            'Process documentation for core workflows',
            'Access to operational performance data'
        ],
        'resources': [
            {
                'label': 'AI Copilot Business Case Template',
                'url': 'https://example.com/ops-business-case'
            }
        ],
        'content_sections': [
            {
                'title': 'Identifying Automation Wins',
                'summary': 'Assess effort vs. impact using an AI automation scorecard.',
                'duration_minutes': 15
            },
            {
                'title': 'Designing Copilot Interfaces',
                'summary': 'Key design patterns for conversational copilots in operations.',
                'duration_minutes': 20
            },
            {
                'title': 'Governance and Monitoring',
                'summary': 'Set success metrics and ongoing monitoring routines.',
                'duration_minutes': 18
            }
        ]
    },
    {
        'id': 'module-prompt-master',
        'title': 'Prompt Engineering Mastery',
        'description': 'Master advanced prompt patterns, system instructions, and evaluation loops for reliable AI outputs.',
        'role_specific': 'General',
        'difficulty_level': 2,
        'estimated_duration_minutes': 50,
        'content_type': 'interactive',
        'is_premium': False,
        'content_url': 'https://www.youtube.com/embed/wVzuvf9D9BU',
        'learning_objectives': [
            'Apply advanced prompt frameworks like IDEA & CRAFT',
            'Chain multi-step prompts with memory and guardrails',
            'Evaluate and iterate prompts using quality rubrics'
        ],
        'prerequisites': [
            'Basic familiarity with large language models',
            'An AI workspace (ChatGPT, Claude, Gemini, etc.)'
        ],
        'resources': [
            {
                'label': 'Prompt Evaluation Scorecard',
                'url': 'https://example.com/prompt-scorecard'
            }
        ],
        'content_sections': [
            {
                'title': 'Prompt Design Fundamentals',
                'summary': 'Core building blocks: instructions, context, format, examples, tone.',
                'duration_minutes': 10
            },
            {
                'title': 'Midjourney, GPT, and Claude Patterns',
                'summary': 'Adapting prompts across creative, analytical, and strategic use cases.',
                'duration_minutes': 16
            },
            {
                'title': 'Evaluation & Refinement Lab',
                'summary': 'Hands-on exercises with scoring rubrics and rapid iteration cycles.',
                'duration_minutes': 18
            }
        ]
    }
]


def ensure_training_modules_seeded():
    for module_data in DEFAULT_MODULES:
        existing = TrainingModule.query.get(module_data['id'])
        if existing:
            existing.title = module_data['title']
            existing.description = module_data['description']
            existing.role_specific = module_data['role_specific']
            existing.difficulty_level = module_data['difficulty_level']
            existing.estimated_duration_minutes = module_data['estimated_duration_minutes']
            existing.content_type = module_data['content_type']
            existing.content_url = module_data['content_url']
            existing.learning_objectives = json.dumps(module_data['learning_objectives'])
            existing.prerequisites = json.dumps({
                'requirements': module_data['prerequisites'],
                'resources': module_data['resources'],
                'sections': module_data['content_sections']
            })
            existing.is_premium = module_data['is_premium']
            existing.is_active = True
        else:
            module = TrainingModule(
                id=module_data['id'],
                title=module_data['title'],
                description=module_data['description'],
                role_specific=module_data['role_specific'],
                difficulty_level=module_data['difficulty_level'],
                estimated_duration_minutes=module_data['estimated_duration_minutes'],
                content_type=module_data['content_type'],
                content_url=module_data['content_url'],
                learning_objectives=json.dumps(module_data['learning_objectives']),
                prerequisites=json.dumps({
                    'requirements': module_data['prerequisites'],
                    'resources': module_data['resources'],
                    'sections': module_data['content_sections']
                }),
                is_premium=module_data['is_premium']
            )
            db.session.add(module)

    db.session.commit()


def parse_json_field(value, default=None):
    if value is None:
        return default if default is not None else []
    try:
        data = json.loads(value)
        return data
    except Exception:
        return default if default is not None else []


def serialize_module(module, include_details=False):
    prerequisites_payload = parse_json_field(module.prerequisites, {})
    if isinstance(prerequisites_payload, list):
        prerequisites_list = prerequisites_payload
        resources = []
        content_sections = []
    elif isinstance(prerequisites_payload, dict):
        prerequisites_list = prerequisites_payload.get('requirements', [])
        resources = prerequisites_payload.get('resources', [])
        content_sections = prerequisites_payload.get('sections', [])
    else:
        prerequisites_list = []
        resources = []
        content_sections = []

    learning_objectives = parse_json_field(module.learning_objectives, [])

    payload = {
        'id': module.id,
        'title': module.title,
        'description': module.description,
        'role_specific': module.role_specific,
        'difficulty_level': module.difficulty_level,
        'estimated_duration_minutes': module.estimated_duration_minutes,
        'content_type': module.content_type,
        'content_url': module.content_url,
        'is_premium': module.is_premium,
        'learning_objectives': learning_objectives,
        'prerequisites': prerequisites_list
    }

    if include_details:
        payload.update({
            'resources': resources,
            'content_sections': content_sections,
            'created_at': module.created_at.isoformat() if module.created_at else None
        })

    return payload


@training_bp.route('/modules', methods=['GET'])
def get_training_modules():
    """Get available training modules"""
    try:
        ensure_training_modules_seeded()

        role_filter = request.args.get('role')
        query = TrainingModule.query.filter_by(is_active=True)

        if role_filter:
            query = query.filter(
                (TrainingModule.role_specific == role_filter) |
                (TrainingModule.role_specific == 'General')
            )

        modules = [serialize_module(module) for module in query.order_by(TrainingModule.title.asc()).all()]

        return jsonify({'modules': modules}), 200

    except Exception as e:
        return jsonify({'error': 'Failed to get training modules', 'details': str(e)}), 500


@training_bp.route('/modules/<module_id>', methods=['GET'])
def get_training_module_detail(module_id):
    try:
        ensure_training_modules_seeded()
        module = TrainingModule.query.get(module_id)
        if not module or not module.is_active:
            return jsonify({'error': 'Module not found'}), 404

        return jsonify({'module': serialize_module(module, include_details=True)}), 200

    except Exception as e:
        return jsonify({'error': 'Failed to get module', 'details': str(e)}), 500


@training_bp.route('/progress', methods=['GET'])
@jwt_required()
def get_user_progress():
    """Get user's training progress"""
    try:
        user_id = get_jwt_identity()
        ensure_training_modules_seeded()

        records = (UserProgress.query
                   .filter_by(user_id=user_id)
                   .join(TrainingModule, TrainingModule.id == UserProgress.module_id)
                   .add_entity(TrainingModule)
                   .all())

        progress_payload = []
        for progress, module in records:
            progress_payload.append({
                'module_id': progress.module_id,
                'module_title': module.title,
                'status': progress.status,
                'progress_percentage': progress.progress_percentage,
                'time_spent_minutes': progress.time_spent_minutes,
                'last_accessed': progress.last_accessed.isoformat() if progress.last_accessed else None,
                'completed_at': progress.completed_at.isoformat() if progress.completed_at else None
            })

        return jsonify({'progress': progress_payload}), 200

    except Exception as e:
        return jsonify({'error': 'Failed to get progress', 'details': str(e)}), 500


@training_bp.route('/enroll/<module_id>', methods=['POST'])
@jwt_required()
def enroll_in_module(module_id):
    """Enroll user in a training module"""
    try:
        user_id = get_jwt_identity()

        ensure_training_modules_seeded()
        module = TrainingModule.query.get(module_id)
        if not module or not module.is_active:
            return jsonify({'error': 'Module not found'}), 404

        progress = UserProgress.query.filter_by(user_id=user_id, module_id=module_id).first()

        if progress:
            progress.status = 'in_progress'
            progress.last_accessed = datetime.utcnow()
        else:
            progress = UserProgress(
                id=str(uuid.uuid4()),
                user_id=user_id,
                module_id=module_id,
                status='in_progress',
                progress_percentage=0,
                time_spent_minutes=0,
                started_at=datetime.utcnow(),
                last_accessed=datetime.utcnow()
            )
            db.session.add(progress)

        db.session.commit()

        return jsonify({
            'message': 'Successfully enrolled in module',
            'module_id': module_id,
            'status': progress.status
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to enroll in module', 'details': str(e)}), 500


@training_bp.route('/progress/<module_id>', methods=['PUT'])
@jwt_required()
def update_progress(module_id):
    """Update user's progress in a module"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}

        progress_percentage = data.get('progress_percentage', 0)
        time_spent = data.get('time_spent_minutes', 0)
        status = data.get('status', 'in_progress')
        mark_complete = status == 'completed' or progress_percentage >= 100

        ensure_training_modules_seeded()
        module = TrainingModule.query.get(module_id)
        if not module or not module.is_active:
            return jsonify({'error': 'Module not found'}), 404

        progress = UserProgress.query.filter_by(user_id=user_id, module_id=module_id).first()

        if not progress:
            progress = UserProgress(
                id=str(uuid.uuid4()),
                user_id=user_id,
                module_id=module_id,
                status='in_progress',
                progress_percentage=0,
                time_spent_minutes=0,
                started_at=datetime.utcnow()
            )
            db.session.add(progress)

        progress.progress_percentage = min(100, max(progress_percentage, progress.progress_percentage or 0))
        progress.time_spent_minutes = max(time_spent, progress.time_spent_minutes or 0)
        progress.status = 'completed' if mark_complete else 'in_progress'
        progress.last_accessed = datetime.utcnow()

        if mark_complete and not progress.completed_at:
            progress.completed_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'message': 'Progress updated successfully',
            'module_id': module_id,
            'status': progress.status,
            'progress_percentage': progress.progress_percentage,
            'time_spent_minutes': progress.time_spent_minutes,
            'completed_at': progress.completed_at.isoformat() if progress.completed_at else None
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update progress', 'details': str(e)}), 500
