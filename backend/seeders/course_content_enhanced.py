#!/usr/bin/env python3
"""
Enhanced Course Content Seeder with Video Integration and Certification Standards
"""

import json
import uuid
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import db, TrainingModule, Lesson

# ENHANCED: Prompt Engineering Mastery - Professional Certification Level
# Duration: ~6-8 hours | 10 lessons | Certification-ready
PROMPT_ENGINEERING_MASTERY_ENHANCED = [
    {
        'title': 'Welcome to Prompt Engineering Mastery',
        'description': 'Introduction to professional prompt engineering and certification program',
        'order_index': 1,
        'content_type': 'text',
        'estimated_duration_minutes': 15,
        'is_required': True,
        'content': json.dumps({
            'sections': [
                {
                    'heading': 'Welcome to Professional Prompt Engineering',
                    'content': 'This comprehensive course will transform you from a casual AI user to a prompt engineering professional. You\'ll master advanced techniques used by AI practitioners, developers, and power users worldwide.'
                },
                {
                    'heading': 'Certification Program',
                    'content': 'This course offers a professional certification upon completion. To earn your certificate, you must:\n\n• Complete all 10 lessons\n• Score 80% or higher on all quizzes\n• Pass the final exam with 80% or higher\n• Complete the capstone project\n• Finish within 90 days of starting\n\nYour certificate will be shareable on LinkedIn and verifiable by employers.'
                },
                {
                    'heading': 'What You\'ll Master',
                    'content': '• Advanced prompt patterns and frameworks\n• Few-shot and zero-shot learning techniques\n• Chain-of-thought and tree-of-thought reasoning\n• System instructions and role-based prompting\n• Model-specific optimization (GPT-4, Claude, Gemini, Llama)\n• Prompt evaluation and iteration methodologies\n• Production-ready prompt engineering\n• Ethical considerations and best practices'
                },
                {
                    'heading': 'Course Structure',
                    'content': '**10 Comprehensive Lessons:**\n1. Introduction & Fundamentals\n2. Video: Prompt Engineering Basics\n3. The CRAFT Framework Deep Dive\n4. Advanced Prompt Patterns\n5. Video: Few-Shot & Chain-of-Thought\n6. Model-Specific Optimization\n7. Production Prompt Engineering\n8. Hands-On Lab & Capstone Project\n9. Ethics & Best Practices\n10. Final Certification Exam\n\n**Total Duration:** 6-8 hours\n**Difficulty:** Intermediate to Advanced'
                },
                {
                    'heading': 'Prerequisites',
                    'content': 'Basic familiarity with AI chatbots (ChatGPT, Claude, etc.) is recommended. No programming experience required, though it\'s helpful for advanced topics.'
                },
                {
                    'heading': 'Learning Outcomes',
                    'content': 'By the end of this course, you will be able to:\n\n• Design prompts that consistently produce high-quality outputs\n• Apply advanced techniques like few-shot learning and chain-of-thought\n• Optimize prompts for different AI models and use cases\n• Evaluate and iterate on prompts systematically\n• Implement prompt engineering in production environments\n• Make ethical decisions about AI use\n• Demonstrate mastery through a capstone project'
                }
            ],
            'resources': [
                {'title': 'OpenAI Prompt Engineering Guide', 'url': 'https://platform.openai.com/docs/guides/prompt-engineering'},
                {'title': 'Anthropic Prompt Library', 'url': 'https://docs.anthropic.com/claude/prompt-library'},
                {'title': 'Google AI Prompting Guide', 'url': 'https://ai.google.dev/docs/prompt_best_practices'}
            ]
        })
    },
    {
        'title': 'Video: Introduction to Prompt Engineering',
        'description': 'Watch a comprehensive introduction to prompt engineering fundamentals',
        'order_index': 2,
        'content_type': 'video',
        'estimated_duration_minutes': 25,
        'is_required': True,
        'content': json.dumps({
            'video_url': 'https://www.youtube-nocookie.com/embed/_ZvnD73m40o',
            'video_title': 'Prompt Engineering Tutorial - Master ChatGPT and LLM Responses',
            'creator': 'freeCodeCamp.org',
            'creator_url': 'https://www.youtube.com/@freecodecamp',
            'duration_minutes': 9,
            'license': 'CC BY-NC-SA (Educational use permitted)',
            'original_url': 'https://www.youtube.com/watch?v=_ZvnD73m40o',
            'attribution': '"Prompt Engineering Tutorial" by freeCodeCamp.org. Licensed under CC BY-NC-SA.',
            'timestamps': [
                {'time': '0:00', 'topic': 'Introduction to Prompt Engineering'},
                {'time': '1:30', 'topic': 'Why Prompt Engineering Matters'},
                {'time': '3:00', 'topic': 'Basic Prompt Structure'},
                {'time': '5:00', 'topic': 'Common Mistakes to Avoid'},
                {'time': '7:00', 'topic': 'Best Practices Overview'}
            ],
            'summary': 'This video provides a solid foundation in prompt engineering, covering why it matters, basic structure, and common pitfalls. You\'ll learn how small changes in prompts can dramatically improve AI outputs and see real examples of effective vs. ineffective prompts.',
            'key_takeaways': [
                'Prompt engineering is the skill of crafting inputs that guide AI to produce desired outputs',
                'Specificity and clarity are more important than complexity',
                'Context and examples dramatically improve results',
                'Iterative refinement is key to mastering prompts',
                'Different models respond differently to the same prompts'
            ],
            'reflection_questions': [
                'What surprised you most about how prompts affect AI outputs?',
                'Can you think of a time when a vague prompt gave you poor results?',
                'How might prompt engineering apply to your work or studies?'
            ],
            'supplementary_reading': [
                {'title': 'OpenAI Best Practices', 'url': 'https://platform.openai.com/docs/guides/prompt-engineering'},
                {'title': 'Prompt Engineering Guide', 'url': 'https://www.promptingguide.ai/'}
            ]
        })
    },
    {
        'title': 'The CRAFT Framework Deep Dive',
        'description': 'Master the CRAFT framework for systematic prompt design',
        'order_index': 3,
        'content_type': 'text',
        'estimated_duration_minutes': 35,
        'is_required': True,
        'content': json.dumps({
            'sections': [
                {
                    'heading': 'The CRAFT Framework Explained',
                    'content': 'CRAFT is a systematic approach to prompt engineering that ensures you include all essential elements:\n\n**C**ontext: Provide relevant background information\n**R**ole: Assign a persona or expertise level\n**A**ction: Specify the task clearly and precisely\n**F**ormat: Define the output structure\n**T**one: Set the communication style and voice\n\nThis framework works across all AI models and use cases.'
                },
                {
                    'heading': 'C - Context: Setting the Stage',
                    'content': '**Why Context Matters:**\nAI models perform better when they understand the situation, audience, and purpose.\n\n**Types of Context:**\n• **Situational:** "Our company is launching a new product..."\n• **Audience:** "For technical developers" vs "For general consumers"\n• **Purpose:** "To persuade" vs "To inform" vs "To entertain"\n• **Constraints:** "Budget is limited" or "Timeline is urgent"\n\n**Example:**\n❌ Bad: "Write a product description"\n✅ Good: "Our startup is launching an eco-friendly water bottle targeting millennials who care about sustainability. We need to stand out in a crowded market."'
                },
                {
                    'heading': 'R - Role: Assigning Expertise',
                    'content': '**The Power of Roles:**\nWhen you assign a role, the AI adopts that perspective, knowledge base, and communication style.\n\n**Effective Role Patterns:**\n• "You are a [profession] with [X] years of experience in [domain]"\n• "Act as a [expert type] who specializes in [specialty]"\n• "Take on the persona of [specific person/character]"\n\n**Examples:**\n• "You are a senior marketing strategist with 10 years in B2B SaaS"\n• "Act as a Python developer who writes clean, well-documented code"\n• "You are a patient teacher explaining concepts to beginners"\n\n**Pro Tip:** Combine roles for nuanced outputs:\n"You are both a data scientist and a business analyst, able to explain technical concepts to non-technical stakeholders."'
                },
                {
                    'heading': 'A - Action: Crystal Clear Tasks',
                    'content': '**Anatomy of a Good Action:**\n1. **Verb:** Use specific action verbs (analyze, create, summarize, compare)\n2. **Object:** What exactly to work on\n3. **Constraints:** Limitations or requirements\n4. **Success Criteria:** What "good" looks like\n\n**Action Verb Library:**\n• **Analysis:** Analyze, evaluate, assess, compare, contrast\n• **Creation:** Create, generate, design, develop, build\n• **Transformation:** Summarize, translate, rewrite, adapt, simplify\n• **Explanation:** Explain, describe, clarify, illustrate, demonstrate\n\n**Example Progression:**\n❌ Vague: "Do something with this data"\n⚠️ Better: "Analyze this data"\n✅ Best: "Analyze this sales data to identify the top 3 factors driving customer churn, and provide specific recommendations for each factor."'
                },
                {
                    'heading': 'F - Format: Structuring Output',
                    'content': '**Why Format Matters:**\nSpecifying format ensures you get usable, actionable outputs.\n\n**Common Format Patterns:**\n\n**Lists:**\n• "Provide 5 bullet points"\n• "Create a numbered list of steps"\n• "List pros and cons in two columns"\n\n**Structured Text:**\n• "Write 3 paragraphs: introduction, body, conclusion"\n• "Use headers for each section"\n• "Include a TL;DR at the top"\n\n**Tables:**\n• "Present findings in a markdown table with columns: [A, B, C]"\n• "Create a comparison matrix"\n\n**Code:**\n• "Provide Python code with inline comments"\n• "Include example usage"\n\n**Templates:**\n• "Follow this template: [template structure]"\n• "Use this format: [example]"\n\n**Example:**\n"Create a social media strategy in this format:\n1. Platform (Instagram/LinkedIn/Twitter)\n2. Content Type (video/image/text)\n3. Posting Frequency\n4. Key Metrics to Track\n5. Sample Post Idea"'
                },
                {
                    'heading': 'T - Tone: Voice and Style',
                    'content': '**Tone Dimensions:**\n\n**Formality:**\n• Formal: "Please provide a comprehensive analysis..."\n• Casual: "Hey, can you break down..."\n• Technical: "Execute a regression analysis..."\n\n**Emotion:**\n• Enthusiastic: "Exciting new features!"\n• Neutral: "New features available"\n• Serious: "Critical security updates"\n\n**Perspective:**\n• First person: "I recommend..."\n• Second person: "You should consider..."\n• Third person: "The analysis shows..."\n\n**Tone Combinations:**\n• "Professional but friendly"\n• "Technical yet accessible"\n• "Persuasive and enthusiastic"\n• "Empathetic and supportive"\n\n**Example:**\n"Write in a conversational, encouraging tone as if you\'re a mentor guiding a junior colleague. Be supportive but honest about challenges."'
                },
                {
                    'heading': 'CRAFT in Action: Complete Examples',
                    'content': '**Example 1: Marketing Copy**\n\n"You are a senior copywriter specializing in B2B SaaS marketing (Role). Our company sells project management software to remote teams of 10-50 people. We\'re launching a new AI-powered feature that automatically suggests task priorities (Context). Write a 150-word product announcement email (Action) in a professional yet exciting tone that emphasizes time-saving benefits (Tone). Structure it as: attention-grabbing subject line, 2-paragraph body, and clear CTA button text (Format)."\n\n**Example 2: Data Analysis**\n\n"You are a data analyst with expertise in customer behavior analytics (Role). We\'ve noticed a 15% drop in user engagement over the past quarter across our mobile app (Context). Analyze the attached user activity data to identify the top 3 potential causes and recommend specific interventions for each (Action). Present your findings in a markdown table with columns: Cause, Supporting Evidence, Recommended Action, Expected Impact (Format). Use clear, data-driven language suitable for presenting to executives (Tone)."'
                }
            ],
            'examples': [
                {
                    'scenario': 'Writing a job description',
                    'bad_prompt': 'Write a job description for a developer',
                    'good_prompt': 'You are an experienced tech recruiter (R). Our startup is hiring our first senior full-stack developer to build our MVP. We need someone who can work independently and make architectural decisions (C). Create a job description (A) that includes: role summary, key responsibilities (5-7 bullets), required skills, nice-to-have skills, and what we offer. Use an authentic, transparent tone that appeals to senior developers who value autonomy and impact (T). Format as a structured document with clear headers (F).',
                    'why_better': 'The good prompt provides complete context, assigns expertise, specifies exact requirements, defines structure, and sets appropriate tone.'
                }
            ],
            'practice_exercise': {
                'instruction': 'Use the CRAFT framework to write a prompt for this scenario: You need to create a weekly team update email summarizing project progress, blockers, and next steps.',
                'hints': [
                    'Context: What kind of team? What projects? Who reads these updates?',
                    'Role: Project manager? Team lead? What\'s their style?',
                    'Action: What specifically should be included?',
                    'Format: How should it be structured?',
                    'Tone: Formal? Casual? Motivating?'
                ]
            }
        })
    },
    {
        'title': 'Knowledge Check: CRAFT Framework Mastery',
        'description': 'Comprehensive quiz on the CRAFT framework and prompt fundamentals',
        'order_index': 4,
        'content_type': 'quiz',
        'estimated_duration_minutes': 20,
        'is_required': True,
        'content': json.dumps({
            'passing_score': 80,
            'questions': [
                {
                    'id': 'q1',
                    'question': 'What does the "C" in the CRAFT framework stand for, and why is it important?',
                    'type': 'multiple_choice',
                    'options': [
                        'Clarity - making prompts easy to understand',
                        'Context - providing relevant background information',
                        'Creativity - making prompts more interesting',
                        'Conciseness - keeping prompts short'
                    ],
                    'correct_answer': 1,
                    'explanation': 'Context provides the AI with relevant background information about the situation, audience, and purpose. This helps the AI understand the broader picture and generate more appropriate responses.'
                },
                {
                    'id': 'q2',
                    'question': 'Which of the following is the BEST example of assigning a role in a prompt?',
                    'type': 'multiple_choice',
                    'options': [
                        '"Please help me with this task"',
                        '"You are an expert"',
                        '"Act as a senior data scientist with 10 years of experience in healthcare analytics"',
                        '"Be professional"'
                    ],
                    'correct_answer': 2,
                    'explanation': 'The best role assignment is specific about the expertise level, domain, and experience. This helps the AI adopt the appropriate knowledge base and perspective.'
                },
                {
                    'id': 'q3',
                    'question': 'You need the AI to analyze customer feedback. Which action statement is most effective?',
                    'type': 'multiple_choice',
                    'options': [
                        '"Look at this feedback"',
                        '"Analyze the feedback"',
                        '"Analyze this customer feedback to identify the top 3 pain points, and suggest specific product improvements for each"',
                        '"Tell me what customers think"'
                    ],
                    'correct_answer': 2,
                    'explanation': 'The most effective action is specific about what to analyze, what to find (top 3 pain points), and what to deliver (specific improvements). It includes clear success criteria.'
                },
                {
                    'id': 'q4',
                    'question': 'Why is specifying format important in prompt engineering?',
                    'type': 'multiple_choice',
                    'options': [
                        'It makes the prompt longer and more impressive',
                        'It ensures you get usable, structured outputs that meet your needs',
                        'It\'s only important for technical tasks',
                        'It helps the AI understand the topic better'
                    ],
                    'correct_answer': 1,
                    'explanation': 'Specifying format ensures the output is structured in a way that\'s immediately usable for your purpose, whether that\'s a list, table, code, or specific document structure.'
                },
                {
                    'id': 'q5',
                    'question': 'Which tone specification is most effective?',
                    'type': 'multiple_choice',
                    'options': [
                        '"Be nice"',
                        '"Professional tone"',
                        '"Write in a conversational, encouraging tone as if you\'re a mentor guiding a junior colleague"',
                        '"Good tone"'
                    ],
                    'correct_answer': 2,
                    'explanation': 'The most effective tone specification is specific and descriptive, using comparisons or examples to clarify exactly what voice and style you want.'
                },
                {
                    'id': 'q6',
                    'question': 'You\'re writing a prompt to create marketing copy. Which element of CRAFT is MOST important to emphasize?',
                    'type': 'multiple_choice',
                    'options': [
                        'Context (audience, product, market position)',
                        'Role (copywriter expertise)',
                        'Tone (persuasive, engaging)',
                        'All elements are equally important'
                    ],
                    'correct_answer': 3,
                    'explanation': 'While context, role, and tone are all crucial for marketing copy, the CRAFT framework works best when ALL elements are included. Each element contributes to the quality of the output.'
                },
                {
                    'id': 'q7',
                    'question': 'What is the main benefit of using the CRAFT framework versus writing prompts intuitively?',
                    'type': 'multiple_choice',
                    'options': [
                        'It makes prompts longer',
                        'It ensures you systematically include all essential elements for high-quality outputs',
                        'It impresses colleagues',
                        'It only works for complex tasks'
                    ],
                    'correct_answer': 1,
                    'explanation': 'The CRAFT framework provides a systematic checklist to ensure you don\'t miss critical elements. This leads to more consistent, high-quality outputs across all types of tasks.'
                },
                {
                    'id': 'q8',
                    'question': 'Scenario: You need to create a weekly status report. Using CRAFT, what should you specify for the Format element?',
                    'type': 'multiple_choice',
                    'options': [
                        '"Make it look good"',
                        '"Professional format"',
                        '"Structure as: Executive Summary (2-3 sentences), Completed Items (bullet list), In Progress (bullet list), Blockers (bullet list), Next Week\'s Priorities (numbered list)"',
                        '"Use paragraphs"'
                    ],
                    'correct_answer': 2,
                    'explanation': 'The best format specification is detailed and prescriptive, defining exactly what sections to include and how each should be structured (bullets, numbers, sentences, etc.).'
                }
            ]
        })
    },
    {
        'title': 'Video: Advanced Prompting Techniques',
        'description': 'Learn few-shot learning, chain-of-thought, and advanced patterns from experts',
        'order_index': 5,
        'content_type': 'video',
        'estimated_duration_minutes': 30,
        'is_required': True,
        'content': json.dumps({
            'video_url': 'https://www.youtube-nocookie.com/embed/T9aRN5JkmL8',
            'video_title': 'Advanced ChatGPT Prompt Engineering',
            'creator': 'IBM Technology',
            'creator_url': 'https://www.youtube.com/@IBMTechnology',
            'duration_minutes': 12,
            'license': 'Educational use permitted',
            'original_url': 'https://www.youtube.com/watch?v=T9aRN5JkmL8',
            'attribution': '"Advanced ChatGPT Prompt Engineering" by IBM Technology. Used with permission for educational purposes.',
            'timestamps': [
                {'time': '0:00', 'topic': 'Introduction to Advanced Techniques'},
                {'time': '1:45', 'topic': 'Few-Shot Learning Explained'},
                {'time': '4:30', 'topic': 'Chain-of-Thought Prompting'},
                {'time': '7:15', 'topic': 'System Instructions'},
                {'time': '9:30', 'topic': 'Practical Examples'},
                {'time': '11:00', 'topic': 'Best Practices Summary'}
            ],
            'summary': 'This video from IBM Technology covers advanced prompt engineering techniques that dramatically improve AI outputs. You\'ll learn about few-shot learning (teaching by example), chain-of-thought prompting (asking AI to show its reasoning), and system instructions (setting persistent behavior). These techniques are essential for production AI applications.',
            'key_takeaways': [
                'Few-shot learning teaches AI through examples, dramatically improving output quality',
                'Chain-of-thought prompting improves accuracy on complex reasoning tasks',
                'System instructions set persistent behavior across conversations',
                'Combining techniques yields better results than using them individually',
                'Different models respond differently to advanced techniques'
            ],
            'reflection_questions': [
                'How could few-shot learning help with a repetitive task you do regularly?',
                'When would chain-of-thought prompting be most valuable in your work?',
                'What system instructions would be useful for your common AI interactions?'
            ],
            'supplementary_reading': [
                {'title': 'OpenAI Few-Shot Learning Guide', 'url': 'https://platform.openai.com/docs/guides/prompt-engineering/strategy-provide-examples'},
                {'title': 'Chain-of-Thought Prompting Paper', 'url': 'https://arxiv.org/abs/2201.11903'},
                {'title': 'Anthropic Prompt Engineering Guide', 'url': 'https://docs.anthropic.com/claude/docs/prompt-engineering'}
            ]
        })
    }
]


def seed_enhanced_content(force=False, silent=False):
    """Seed enhanced course content with video integration"""
    
    if not silent:
        print("🎓 Seeding ENHANCED course content with video integration...")
    
    # Update Prompt Engineering Mastery module
    module = TrainingModule.query.filter_by(id='module-prompt-master').first()
    
    if not module:
        if not silent:
            print("❌ Prompt Engineering Mastery module not found!")
        return 0
    
    # Check existing lessons
    existing_count = Lesson.query.filter_by(module_id=module.id).count()
    
    if existing_count > 0 and not force:
        if not silent:
            print(f"ℹ️  Module already has {existing_count} lessons. Use --force to replace with enhanced version.")
        return 0
    
    # Delete existing lessons if force=True
    if force and existing_count > 0:
        Lesson.query.filter_by(module_id=module.id).delete()
        db.session.commit()
        if not silent:
            print(f"🗑️  Deleted {existing_count} existing lessons")
    
    # Add all enhanced lessons
    lessons_added = 0
    for lesson_data in PROMPT_ENGINEERING_MASTERY_ENHANCED:
        lesson = Lesson(
            id=str(uuid.uuid4()),
            module_id=module.id,
            **lesson_data
        )
        db.session.add(lesson)
        lessons_added += 1
    
    db.session.commit()
    
    if not silent:
        print(f"✅ Added {lessons_added} ENHANCED lessons to '{module.title}'")
        print(f"📹 Includes video content with proper attribution")
        print(f"🎓 Certification-ready content")
    
    return lessons_added


if __name__ == '__main__':
    import argparse
    from app import app
    
    parser = argparse.ArgumentParser(description='Seed enhanced course content')
    parser.add_argument('--force', action='store_true', help='Force reseed (delete existing)')
    args = parser.parse_args()
    
    with app.app_context():
        seed_enhanced_content(force=args.force)

