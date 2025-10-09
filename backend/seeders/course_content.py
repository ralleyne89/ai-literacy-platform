#!/usr/bin/env python3
"""
Seeder for course content (lessons)
"""

import json
import uuid
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import db, TrainingModule, Lesson

# Sample course content - Introduction to AI Fundamentals
# NOTE: This is original educational content, NOT the official Google AI Essentials course
# The official Google AI Essentials is a paid course available on Coursera: https://www.coursera.org/specializations/ai-essentials-google
AI_FUNDAMENTALS_INTRO_LESSONS = [
    {
        'title': 'Welcome to AI Fundamentals',
        'description': 'Introduction to artificial intelligence concepts and this learning path',
        'order_index': 1,
        'content_type': 'text',
        'estimated_duration_minutes': 10,
        'is_required': True,
        'content': json.dumps({
            'sections': [
                {
                    'heading': 'Welcome to Your AI Learning Journey',
                    'content': 'This course provides an introduction to artificial intelligence fundamentals. You\'ll learn core concepts, practical applications, and responsible AI use.\n\nNote: This is an introductory course created for educational purposes. For comprehensive, certified training, we recommend the official Google AI Essentials course available on Coursera.'
                },
                {
                    'heading': 'What You\'ll Learn',
                    'content': '• Understanding AI and Machine Learning basics\n• How Large Language Models work\n• Practical prompt engineering techniques\n• Responsible and ethical AI use\n• Staying current with AI developments'
                },
                {
                    'heading': 'Course Structure',
                    'content': 'This course includes text lessons, knowledge checks, and hands-on exercises. Each lesson builds on the previous one, so we recommend completing them in order.'
                },
                {
                    'heading': 'Want More?',
                    'content': 'For a comprehensive, certificate-bearing program, check out the official Google AI Essentials course on Coursera. It includes expert instruction, hands-on projects, and a shareable certificate upon completion.'
                }
            ],
            'resources': [
                {'title': 'Official Google AI Essentials on Coursera', 'url': 'https://www.coursera.org/specializations/ai-essentials-google'},
                {'title': 'Grow with Google - AI Training', 'url': 'https://grow.google/ai-essentials/'}
            ]
        })
    },
    {
        'title': 'AI Basics: What is Artificial Intelligence?',
        'description': 'Understand the fundamentals of AI and how it differs from traditional programming',
        'order_index': 2,
        'content_type': 'text',
        'estimated_duration_minutes': 15,
        'is_required': True,
        'content': json.dumps({
            'sections': [
                {
                    'heading': 'What is Artificial Intelligence?',
                    'content': 'Artificial Intelligence (AI) refers to computer systems that can perform tasks that typically require human intelligence. Unlike traditional programs that follow explicit instructions, AI systems can learn from data and improve over time.'
                },
                {
                    'heading': 'Types of AI',
                    'content': '**Narrow AI (Weak AI):** Designed for specific tasks like voice assistants, recommendation systems, or image recognition. This is what we use today.\n\n**General AI (Strong AI):** Hypothetical AI that could perform any intellectual task a human can. This doesn\'t exist yet.\n\n**Machine Learning:** A subset of AI where systems learn from data without being explicitly programmed for every scenario.'
                },
                {
                    'heading': 'How AI Learns',
                    'content': 'AI systems learn through:\n• **Supervised Learning:** Learning from labeled examples\n• **Unsupervised Learning:** Finding patterns in unlabeled data\n• **Reinforcement Learning:** Learning through trial and error with rewards\n\nMost modern AI tools use a combination of these approaches.'
                },
                {
                    'heading': 'AI in Daily Life',
                    'content': 'You interact with AI more than you might think:\n• Email spam filters\n• Voice assistants (Siri, Alexa, Google Assistant)\n• Social media content recommendations\n• Navigation apps predicting traffic\n• Online shopping recommendations\n• Autocorrect and predictive text'
                }
            ]
        })
    },
    {
        'title': 'Knowledge Check: AI Basics',
        'description': 'Test your understanding of fundamental AI concepts',
        'order_index': 3,
        'content_type': 'quiz',
        'estimated_duration_minutes': 10,
        'is_required': True,
        'content': json.dumps({
            'passing_score': 70,
            'questions': [
                {
                    'id': 'q1',
                    'question': 'What is the main difference between traditional programming and AI?',
                    'type': 'multiple_choice',
                    'options': [
                        'Traditional programming follows explicit rules; AI learns from data',
                        'AI is faster than traditional programming',
                        'Traditional programming is newer than AI',
                        'There is no difference'
                    ],
                    'correct_answer': 0,
                    'explanation': 'Traditional programming requires explicit instructions for every scenario, while AI systems can learn patterns from data and adapt to new situations.'
                },
                {
                    'id': 'q2',
                    'question': 'Which type of AI exists today?',
                    'type': 'multiple_choice',
                    'options': [
                        'General AI (Strong AI)',
                        'Narrow AI (Weak AI)',
                        'Super AI',
                        'Conscious AI'
                    ],
                    'correct_answer': 1,
                    'explanation': 'Currently, only Narrow AI exists - systems designed for specific tasks. General AI that can perform any intellectual task like a human is still theoretical.'
                },
                {
                    'id': 'q3',
                    'question': 'Which of these is an example of AI in daily life?',
                    'type': 'multiple_choice',
                    'options': [
                        'A calculator performing arithmetic',
                        'Email spam filters',
                        'A digital clock',
                        'A word processor'
                    ],
                    'correct_answer': 1,
                    'explanation': 'Email spam filters use machine learning to identify and filter spam based on patterns learned from data, making them a practical example of AI in daily use.'
                }
            ]
        })
    },
    {
        'title': 'Prompt Engineering Basics',
        'description': 'Learn how to write effective prompts to get better AI responses',
        'order_index': 4,
        'content_type': 'text',
        'estimated_duration_minutes': 25,
        'is_required': True,
        'content': json.dumps({
            'sections': [
                {
                    'heading': 'What is Prompt Engineering?',
                    'content': 'Prompt engineering is the practice of crafting effective instructions (prompts) to get the best results from AI models. A well-designed prompt can dramatically improve the quality and relevance of AI responses.'
                },
                {
                    'heading': 'Key Principles',
                    'content': '1. **Be Specific**: Clearly state what you want\n2. **Provide Context**: Give background information\n3. **Set Constraints**: Define format, length, tone\n4. **Use Examples**: Show the desired output format\n5. **Iterate**: Refine based on results'
                },
                {
                    'heading': 'Prompt Patterns',
                    'content': '**Basic Pattern**: "Act as a [role]. [Task]. [Context]. [Constraints]."\n\nExample: "Act as a marketing expert. Write a product description for eco-friendly water bottles. Target audience is environmentally conscious millennials. Keep it under 100 words and emphasize sustainability."'
                },
                {
                    'heading': 'Common Techniques',
                    'content': '• **Zero-shot**: Ask without examples\n• **Few-shot**: Provide examples\n• **Chain-of-thought**: Ask to explain reasoning\n• **Role-playing**: Assign a persona\n• **Template-based**: Use structured formats'
                }
            ],
            'examples': [
                {
                    'bad': 'Write about AI',
                    'good': 'Write a 200-word explanation of AI for business executives, focusing on practical applications in customer service',
                    'why': 'The good prompt specifies audience, length, and focus area'
                }
            ]
        })
    },
    {
        'title': 'Hands-On: Practice Prompt Engineering',
        'description': 'Apply prompt engineering techniques in interactive exercises',
        'order_index': 5,
        'content_type': 'interactive',
        'estimated_duration_minutes': 20,
        'is_required': True,
        'content': json.dumps({
            'exercises': [
                {
                    'id': 'ex1',
                    'title': 'Improve This Prompt',
                    'description': 'Rewrite the following vague prompt to be more effective',
                    'prompt': 'Tell me about marketing',
                    'hints': [
                        'Add a specific role or perspective',
                        'Define what aspect of marketing',
                        'Specify the audience or use case',
                        'Set length or format constraints'
                    ],
                    'sample_solution': 'Act as a digital marketing consultant. Explain the top 3 social media marketing strategies for small businesses in 2024. Target audience: small business owners with limited marketing budgets. Format: bullet points with brief explanations.'
                },
                {
                    'id': 'ex2',
                    'title': 'Create a Few-Shot Prompt',
                    'description': 'Write a prompt that uses examples to guide the AI',
                    'task': 'Create a prompt to generate product taglines',
                    'hints': [
                        'Provide 2-3 example products and taglines',
                        'Specify the style and tone',
                        'Indicate the product for which you want a tagline'
                    ],
                    'sample_solution': 'Generate a catchy tagline for the product below, following these examples:\n\nProduct: Eco-friendly water bottle\nTagline: "Hydrate responsibly, live sustainably"\n\nProduct: Smart home thermostat\nTagline: "Comfort meets efficiency"\n\nProduct: Wireless earbuds\nTagline: [Your tagline here]'
                }
            ],
            'completion_criteria': 'Complete at least 2 exercises'
        })
    },
    {
        'title': 'AI Ethics and Responsible Use',
        'description': 'Understand ethical considerations when using AI tools',
        'order_index': 6,
        'content_type': 'text',
        'estimated_duration_minutes': 15,
        'is_required': True,
        'content': json.dumps({
            'sections': [
                {
                    'heading': 'Why AI Ethics Matters',
                    'content': 'As AI becomes more prevalent, it\'s crucial to use these tools responsibly. Ethical AI use protects individuals, organizations, and society from potential harms.'
                },
                {
                    'heading': 'Key Ethical Principles',
                    'content': '1. **Transparency**: Be clear when AI is being used\n2. **Fairness**: Avoid bias and discrimination\n3. **Privacy**: Protect personal data\n4. **Accountability**: Take responsibility for AI outputs\n5. **Safety**: Ensure AI doesn\'t cause harm'
                },
                {
                    'heading': 'Common Ethical Concerns',
                    'content': '• **Bias**: AI can perpetuate societal biases\n• **Privacy**: Data collection and usage concerns\n• **Job displacement**: Automation affecting employment\n• **Misinformation**: AI-generated fake content\n• **Surveillance**: Invasive monitoring capabilities'
                },
                {
                    'heading': 'Best Practices',
                    'content': '• Verify AI-generated information\n• Don\'t share sensitive data with AI tools\n• Be transparent about AI use\n• Review and edit AI outputs\n• Consider the impact on stakeholders\n• Stay informed about AI capabilities and limitations'
                }
            ]
        })
    },
    {
        'title': 'Final Assessment: Google AI Essentials',
        'description': 'Comprehensive quiz covering all module topics',
        'order_index': 7,
        'content_type': 'quiz',
        'estimated_duration_minutes': 15,
        'is_required': True,
        'content': json.dumps({
            'passing_score': 80,
            'questions': [
                {
                    'id': 'q1',
                    'question': 'Which prompt engineering technique involves providing examples to guide the AI?',
                    'type': 'multiple_choice',
                    'options': ['Zero-shot', 'Few-shot', 'Chain-of-thought', 'Role-playing'],
                    'correct_answer': 1,
                    'explanation': 'Few-shot prompting provides examples to help the AI understand the desired output format and style.'
                },
                {
                    'id': 'q2',
                    'question': 'What should you do before sharing AI-generated content publicly?',
                    'type': 'multiple_choice',
                    'options': [
                        'Nothing, AI is always accurate',
                        'Verify the information and review for quality',
                        'Only check for grammar',
                        'Share immediately to save time'
                    ],
                    'correct_answer': 1,
                    'explanation': 'Always verify AI-generated content for accuracy, quality, and appropriateness before sharing.'
                },
                {
                    'id': 'q3',
                    'question': 'Which of the following is an ethical concern with AI?',
                    'type': 'multiple_choice',
                    'options': [
                        'AI is too expensive',
                        'AI can perpetuate bias and discrimination',
                        'AI is too slow',
                        'AI requires too much training'
                    ],
                    'correct_answer': 1,
                    'explanation': 'Bias in AI systems is a major ethical concern as it can lead to unfair treatment of individuals or groups.'
                },
                {
                    'id': 'q4',
                    'question': 'What makes a prompt more effective?',
                    'type': 'multiple_choice',
                    'options': [
                        'Making it as short as possible',
                        'Being specific, providing context, and setting constraints',
                        'Using complex technical jargon',
                        'Asking multiple unrelated questions at once'
                    ],
                    'correct_answer': 1,
                    'explanation': 'Effective prompts are specific, provide context, and set clear constraints for the desired output.'
                },
                {
                    'id': 'q5',
                    'question': 'What is the transformer architecture primarily used for in LLMs?',
                    'type': 'multiple_choice',
                    'options': [
                        'Image processing',
                        'Understanding and generating text',
                        'Audio synthesis',
                        'Video editing'
                    ],
                    'correct_answer': 1,
                    'explanation': 'Transformer architecture is the foundation of modern LLMs, enabling them to understand context and generate coherent text.'
                }
            ]
        })
    }
]


# Prompt Engineering Mastery - Original Content
PROMPT_ENGINEERING_MASTERY_LESSONS = [
    {
        'title': 'Welcome to Prompt Engineering Mastery',
        'description': 'Introduction to advanced prompt engineering techniques and course overview',
        'order_index': 1,
        'content_type': 'text',
        'estimated_duration_minutes': 10,
        'is_required': True,
        'content': json.dumps({
            'sections': [
                {
                    'heading': 'Welcome to Prompt Engineering Mastery',
                    'content': 'This course will take you from basic prompting to advanced techniques used by AI practitioners. You\'ll learn how to craft prompts that consistently produce high-quality, reliable outputs from large language models.'
                },
                {
                    'heading': 'What You\'ll Master',
                    'content': '• Advanced prompt patterns and templates\n• System instructions and role-based prompting\n• Few-shot learning and in-context examples\n• Chain-of-thought reasoning\n• Prompt evaluation and iteration\n• Model-specific optimization (GPT, Claude, Gemini)'
                },
                {
                    'heading': 'Who This Course Is For',
                    'content': 'This course is designed for:\n• Professionals who regularly use AI tools\n• Developers integrating LLMs into applications\n• Content creators and marketers\n• Anyone wanting to maximize AI productivity'
                },
                {
                    'heading': 'Prerequisites',
                    'content': 'Basic familiarity with AI chatbots (ChatGPT, Claude, etc.) is helpful but not required. We\'ll start with fundamentals and build up to advanced techniques.'
                }
            ]
        })
    },
    {
        'title': 'Prompt Design Fundamentals',
        'description': 'Core building blocks of effective prompts: instructions, context, format, examples, and tone',
        'order_index': 2,
        'content_type': 'text',
        'estimated_duration_minutes': 20,
        'is_required': True,
        'content': json.dumps({
            'sections': [
                {
                    'heading': 'The Anatomy of a Great Prompt',
                    'content': 'Every effective prompt contains these key elements:\n\n**1. Clear Instructions:** What you want the AI to do\n**2. Context:** Background information the AI needs\n**3. Format Specification:** How you want the output structured\n**4. Examples:** Sample inputs/outputs (optional but powerful)\n**5. Tone & Style:** The voice and personality of the response'
                },
                {
                    'heading': 'The CRAFT Framework',
                    'content': '**C**ontext: Provide relevant background\n**R**ole: Assign a persona or expertise level\n**A**ction: Specify the task clearly\n**F**ormat: Define output structure\n**T**one: Set the communication style\n\nExample:\n"You are a senior marketing strategist (Role). Our company sells eco-friendly water bottles to millennials (Context). Create a 3-point social media strategy (Action) in bullet format (Format) with an enthusiastic, authentic tone (Tone)."'
                },
                {
                    'heading': 'Common Prompt Patterns',
                    'content': '**Instruction Pattern:**\n"[Action] + [Subject] + [Constraints]"\nExample: "Summarize this article in 3 sentences using simple language."\n\n**Role Pattern:**\n"Act as [Expert]. [Task]."\nExample: "Act as a Python developer. Review this code for bugs."\n\n**Template Pattern:**\n"Given [Input], produce [Output] following [Format]."\nExample: "Given a product description, produce 5 taglines following the format: [Emotion] + [Benefit]."'
                },
                {
                    'heading': 'Specificity Matters',
                    'content': 'Vague prompts produce vague results. Compare:\n\n❌ Bad: "Write about AI"\n✅ Good: "Write a 300-word explanation of how transformer models work, targeted at business executives with no technical background."\n\nThe more specific you are about:\n• Length/scope\n• Audience\n• Purpose\n• Format\n• Constraints\n\n...the better your results will be.'
                }
            ],
            'examples': [
                {
                    'bad': 'Make this better: [text]',
                    'good': 'Improve this email for clarity and professionalism. Keep it under 150 words, maintain a friendly tone, and ensure the call-to-action is clear.',
                    'why': 'The good prompt specifies what "better" means: clarity, professionalism, length, tone, and CTA focus.'
                }
            ]
        })
    },
    {
        'title': 'Knowledge Check: Prompt Fundamentals',
        'description': 'Test your understanding of prompt design basics',
        'order_index': 3,
        'content_type': 'quiz',
        'estimated_duration_minutes': 10,
        'is_required': True,
        'content': json.dumps({
            'passing_score': 70,
            'questions': [
                {
                    'id': 'q1',
                    'question': 'Which element is most important for getting specific, targeted outputs from an LLM?',
                    'type': 'multiple_choice',
                    'options': [
                        'Using complex vocabulary',
                        'Providing clear, specific instructions with constraints',
                        'Making the prompt as short as possible',
                        'Using technical jargon'
                    ],
                    'correct_answer': 1,
                    'explanation': 'Clear, specific instructions with constraints (length, format, audience, etc.) are the most important factor in getting targeted outputs.'
                },
                {
                    'id': 'q2',
                    'question': 'What does the "R" in the CRAFT framework stand for?',
                    'type': 'multiple_choice',
                    'options': [
                        'Results',
                        'Role',
                        'Requirements',
                        'Reasoning'
                    ],
                    'correct_answer': 1,
                    'explanation': 'CRAFT stands for: Context, Role, Action, Format, Tone. The "R" is for Role - assigning a persona or expertise level to the AI.'
                },
                {
                    'id': 'q3',
                    'question': 'Which prompt is better structured?',
                    'type': 'multiple_choice',
                    'options': [
                        '"Tell me about marketing"',
                        '"Act as a marketing professor. Explain the 4 Ps of marketing in 200 words for undergraduate students."',
                        '"Marketing explanation needed"',
                        '"What is marketing?"'
                    ],
                    'correct_answer': 1,
                    'explanation': 'The second option uses role assignment, specifies the topic, sets a length constraint, and defines the target audience - all elements of a well-structured prompt.'
                }
            ]
        })
    },
    {
        'title': 'Advanced Prompt Patterns',
        'description': 'Master few-shot learning, chain-of-thought, and model-specific techniques',
        'order_index': 4,
        'content_type': 'text',
        'estimated_duration_minutes': 25,
        'is_required': True,
        'content': json.dumps({
            'sections': [
                {
                    'heading': 'Few-Shot Learning',
                    'content': 'Few-shot prompting provides examples to guide the AI\'s output format and style.\n\n**Zero-shot:** No examples\n"Classify this review as positive or negative: [review]"\n\n**One-shot:** One example\n"Classify reviews as positive or negative.\nExample: \'Great product!\' → Positive\nNow classify: [review]"\n\n**Few-shot:** Multiple examples\n"Classify reviews:\n\'Great product!\' → Positive\n\'Terrible quality\' → Negative\n\'Okay, nothing special\' → Neutral\nNow classify: [review]"\n\nFew-shot is especially powerful for:\n• Custom formats\n• Specific writing styles\n• Complex classification tasks\n• Maintaining consistency'
                },
                {
                    'heading': 'Chain-of-Thought (CoT) Prompting',
                    'content': 'Chain-of-thought prompting asks the AI to show its reasoning process, leading to more accurate results for complex tasks.\n\n**Without CoT:**\n"What is 15% of 240?"\n\n**With CoT:**\n"What is 15% of 240? Show your step-by-step reasoning."\n\nThe AI will respond:\n"Let me work through this step by step:\n1. Convert 15% to decimal: 15/100 = 0.15\n2. Multiply: 240 × 0.15 = 36\nAnswer: 36"\n\nUse CoT for:\n• Math and logic problems\n• Multi-step reasoning\n• Complex analysis\n• Debugging and troubleshooting'
                },
                {
                    'heading': 'System Instructions vs. User Prompts',
                    'content': 'Many AI platforms support system-level instructions that set persistent behavior:\n\n**System Instruction (persistent):**\n"You are a helpful assistant that always responds in bullet points and keeps answers under 100 words."\n\n**User Prompt (per-message):**\n"Explain photosynthesis"\n\nSystem instructions are ideal for:\n• Setting consistent tone/style\n• Defining role/expertise\n• Establishing output format rules\n• Setting safety/ethical guidelines'
                },
                {
                    'heading': 'Model-Specific Optimization',
                    'content': '**GPT (OpenAI):**\n• Responds well to structured formats\n• Good at following complex instructions\n• Use temperature parameter for creativity control\n\n**Claude (Anthropic):**\n• Excels at long-form content\n• Strong at analysis and reasoning\n• Prefers conversational, natural prompts\n\n**Gemini (Google):**\n• Great for multimodal tasks (text + images)\n• Strong at factual, informational responses\n• Good at structured data extraction\n\nTip: Test your prompts across models to find the best fit for each use case.'
                }
            ]
        })
    },
    {
        'title': 'Hands-On: Prompt Engineering Lab',
        'description': 'Practice advanced prompting techniques with real-world scenarios',
        'order_index': 5,
        'content_type': 'interactive',
        'estimated_duration_minutes': 20,
        'is_required': True,
        'content': json.dumps({
            'exercises': [
                {
                    'id': 'ex1',
                    'title': 'Create a Few-Shot Prompt',
                    'description': 'You need to extract key information from customer support tickets. Create a few-shot prompt that teaches the AI to extract: Issue Type, Priority, and Customer Sentiment.',
                    'hints': [
                        'Provide 2-3 example tickets with their extracted information',
                        'Use a consistent format for the examples',
                        'Include diverse examples (different issue types, priorities)',
                        'Specify the exact output format you want'
                    ],
                    'sample_solution': 'Extract key information from support tickets in this format:\nIssue Type | Priority | Sentiment\n\nExamples:\nTicket: "My order hasn\'t arrived and it\'s been 2 weeks!"\nBilling Issue | High | Frustrated\n\nTicket: "How do I change my password?"\nAccount Access | Low | Neutral\n\nTicket: "Love the product but the app keeps crashing"\nTechnical Issue | Medium | Mixed\n\nNow extract from: [new ticket]'
                },
                {
                    'id': 'ex2',
                    'title': 'Chain-of-Thought for Analysis',
                    'description': 'Write a prompt that uses chain-of-thought reasoning to analyze whether a business idea is viable. The AI should consider market size, competition, and execution difficulty.',
                    'hints': [
                        'Ask the AI to think step-by-step',
                        'Specify the factors to consider',
                        'Request a structured analysis',
                        'Ask for a final recommendation with reasoning'
                    ],
                    'sample_solution': 'Analyze this business idea for viability. Think through each factor step-by-step:\n\n1. Market Size: Estimate the potential customer base\n2. Competition: Assess existing solutions and market saturation\n3. Execution Difficulty: Evaluate technical, financial, and operational challenges\n4. Final Verdict: Provide a viability score (1-10) with reasoning\n\nBusiness Idea: [idea description]\n\nShow your reasoning for each step before giving your final verdict.'
                },
                {
                    'id': 'ex3',
                    'title': 'Optimize for Different Models',
                    'description': 'Take this basic prompt and optimize it for GPT-4: "Write a blog post about remote work"',
                    'hints': [
                        'Add specific structure and format requirements',
                        'Define the target audience',
                        'Specify length and tone',
                        'Include SEO considerations if relevant'
                    ],
                    'sample_solution': 'Write a 800-word blog post about remote work best practices.\n\nTarget Audience: Mid-level professionals transitioning to remote work\nTone: Professional but conversational\nStructure:\n- Engaging introduction with a hook\n- 5 main tips (each 120-150 words)\n- Conclusion with actionable takeaway\n\nInclude:\n- Real-world examples\n- Common pitfalls to avoid\n- One relevant statistic per tip\n\nSEO: Naturally incorporate "remote work productivity" and "work from home tips"'
                }
            ],
            'completion_criteria': 'Complete at least 2 exercises to proceed'
        })
    },
    {
        'title': 'Final Assessment: Prompt Engineering Mastery',
        'description': 'Comprehensive quiz covering all prompt engineering concepts',
        'order_index': 6,
        'content_type': 'quiz',
        'estimated_duration_minutes': 15,
        'is_required': True,
        'content': json.dumps({
            'passing_score': 80,
            'questions': [
                {
                    'id': 'q1',
                    'question': 'What is the primary benefit of few-shot prompting?',
                    'type': 'multiple_choice',
                    'options': [
                        'It makes prompts shorter',
                        'It teaches the AI the desired output format and style through examples',
                        'It reduces API costs',
                        'It makes the AI respond faster'
                    ],
                    'correct_answer': 1,
                    'explanation': 'Few-shot prompting provides examples that teach the AI the exact format, style, and pattern you want in the output.'
                },
                {
                    'id': 'q2',
                    'question': 'When should you use chain-of-thought prompting?',
                    'type': 'multiple_choice',
                    'options': [
                        'For simple factual questions',
                        'For creative writing tasks',
                        'For complex reasoning and multi-step problems',
                        'For generating lists'
                    ],
                    'correct_answer': 2,
                    'explanation': 'Chain-of-thought prompting is most effective for complex reasoning tasks where showing step-by-step thinking improves accuracy.'
                },
                {
                    'id': 'q3',
                    'question': 'What is the difference between system instructions and user prompts?',
                    'type': 'multiple_choice',
                    'options': [
                        'System instructions are longer',
                        'System instructions set persistent behavior; user prompts are per-message',
                        'User prompts are more important',
                        'There is no difference'
                    ],
                    'correct_answer': 1,
                    'explanation': 'System instructions set persistent behavior that applies to all interactions, while user prompts are specific to each message.'
                },
                {
                    'id': 'q4',
                    'question': 'Which prompt element is most important for controlling output length and structure?',
                    'type': 'multiple_choice',
                    'options': [
                        'Tone',
                        'Role',
                        'Format specification',
                        'Context'
                    ],
                    'correct_answer': 2,
                    'explanation': 'Format specification directly controls how the output is structured, including length, organization, and presentation.'
                },
                {
                    'id': 'q5',
                    'question': 'What makes a prompt "specific" rather than "vague"?',
                    'type': 'multiple_choice',
                    'options': [
                        'Using technical terminology',
                        'Making it longer',
                        'Defining audience, length, format, and constraints',
                        'Using multiple sentences'
                    ],
                    'correct_answer': 2,
                    'explanation': 'Specificity comes from clearly defining parameters like audience, length, format, tone, and any constraints or requirements.'
                }
            ]
        })
    }
]


# Elements of AI - Curated Content with Attribution
ELEMENTS_OF_AI_LESSONS = [
    {
        'title': 'Welcome to Elements of AI',
        'description': 'Introduction to this curated learning path based on the University of Helsinki course',
        'order_index': 1,
        'content_type': 'text',
        'estimated_duration_minutes': 10,
        'is_required': True,
        'content': json.dumps({
            'sections': [
                {
                    'heading': 'About This Course',
                    'content': 'This is a curated learning path inspired by "Elements of AI," a free online course created by the University of Helsinki and MinnaLearn. This course has been taken by over 1 million people worldwide.\n\n**Important:** This is NOT the official Elements of AI course. We\'ve created this curated content to introduce you to AI concepts. For the complete, official course with certification, please visit elementsofai.com.'
                },
                {
                    'heading': 'What You\'ll Learn',
                    'content': 'In this curated path, you\'ll explore:\n• What AI is and isn\'t\n• Real-world applications of AI\n• Basic AI techniques and methods\n• Implications of AI for society\n• How to start learning more about AI'
                },
                {
                    'heading': 'Official Course Information',
                    'content': '**Elements of AI** is a free online course created by the University of Helsinki and MinnaLearn.\n\n• **Website:** https://www.elementsofai.com/\n• **Cost:** Free\n• **Certificate:** Available upon completion\n• **Languages:** Available in 20+ languages\n• **Duration:** 30 hours (official course)\n\nWe highly recommend completing the official course for a comprehensive learning experience and certification.'
                },
                {
                    'heading': 'Attribution',
                    'content': 'This curated content is inspired by and references the Elements of AI course created by the University of Helsinki and MinnaLearn. All credit for the original course content goes to the creators. This is an educational resource designed to introduce concepts; it is not a replacement for the official course.'
                }
            ],
            'resources': [
                {'title': 'Official Elements of AI Course', 'url': 'https://www.elementsofai.com/'},
                {'title': 'University of Helsinki', 'url': 'https://www.helsinki.fi/en'},
                {'title': 'MinnaLearn', 'url': 'https://www.minnalearn.com/'}
            ]
        })
    },
    {
        'title': 'What is AI?',
        'description': 'Understanding artificial intelligence: definitions, capabilities, and limitations',
        'order_index': 2,
        'content_type': 'text',
        'estimated_duration_minutes': 20,
        'is_required': True,
        'content': json.dumps({
            'sections': [
                {
                    'heading': 'Defining Artificial Intelligence',
                    'content': 'Artificial Intelligence (AI) is a broad term that refers to computer systems that can perform tasks that typically require human intelligence. These tasks include:\n\n• Learning from experience\n• Understanding natural language\n• Recognizing patterns\n• Making decisions\n• Solving problems\n\nAI is not a single technology but a collection of methods and techniques.'
                },
                {
                    'heading': 'What AI Can Do',
                    'content': '**Current AI Capabilities:**\n\n• **Image Recognition:** Identifying objects, faces, and scenes in photos\n• **Natural Language Processing:** Understanding and generating human language\n• **Recommendation Systems:** Suggesting products, content, or connections\n• **Game Playing:** Mastering complex games like chess and Go\n• **Autonomous Vehicles:** Self-driving cars and drones\n• **Medical Diagnosis:** Analyzing medical images and patient data\n• **Translation:** Converting text between languages\n• **Voice Assistants:** Understanding and responding to spoken commands'
                },
                {
                    'heading': 'What AI Cannot Do (Yet)',
                    'content': '**Current Limitations:**\n\n• **General Intelligence:** AI systems are narrow - they excel at specific tasks but can\'t transfer knowledge like humans\n• **Common Sense Reasoning:** Understanding context and implicit knowledge that humans take for granted\n• **Emotional Intelligence:** Truly understanding and responding to human emotions\n• **Creativity:** While AI can generate content, it doesn\'t "create" in the human sense\n• **Consciousness:** AI systems are not self-aware or conscious\n• **Ethical Reasoning:** Making complex moral judgments'
                },
                {
                    'heading': 'AI vs. Machine Learning vs. Deep Learning',
                    'content': '**Artificial Intelligence (AI):** The broadest term - any technique that enables computers to mimic human intelligence\n\n**Machine Learning (ML):** A subset of AI where systems learn from data without being explicitly programmed\n\n**Deep Learning (DL):** A subset of ML that uses neural networks with many layers to learn complex patterns\n\nThink of it as nested circles: AI contains ML, which contains DL.'
                },
                {
                    'heading': 'The AI Effect',
                    'content': 'Interestingly, once AI solves a problem, we often stop calling it "AI." This is known as the "AI Effect."\n\nExamples:\n• Spam filters (once considered AI, now just "filtering")\n• Chess computers (once amazing AI, now just "algorithms")\n• GPS navigation (once cutting-edge AI, now standard technology)\n\nThis shows how AI is constantly pushing boundaries and becoming integrated into everyday technology.'
                }
            ]
        })
    },
    {
        'title': 'Knowledge Check: AI Fundamentals',
        'description': 'Test your understanding of AI basics',
        'order_index': 3,
        'content_type': 'quiz',
        'estimated_duration_minutes': 10,
        'is_required': True,
        'content': json.dumps({
            'passing_score': 70,
            'questions': [
                {
                    'id': 'q1',
                    'question': 'What is the relationship between AI, Machine Learning, and Deep Learning?',
                    'type': 'multiple_choice',
                    'options': [
                        'They are all the same thing',
                        'AI is the broadest term, ML is a subset of AI, and DL is a subset of ML',
                        'ML is the broadest term, AI is a subset of ML',
                        'They are completely unrelated fields'
                    ],
                    'correct_answer': 1,
                    'explanation': 'AI is the broadest concept, Machine Learning is a subset of AI, and Deep Learning is a subset of Machine Learning. They are nested categories.'
                },
                {
                    'id': 'q2',
                    'question': 'Which of the following is a current limitation of AI?',
                    'type': 'multiple_choice',
                    'options': [
                        'Image recognition',
                        'Language translation',
                        'Common sense reasoning',
                        'Playing chess'
                    ],
                    'correct_answer': 2,
                    'explanation': 'Common sense reasoning - understanding context and implicit knowledge that humans take for granted - remains a significant challenge for current AI systems.'
                },
                {
                    'id': 'q3',
                    'question': 'What is the "AI Effect"?',
                    'type': 'multiple_choice',
                    'options': [
                        'When AI becomes more powerful over time',
                        'When we stop calling something "AI" once it becomes commonplace',
                        'When AI makes mistakes',
                        'When AI learns from data'
                    ],
                    'correct_answer': 1,
                    'explanation': 'The AI Effect refers to the phenomenon where once AI solves a problem successfully, we tend to stop calling it "AI" and it becomes just another technology.'
                }
            ]
        })
    },
    {
        'title': 'Real-World AI Applications',
        'description': 'Explore how AI is being used across different industries and domains',
        'order_index': 4,
        'content_type': 'text',
        'estimated_duration_minutes': 20,
        'is_required': True,
        'content': json.dumps({
            'sections': [
                {
                    'heading': 'AI in Healthcare',
                    'content': '**Medical Imaging:** AI systems can analyze X-rays, MRIs, and CT scans to detect diseases like cancer, often with accuracy matching or exceeding human radiologists.\n\n**Drug Discovery:** AI accelerates the process of discovering new medications by predicting how different molecules will interact.\n\n**Personalized Treatment:** AI analyzes patient data to recommend personalized treatment plans based on individual characteristics and medical history.\n\n**Example:** Google\'s DeepMind developed an AI system that can detect over 50 eye diseases from retinal scans with 94% accuracy.'
                },
                {
                    'heading': 'AI in Transportation',
                    'content': '**Autonomous Vehicles:** Self-driving cars use AI to perceive their environment, make decisions, and navigate safely.\n\n**Traffic Management:** AI optimizes traffic light timing and routing to reduce congestion.\n\n**Predictive Maintenance:** AI predicts when vehicles or infrastructure need maintenance before failures occur.\n\n**Example:** Waymo\'s self-driving taxis have driven over 20 million miles on public roads.'
                },
                {
                    'heading': 'AI in Finance',
                    'content': '**Fraud Detection:** AI identifies unusual patterns in transactions that may indicate fraud.\n\n**Algorithmic Trading:** AI systems execute trades at optimal times based on market analysis.\n\n**Credit Scoring:** AI assesses creditworthiness by analyzing diverse data sources.\n\n**Customer Service:** AI chatbots handle routine banking inquiries 24/7.\n\n**Example:** PayPal uses AI to analyze millions of transactions and detect fraudulent activity in real-time.'
                },
                {
                    'heading': 'AI in Education',
                    'content': '**Personalized Learning:** AI adapts educational content to each student\'s pace and learning style.\n\n**Automated Grading:** AI can grade essays and provide feedback on writing.\n\n**Intelligent Tutoring:** AI tutors provide one-on-one assistance to students.\n\n**Administrative Efficiency:** AI automates scheduling, enrollment, and other administrative tasks.\n\n**Example:** Duolingo uses AI to personalize language learning paths for over 500 million users.'
                },
                {
                    'heading': 'AI in Entertainment',
                    'content': '**Content Recommendations:** Netflix, Spotify, and YouTube use AI to suggest content you might enjoy.\n\n**Content Creation:** AI can generate music, art, and even write scripts.\n\n**Game AI:** Non-player characters (NPCs) in games use AI to behave more realistically.\n\n**Special Effects:** AI is used in film production for visual effects and animation.\n\n**Example:** Netflix\'s recommendation system is estimated to save the company $1 billion per year by reducing customer churn.'
                }
            ]
        })
    },
    {
        'title': 'Continue Your AI Learning Journey',
        'description': 'Next steps and resources for deepening your AI knowledge',
        'order_index': 5,
        'content_type': 'text',
        'estimated_duration_minutes': 10,
        'is_required': True,
        'content': json.dumps({
            'sections': [
                {
                    'heading': 'Complete the Official Elements of AI Course',
                    'content': 'This curated path has introduced you to AI fundamentals, but there\'s much more to learn!\n\nThe official **Elements of AI** course offers:\n• 6 comprehensive chapters\n• Interactive exercises\n• Free certificate upon completion\n• Available in 20+ languages\n• No programming experience required\n\n**Enroll for free:** https://www.elementsofai.com/'
                },
                {
                    'heading': 'Recommended Next Steps',
                    'content': '**For Non-Technical Learners:**\n1. Complete Elements of AI (full course)\n2. Take "AI For Everyone" by Andrew Ng on Coursera\n3. Explore AI tools in your field (ChatGPT, Midjourney, etc.)\n\n**For Technical Learners:**\n1. Learn Python programming basics\n2. Take "Machine Learning" by Andrew Ng on Coursera\n3. Practice with Kaggle competitions\n4. Build your own AI projects'
                },
                {
                    'heading': 'Additional Free Resources',
                    'content': '• **Fast.ai:** Practical deep learning courses\n• **Google AI:** Educational resources and tools\n• **MIT OpenCourseWare:** Free AI course materials\n• **Papers with Code:** Latest AI research with code\n• **Hugging Face:** AI models and datasets'
                },
                {
                    'heading': 'Stay Updated',
                    'content': 'AI is rapidly evolving. Stay current by:\n• Following AI researchers on Twitter/X\n• Reading AI newsletters (The Batch, Import AI)\n• Joining AI communities (r/MachineLearning, AI Discord servers)\n• Attending AI meetups and conferences\n• Experimenting with new AI tools as they emerge'
                }
            ],
            'resources': [
                {'title': 'Elements of AI (Official)', 'url': 'https://www.elementsofai.com/'},
                {'title': 'AI For Everyone (Coursera)', 'url': 'https://www.coursera.org/learn/ai-for-everyone'},
                {'title': 'Fast.ai', 'url': 'https://www.fast.ai/'},
                {'title': 'Kaggle Learn', 'url': 'https://www.kaggle.com/learn'},
                {'title': 'Google AI Education', 'url': 'https://ai.google/education/'}
            ]
        })
    }
]


def seed_course_content(force=False, silent=False):
    """Seed course content (lessons) for training modules"""

    if not silent:
        print("🌱 Seeding course content...")

    # Define courses to seed
    courses_to_seed = [
        {
            'module_id': 'module-ai-fundamentals-intro',
            'module_data': {
                'title': 'Introduction to AI Fundamentals',
                'description': 'Learn the basics of artificial intelligence, how AI works, and how to use AI tools responsibly. This introductory course covers core concepts with hands-on exercises.',
                'role_specific': 'General',
                'difficulty_level': 1,
                'estimated_duration_minutes': 120,
                'content_type': 'interactive',
                'is_premium': False,
                'learning_objectives': json.dumps([
                    'Understand what AI is and how it differs from traditional programming',
                    'Learn about different types of AI and machine learning',
                    'Write effective prompts for AI tools',
                    'Use AI responsibly and ethically',
                    'Apply AI to boost productivity in daily tasks'
                ]),
                'target_domains': json.dumps(['AI Fundamentals', 'Practical Usage', 'Ethics & Critical Thinking'])
            },
            'lessons': AI_FUNDAMENTALS_INTRO_LESSONS
        },
        {
            'module_id': 'module-prompt-master',
            'module_data': None,  # Module already exists in training.py
            'lessons': PROMPT_ENGINEERING_MASTERY_LESSONS
        },
        {
            'module_id': 'module-elements-of-ai',
            'module_data': None,  # Module already exists in training.py
            'lessons': ELEMENTS_OF_AI_LESSONS
        }
    ]

    total_lessons_added = 0

    for course in courses_to_seed:
        module_id = course['module_id']
        module_data = course['module_data']
        lessons = course['lessons']

        # Get or create module
        module = TrainingModule.query.filter_by(id=module_id).first()

        if not module and module_data:
            # Create the module if it doesn't exist and we have data
            module = TrainingModule(
                id=module_id,
                **module_data
            )
            db.session.add(module)
            db.session.commit()
            if not silent:
                print(f"✅ Created module: {module.title}")
        elif not module:
            if not silent:
                print(f"⚠️  Module {module_id} not found. Skipping...")
            continue

        # Check if lessons already exist
        existing_lessons = Lesson.query.filter_by(module_id=module.id).count()

        if existing_lessons > 0 and not force:
            if not silent:
                print(f"ℹ️  '{module.title}' already has {existing_lessons} lessons. Use --force to reseed.")
            continue

        # Delete existing lessons if force=True
        if force and existing_lessons > 0:
            Lesson.query.filter_by(module_id=module.id).delete()
            db.session.commit()
            if not silent:
                print(f"🗑️  Deleted {existing_lessons} existing lessons from '{module.title}'")

        # Add lessons
        lessons_added = 0
        for lesson_data in lessons:
            lesson = Lesson(
                id=str(uuid.uuid4()),
                module_id=module.id,
                **lesson_data
            )
            db.session.add(lesson)
            lessons_added += 1

        db.session.commit()
        total_lessons_added += lessons_added

        if not silent:
            print(f"✅ Added {lessons_added} lessons to '{module.title}'")

    if not silent:
        print(f"\n📚 Course content seeding complete! Total lessons added: {total_lessons_added}")

    return total_lessons_added


if __name__ == '__main__':
    from app import app

    with app.app_context():
        import argparse
        parser = argparse.ArgumentParser()
        parser.add_argument('--force', action='store_true', help='Force reseed even if content exists')
        args = parser.parse_args()

        seed_course_content(force=args.force)

