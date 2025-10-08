from models import CertificationType, db

CERTIFICATION_TYPES = [
    {
        'id': 'litmusai-professional',
        'title': 'LitmusAI Professional',
        'description': 'Validates comprehensive AI literacy across all domains with practical application skills.',
        'requirements': [
            'Complete AI readiness assessment with 70% or higher',
            'Complete at least 3 role-specific training modules',
            'Pass certification exam with 80% or higher'
        ],
        'estimated_time': '2-3 weeks',
        'skills_validated': [
            'Functional AI understanding',
            'Ethical AI practices',
            'Prompt engineering communication',
            'Operational enablement'
        ],
        'access_tier': 'enterprise',
        'is_premium': True
    },
    {
        'id': 'ai-fundamentals',
        'title': 'AI Fundamentals Certificate',
        'description': 'Entry-level certification for basic AI literacy and understanding.',
        'requirements': [
            'Complete AI readiness assessment',
            'Complete AI Fundamentals training module'
        ],
        'estimated_time': '1 week',
        'skills_validated': [
            'Basic AI concepts',
            'AI tool awareness',
            'Prompt engineering basics'
        ],
        'access_tier': 'free',
        'is_premium': False
    },
    {
        'id': 'ai-ethics-specialist',
        'title': 'AI Ethics Specialist',
        'description': 'Specialized certification focusing on ethical AI implementation and governance.',
        'requirements': [
            'Complete ethical AI training modules',
            'Pass ethics-focused assessment',
            'Complete case study project'
        ],
        'estimated_time': '3-4 weeks',
        'skills_validated': [
            'AI bias detection',
            'Ethical AI frameworks',
            'Governance practices',
            'Regulatory compliance'
        ],
        'access_tier': 'professional',
        'is_premium': True
    }
]


def seed_certification_types(force: bool = False, silent: bool = False):
    inserted, updated = 0, 0

    for entry in CERTIFICATION_TYPES:
        record = CertificationType.query.get(entry['id'])

        if record:
            if not force:
                continue

            record.title = entry['title']
            record.description = entry.get('description')
            record.requirements = entry.get('requirements', [])
            record.estimated_time = entry.get('estimated_time')
            record.skills_validated = entry.get('skills_validated', [])
            record.access_tier = entry.get('access_tier', 'free')
            record.is_premium = entry.get('is_premium', False)
            updated += 1
        else:
            record = CertificationType(
                id=entry['id'],
                title=entry['title'],
                description=entry.get('description'),
                requirements=entry.get('requirements', []),
                estimated_time=entry.get('estimated_time'),
                skills_validated=entry.get('skills_validated', []),
                access_tier=entry.get('access_tier', 'free'),
                is_premium=entry.get('is_premium', False)
            )
            db.session.add(record)
            inserted += 1

    if inserted or updated:
        db.session.commit()

    if not silent:
        print(
            f"Certification types seed completed. inserted={inserted}, updated={updated}, "
            f"skipped={len(CERTIFICATION_TYPES) - inserted - updated}"
        )
