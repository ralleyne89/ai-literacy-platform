import json

from models import TrainingModule, db

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
            {'label': 'AI Discovery Call Script Template', 'url': 'https://drive.google.com/your-template'},
            {'label': 'Sample AI-Assisted Prospecting Workflow', 'url': 'https://www.notion.so/your-workflow'}
        ],
        'content_sections': [
            {'title': 'AI Opportunity Landscape for Sales', 'summary': 'Where AI accelerates outbound, inbound, and account expansion motions.', 'duration_minutes': 8},
            {'title': 'Prompt Engineering for Sales Emails', 'summary': 'Framework and live demo for writing hyper-personalized outreach prompts.', 'duration_minutes': 14},
            {'title': 'Hands-on Lab: Build a Sales Playbook', 'summary': 'Guided exercise to build a multi-touch campaign using generative AI.', 'duration_minutes': 18}
        ],
        'metadata': {
            'provider': 'LitmusAI Originals',
            'access_tier': 'professional',
            'format': 'video',
            'accreditation': 'Internal certificate of completion'
        },
        'target_domains': ['Practical Usage', 'AI Impact & Applications']
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
            {'label': 'Bias Assessment Checklist', 'url': 'https://example.com/bias-checklist.pdf'},
            {'label': 'Responsible AI Policy Template', 'url': 'https://example.com/ai-policy-template'}
        ],
        'content_sections': [
            {'title': 'Foundations of Responsible AI in People Ops', 'summary': 'Core principles for ethical automation in recruitment and performance cycles.', 'duration_minutes': 10},
            {'title': 'Mitigating Bias During Screening', 'summary': 'Human-in-the-loop review techniques and tooling recommendations.', 'duration_minutes': 20},
            {'title': 'Designing Transparent Employee Communication', 'summary': 'How to explain AI decisions to candidates and employees.', 'duration_minutes': 15}
        ],
        'metadata': {
            'provider': 'LitmusAI Originals',
            'access_tier': 'professional',
            'format': 'video',
            'accreditation': 'Internal certificate of completion'
        },
        'target_domains': ['Ethics & Critical Thinking', 'AI Impact & Applications']
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
            {'label': 'AI Campaign Brief Prompt Pack', 'url': 'https://example.com/marketing-prompts'}
        ],
        'content_sections': [
            {'title': 'From ICP to AI-Powered Segmentation', 'summary': 'Translate personas into AI-ready segmentation prompts.', 'duration_minutes': 12},
            {'title': 'Content Generation Systems', 'summary': 'Build a structured prompting system for multi-channel content.', 'duration_minutes': 18},
            {'title': 'Measurement & Iteration', 'summary': 'Instrument AI-assisted campaign dashboards for rapid iteration.', 'duration_minutes': 17}
        ],
        'metadata': {
            'provider': 'LitmusAI Originals',
            'access_tier': 'enterprise',
            'format': 'video',
            'accreditation': 'Internal certificate of completion'
        },
        'target_domains': ['Practical Usage', 'Strategic Understanding']
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
            {'label': 'AI Copilot Business Case Template', 'url': 'https://example.com/ops-business-case'}
        ],
        'content_sections': [
            {'title': 'Identifying Automation Wins', 'summary': 'Assess effort vs. impact using an AI automation scorecard.', 'duration_minutes': 15},
            {'title': 'Designing Copilot Interfaces', 'summary': 'Key design patterns for conversational copilots in operations.', 'duration_minutes': 20},
            {'title': 'Governance and Monitoring', 'summary': 'Set success metrics and ongoing monitoring routines.', 'duration_minutes': 18}
        ],
        'metadata': {
            'provider': 'LitmusAI Originals',
            'access_tier': 'enterprise',
            'format': 'interactive',
            'accreditation': 'Internal certificate of completion'
        },
        'target_domains': ['Strategic Understanding', 'AI Impact & Applications']
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
            {'label': 'Prompt Evaluation Scorecard', 'url': 'https://example.com/prompt-scorecard'}
        ],
        'content_sections': [
            {'title': 'Prompt Design Fundamentals', 'summary': 'Core building blocks: instructions, context, format, examples, tone.', 'duration_minutes': 10},
            {'title': 'Midjourney, GPT, and Claude Patterns', 'summary': 'Adapting prompts across creative, analytical, and strategic use cases.', 'duration_minutes': 16},
            {'title': 'Evaluation & Refinement Lab', 'summary': 'Hands-on exercises with scoring rubrics and rapid iteration cycles.', 'duration_minutes': 18}
        ],
        'metadata': {
            'provider': 'LitmusAI Originals',
            'access_tier': 'professional',
            'format': 'interactive',
            'accreditation': 'Internal certificate of completion'
        },
        'target_domains': ['Practical Usage', 'AI Fundamentals']
    },
    {
        'id': 'module-google-ai-essentials',
        'title': 'Google AI Essentials',
        'description': 'Google’s free program that demystifies AI fundamentals and shows how to integrate it responsibly into everyday workflows.',
        'role_specific': 'General',
        'difficulty_level': 1,
        'estimated_duration_minutes': 180,
        'content_type': 'external',
        'is_premium': False,
        'content_url': 'https://grow.google/certificates/ai-essentials/',
        'learning_objectives': [
            'Understand core AI terminology and responsible use principles',
            'Apply AI prompts to boost productivity and creativity',
            'Identify real-world opportunities to automate tasks with AI tools'
        ],
        'prerequisites': [],
        'resources': [],
        'content_sections': [],
        'metadata': {
            'provider': 'Google',
            'access_tier': 'free',
            'format': 'self-paced course',
            'accreditation': 'Google AI Essentials Certificate',
            'external_url': 'https://grow.google/certificates/ai-essentials/',
            'attribution': '© Google LLC. Content linked under free access terms.'
        },
        'target_domains': ['AI Fundamentals', 'Practical Usage']
    },
    {
        'id': 'module-elements-of-ai',
        'title': 'Elements of AI',
        'description': 'A globally recognized introduction to artificial intelligence created by the University of Helsinki and MinnaLearn.',
        'role_specific': 'General',
        'difficulty_level': 1,
        'estimated_duration_minutes': 420,
        'content_type': 'external',
        'is_premium': False,
        'content_url': 'https://www.elementsofai.com/',
        'learning_objectives': [
            'Explain foundational AI concepts and terminology',
            'Recognize the societal impact and ethical considerations of AI',
            'Complete interactive exercises that reinforce core concepts'
        ],
        'prerequisites': [],
        'resources': [],
        'content_sections': [],
        'metadata': {
            'provider': 'University of Helsinki & MinnaLearn',
            'access_tier': 'free',
            'format': 'interactive MOOC',
            'accreditation': 'Free certificate upon completion',
            'external_url': 'https://www.elementsofai.com/',
            'attribution': 'Elements of AI content © University of Helsinki & MinnaLearn. Offered under specified terms.'
        },
        'target_domains': ['AI Fundamentals', 'Ethics & Critical Thinking']
    },
    {
        'id': 'module-ibm-skillsbuild',
        'title': 'IBM SkillsBuild: AI Fundamentals',
        'description': 'IBM’s SkillsBuild pathway covering AI fundamentals, ethics, and hands-on labs for students and professionals.',
        'role_specific': 'General',
        'difficulty_level': 1,
        'estimated_duration_minutes': 300,
        'content_type': 'external',
        'is_premium': False,
        'content_url': 'https://skillsbuild.org/',
        'learning_objectives': [
            'Discover how AI systems are designed and evaluated',
            'Practice with AI services through guided labs',
            'Earn IBM digital credentials for career advancement'
        ],
        'prerequisites': [],
        'resources': [],
        'content_sections': [],
        'metadata': {
            'provider': 'IBM SkillsBuild',
            'access_tier': 'free',
            'format': 'online pathway',
            'accreditation': 'IBM digital credential',
            'external_url': 'https://skillsbuild.org/',
            'attribution': 'IBM SkillsBuild is a trademark of IBM and used with attribution.'
        },
        'target_domains': ['AI Fundamentals', 'Practical Usage', 'Ethics & Critical Thinking']
    },
    {
        'id': 'module-freecodecamp-ai',
        'title': 'freeCodeCamp: Machine Learning with Python',
        'description': 'Project-based curriculum covering machine learning fundamentals using Python, NumPy, pandas, and scikit-learn.',
        'role_specific': 'General',
        'difficulty_level': 2,
        'estimated_duration_minutes': 600,
        'content_type': 'external',
        'is_premium': False,
        'content_url': 'https://www.freecodecamp.org/learn/machine-learning-with-python/',
        'learning_objectives': [
            'Build and evaluate machine learning models in Python',
            'Complete hands-on projects credited toward freeCodeCamp certifications',
            'Prepare for intermediate data science and ML roles'
        ],
        'prerequisites': [],
        'resources': [],
        'content_sections': [],
        'metadata': {
            'provider': 'freeCodeCamp',
            'access_tier': 'free',
            'format': 'project-based course',
            'accreditation': 'freeCodeCamp Machine Learning with Python certification',
            'external_url': 'https://www.freecodecamp.org/learn/machine-learning-with-python/',
            'attribution': 'freeCodeCamp® content used under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International license.'
        }
    },
    {
        'id': 'module-mit-ocw-ai',
        'title': 'MIT OpenCourseWare: Artificial Intelligence',
        'description': 'Access MIT’s graduate-level AI lectures, assignments, and exams via OCW’s open license repository.',
        'role_specific': 'General',
        'difficulty_level': 3,
        'estimated_duration_minutes': 900,
        'content_type': 'external',
        'is_premium': True,
        'content_url': 'https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2020/',
        'learning_objectives': [
            'Study search, knowledge representation, learning, and reasoning at MIT depth',
            'Review lecture notes, assignments, and solutions for self-paced mastery',
            'Qualify learners for advanced AI leadership pathways'
        ],
        'prerequisites': [],
        'resources': [],
        'content_sections': [],
        'metadata': {
            'provider': 'MIT OpenCourseWare',
            'access_tier': 'enterprise',
            'format': 'open courseware',
            'accreditation': 'No formal certificate; recognized MIT curriculum',
            'external_url': 'https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2020/',
            'attribution': 'Content © Massachusetts Institute of Technology, licensed under Creative Commons BY-NC-SA.'
        }
    },
    {
        'id': 'module-stanford-cs229',
        'title': 'Stanford CS229 Machine Learning',
        'description': 'Stanford University’s famed graduate machine learning course, made available via open course materials.',
        'role_specific': 'General',
        'difficulty_level': 4,
        'estimated_duration_minutes': 960,
        'content_type': 'external',
        'is_premium': True,
        'content_url': 'https://cs229.stanford.edu/',
        'learning_objectives': [
            'Master supervised, unsupervised, and reinforcement learning at graduate depth',
            'Complete mathematical derivations and problem sets used in Stanford’s curriculum',
            'Prepare for advanced AI research or enterprise leadership roles'
        ],
        'prerequisites': [],
        'resources': [],
        'content_sections': [],
        'metadata': {
            'provider': 'Stanford University',
            'access_tier': 'enterprise',
            'format': 'open courseware',
            'accreditation': 'No formal certificate; globally recognized curriculum',
            'external_url': 'https://cs229.stanford.edu/',
            'attribution': '© Stanford University. Materials linked for educational use.'
        }
    },
    {
        'id': 'module-umaryland-ai-cert',
        'title': 'University of Maryland: Introduction to Artificial Intelligence',
        'description': 'A fully free introductory AI certificate program offered by the University of Maryland.',
        'role_specific': 'General',
        'difficulty_level': 1,
        'estimated_duration_minutes': 360,
        'content_type': 'external',
        'is_premium': False,
        'content_url': 'https://www.umgc.edu/artificial-intelligence',
        'learning_objectives': [
            'Study AI foundational concepts with academic rigor',
            'Earn a university-backed certificate with no tuition cost',
            'Build a portfolio of AI assignments validated by faculty'
        ],
        'prerequisites': [],
        'resources': [],
        'content_sections': [],
        'metadata': {
            'provider': 'University of Maryland',
            'access_tier': 'free',
            'format': 'certificate program',
            'accreditation': 'University of Maryland certificate',
            'external_url': 'https://www.umgc.edu/artificial-intelligence',
            'attribution': 'Course information sourced from the University of Maryland Global Campus.'
        }
    },
    {
        'id': 'module-coursera-business',
        'title': 'Coursera for Business Partnerships',
        'description': 'Negotiate enterprise licensing for Coursera’s AI specializations and professional certificates.',
        'role_specific': 'General',
        'difficulty_level': 2,
        'estimated_duration_minutes': 60,
        'content_type': 'partner',
        'is_premium': True,
        'content_url': 'https://www.coursera.org/business',
        'learning_objectives': [
            'Evaluate Coursera’s partnership model and revenue sharing terms',
            'Select AI learning paths from top universities for enterprise deployment',
            'Integrate Coursera analytics with internal progress tracking'
        ],
        'prerequisites': [],
        'resources': [],
        'content_sections': [],
        'metadata': {
            'provider': 'Coursera for Business',
            'access_tier': 'partner',
            'format': 'partnership program',
            'accreditation': 'Licensed certificates from partner universities',
            'external_url': 'https://www.coursera.org/business',
            'cta_text': 'Contact Coursera Partnerships',
            'attribution': 'Coursera® is a registered trademark of Coursera Inc. All content rights belong to the original providers.'
        }
    },
    {
        'id': 'module-everworker-academy',
        'title': 'EverWorker Academy: AI Fundamentals for Business Leaders',
        'description': 'Partner with EverWorker Academy to license AI business training tailored for leadership teams.',
        'role_specific': 'Executive',
        'difficulty_level': 2,
        'estimated_duration_minutes': 240,
        'content_type': 'partner',
        'is_premium': True,
        'content_url': 'https://everworker.academy/',
        'learning_objectives': [
            'Explore AI strategy frameworks for business leaders',
            'Assess licensing opportunities for white-label deployment',
            'Align AI capability building with change management goals'
        ],
        'prerequisites': [],
        'resources': [],
        'content_sections': [],
        'metadata': {
            'provider': 'EverWorker Academy',
            'access_tier': 'partner',
            'format': 'licensable program',
            'accreditation': 'EverWorker Academy certificate',
            'external_url': 'https://everworker.academy/',
            'cta_text': 'Explore Licensing Options',
            'attribution': 'EverWorker Academy content used with attribution—licensing required.'
        }
    },
    {
        'id': 'module-datacamp-partnership',
        'title': 'DataCamp AI Fundamentals Partnership',
        'description': 'Integrate DataCamp’s AI skills assessments and learning paths with analytics and reporting.',
        'role_specific': 'General',
        'difficulty_level': 2,
        'estimated_duration_minutes': 120,
        'content_type': 'partner',
        'is_premium': True,
        'content_url': 'https://www.datacamp.com/business',
        'learning_objectives': [
            'Review DataCamp’s AI curriculum and assessment tooling',
            'Design pathways that blend in-house and DataCamp content',
            'Negotiate revenue sharing and dashboard integration'
        ],
        'prerequisites': [],
        'resources': [],
        'content_sections': [],
        'metadata': {
            'provider': 'DataCamp',
            'access_tier': 'partner',
            'format': 'partnership program',
            'accreditation': 'DataCamp certifications',
            'external_url': 'https://www.datacamp.com/business',
            'cta_text': 'Connect with DataCamp',
            'attribution': 'DataCamp® is a registered trademark of DataCamp, Inc. Licensing terms apply.'
        }
    },
    {
        'id': 'module-ai-fire-affiliate',
        'title': 'AI Fire Academy Affiliate Program',
        'description': 'Earn up to 35% commission promoting AI Fire Academy’s premium AI education programs.',
        'role_specific': 'General',
        'difficulty_level': 2,
        'estimated_duration_minutes': 45,
        'content_type': 'affiliate',
        'is_premium': True,
        'content_url': 'https://aifireacademy.com/affiliates',
        'learning_objectives': [
            'Understand the AI Fire Academy course catalog and commission structure',
            'Set up tracking links and marketing assets',
            'Optimize referral flows for recurring revenue'
        ],
        'prerequisites': [],
        'resources': [],
        'content_sections': [],
        'metadata': {
            'provider': 'AI Fire Academy',
            'access_tier': 'affiliate',
            'format': 'affiliate program',
            'accreditation': 'Commission-based',
            'external_url': 'https://aifireacademy.com/affiliates',
            'cta_text': 'Join Affiliate Program',
            'attribution': 'AI Fire Academy® partnership information used with attribution.'
        }
    },
    {
        'id': 'module-customgpt-affiliate',
        'title': 'CustomGPT.ai Education Affiliate',
        'description': 'Monetize CustomGPT.ai education plans with 20% recurring commission for two years.',
        'role_specific': 'General',
        'difficulty_level': 2,
        'estimated_duration_minutes': 45,
        'content_type': 'affiliate',
        'is_premium': True,
        'content_url': 'https://customgpt.ai/affiliates',
        'learning_objectives': [
            'Promote CustomGPT.ai educational tiers and tooling',
            'Implement affiliate tracking and reporting',
            'Bundle CustomGPT.ai with internal AI literacy journeys'
        ],
        'prerequisites': [],
        'resources': [],
        'content_sections': [],
        'metadata': {
            'provider': 'CustomGPT.ai',
            'access_tier': 'affiliate',
            'format': 'affiliate program',
            'accreditation': 'Commission-based',
            'external_url': 'https://customgpt.ai/affiliates',
            'cta_text': 'Apply to CustomGPT Affiliate',
            'attribution': 'Details © CustomGPT.ai. Affiliate terms apply.'
        }
    }
]



def _build_prerequisite_payload(module_data):
    return {
        'requirements': module_data.get('prerequisites', []),
        'resources': module_data.get('resources', []),
        'sections': module_data.get('content_sections', []),
        'metadata': module_data.get('metadata', {})
    }


def seed_training_modules(force: bool = False, silent: bool = False):
    """Seed the catalog of training modules.

    Parameters
    ----------
    force: bool
        When True, existing modules are updated with fixture content.
    silent: bool
        Suppress printed output when True.
    """
    inserted, updated = 0, 0

    for module_data in DEFAULT_MODULES:
        module_id = module_data['id']
        payload = _build_prerequisite_payload(module_data)

        existing = TrainingModule.query.get(module_id)

        if existing:
            if not force:
                continue

            existing.title = module_data['title']
            existing.description = module_data['description']
            existing.role_specific = module_data['role_specific']
            existing.difficulty_level = module_data['difficulty_level']
            existing.estimated_duration_minutes = module_data['estimated_duration_minutes']
            existing.content_type = module_data['content_type']
            existing.content_url = module_data.get('content_url')
            existing.learning_objectives = json.dumps(module_data.get('learning_objectives', []))
            existing.prerequisites = json.dumps(payload)
            existing.is_premium = module_data.get('is_premium', False)
            existing.is_active = True
            existing.target_domains = json.dumps(module_data.get('target_domains', []))
            updated += 1
        else:
            module = TrainingModule(
                id=module_id,
                title=module_data['title'],
                description=module_data['description'],
                role_specific=module_data['role_specific'],
                difficulty_level=module_data['difficulty_level'],
                estimated_duration_minutes=module_data['estimated_duration_minutes'],
                content_type=module_data['content_type'],
                content_url=module_data.get('content_url'),
                learning_objectives=json.dumps(module_data.get('learning_objectives', [])),
                prerequisites=json.dumps(payload),
                is_premium=module_data.get('is_premium', False),
                is_active=True,
                target_domains=json.dumps(module_data.get('target_domains', []))
            )
            db.session.add(module)
            inserted += 1

    if inserted or updated:
        db.session.commit()

    if not silent:
        print(
            f"Training modules seed completed. inserted={inserted}, updated={updated}, "
            f"skipped={len(DEFAULT_MODULES) - inserted - updated}"
        )
