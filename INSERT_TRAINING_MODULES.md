# Insert Training Modules into Supabase

## Overview
This guide will help you insert all 17 training modules into your Supabase database.

---

## Step 1: Access Supabase SQL Editor

1. Go to: **https://supabase.com/dashboard/project/sybctfhasyazoryzxjcg/sql**
2. Click **"New Query"** button

---

## Step 2: Clear Existing Modules (Optional)

If you want to start fresh and remove the 4 placeholder modules, run this first:

```sql
-- Delete existing training modules
DELETE FROM public.training_modules;
```

**Note:** This will also delete any user progress associated with these modules. If you want to keep existing progress, skip this step and the INSERT will add the new modules alongside existing ones (using `ON CONFLICT DO NOTHING`).

---

## Step 3: Run the INSERT Statement

Copy the entire SQL statement below and paste it into the Supabase SQL Editor, then click **"Run"**:

```sql
-- Insert all training modules (17 total)
INSERT INTO public.training_modules (title, description, difficulty_level, estimated_duration, learning_objectives, prerequisites, content)
VALUES
  -- Role-Specific Modules (LitmusAI Originals)
  (
    'AI Fundamentals for Sales Teams',
    'Leverage AI for lead generation, customer insights, and pipeline prioritization with practical playbooks for sales.',
    'beginner',
    45,
    ARRAY['Understand AI-assisted prospecting workflows', 'Automate lead scoring and next-best action recommendations', 'Build sales enablement assets with generative AI'],
    ARRAY['Familiarity with your CRM or sales engagement platform', 'Baseline understanding of your sales funnel stages'],
    '{"role_specific": "Sales", "content_type": "video", "content_url": "https://www.youtube.com/embed/f6BtsZ-eZkU", "provider": "LitmusAI Originals", "access_tier": "professional", "target_domains": ["Practical Usage", "AI Impact & Applications"]}'::jsonb
  ),
  (
    'Ethical AI in HR Practices',
    'Implement AI hiring and talent management responsibly with governance guardrails and bias mitigation steps.',
    'intermediate',
    55,
    ARRAY['Audit datasets and models for potential bias', 'Design fair review workflows combining humans and AI', 'Create transparent AI usage policies for employees'],
    ARRAY['Basic understanding of your talent lifecycle', 'Awareness of regional employment regulations'],
    '{"role_specific": "HR", "content_type": "video", "content_url": "https://www.youtube.com/embed/szO4cFfF07I", "provider": "LitmusAI Originals", "access_tier": "professional", "target_domains": ["Ethics & Critical Thinking", "AI Impact & Applications"]}'::jsonb
  ),
  (
    'AI-Powered Marketing Campaigns',
    'Create adaptive marketing campaigns using AI for content, segmentation, and performance optimization.',
    'intermediate',
    60,
    ARRAY['Generate campaign briefs and creative variations using AI', 'Build dynamic audience segments from zero-party data', 'Automate experimentation with AI-assisted analytics'],
    ARRAY['Access to your marketing automation platform', 'Baseline persona definitions and ICP clarity'],
    '{"role_specific": "Marketing", "content_type": "video", "content_url": "https://www.youtube.com/embed/x4PeQ0P5Y14", "provider": "LitmusAI Originals", "access_tier": "enterprise", "is_premium": true, "target_domains": ["Practical Usage", "Strategic Understanding"]}'::jsonb
  ),
  (
    'Operational Efficiency with AI',
    'Automate operations with AI copilots for process documentation, forecasting, and scenario planning.',
    'advanced',
    65,
    ARRAY['Map processes to automation opportunities', 'Deploy decision-support copilots for forecasting', 'Design resilient human-in-loop oversight models'],
    ARRAY['Process documentation for core workflows', 'Access to operational performance data'],
    '{"role_specific": "Operations", "content_type": "interactive", "content_url": "https://www.youtube.com/embed/9dME8NwB1Vw", "provider": "LitmusAI Originals", "access_tier": "enterprise", "is_premium": true, "target_domains": ["Strategic Understanding", "AI Impact & Applications"]}'::jsonb
  ),
  (
    'Prompt Engineering Mastery',
    'Master advanced prompt patterns, system instructions, and evaluation loops for reliable AI outputs.',
    'intermediate',
    50,
    ARRAY['Apply advanced prompt frameworks like IDEA & CRAFT', 'Chain multi-step prompts with memory and guardrails', 'Evaluate and iterate prompts using quality rubrics'],
    ARRAY['Basic familiarity with large language models', 'An AI workspace (ChatGPT, Claude, Gemini, etc.)'],
    '{"role_specific": "General", "content_type": "interactive", "content_url": "https://www.youtube.com/embed/wVzuvf9D9BU", "provider": "LitmusAI Originals", "access_tier": "professional", "target_domains": ["Practical Usage", "AI Fundamentals"]}'::jsonb
  ),
  
  -- Free External Courses
  (
    'Google AI Essentials',
    'Google''s free program that demystifies AI fundamentals and shows how to integrate it responsibly into everyday workflows.',
    'beginner',
    180,
    ARRAY['Understand core AI terminology and responsible use principles', 'Apply AI prompts to boost productivity and creativity', 'Identify real-world opportunities to automate tasks with AI tools'],
    ARRAY[]::TEXT[],
    '{"role_specific": "General", "content_type": "external", "content_url": "https://grow.google/certificates/ai-essentials/", "provider": "Google", "access_tier": "free", "external_url": "https://grow.google/certificates/ai-essentials/", "accreditation": "Google AI Essentials Certificate", "target_domains": ["AI Fundamentals", "Practical Usage"]}'::jsonb
  ),
  (
    'Elements of AI',
    'A globally recognized introduction to artificial intelligence created by the University of Helsinki and MinnaLearn.',
    'beginner',
    420,
    ARRAY['Explain foundational AI concepts and terminology', 'Recognize the societal impact and ethical considerations of AI', 'Complete interactive exercises that reinforce core concepts'],
    ARRAY[]::TEXT[],
    '{"role_specific": "General", "content_type": "external", "content_url": "https://www.elementsofai.com/", "provider": "University of Helsinki & MinnaLearn", "access_tier": "free", "external_url": "https://www.elementsofai.com/", "accreditation": "Free certificate upon completion", "target_domains": ["AI Fundamentals", "Ethics & Critical Thinking"]}'::jsonb
  ),
  (
    'IBM SkillsBuild: AI Fundamentals',
    'IBM''s SkillsBuild pathway covering AI fundamentals, ethics, and hands-on labs for students and professionals.',
    'beginner',
    300,
    ARRAY['Discover how AI systems are designed and evaluated', 'Practice with AI services through guided labs', 'Earn IBM digital credentials for career advancement'],
    ARRAY[]::TEXT[],
    '{"role_specific": "General", "content_type": "external", "content_url": "https://skillsbuild.org/", "provider": "IBM SkillsBuild", "access_tier": "free", "external_url": "https://skillsbuild.org/", "accreditation": "IBM digital credential", "target_domains": ["AI Fundamentals", "Practical Usage", "Ethics & Critical Thinking"]}'::jsonb
  ),
  (
    'freeCodeCamp: Machine Learning with Python',
    'Project-based curriculum covering machine learning fundamentals using Python, NumPy, pandas, and scikit-learn.',
    'intermediate',
    600,
    ARRAY['Build and evaluate machine learning models in Python', 'Complete hands-on projects credited toward freeCodeCamp certifications', 'Prepare for intermediate data science and ML roles'],
    ARRAY[]::TEXT[],
    '{"role_specific": "General", "content_type": "external", "content_url": "https://www.freecodecamp.org/learn/machine-learning-with-python/", "provider": "freeCodeCamp", "access_tier": "free", "external_url": "https://www.freecodecamp.org/learn/machine-learning-with-python/", "accreditation": "freeCodeCamp Machine Learning with Python certification", "target_domains": ["AI Fundamentals", "Practical Usage"]}'::jsonb
  ),
  (
    'University of Maryland: Introduction to Artificial Intelligence',
    'A fully free introductory AI certificate program offered by the University of Maryland.',
    'beginner',
    360,
    ARRAY['Study AI foundational concepts with academic rigor', 'Earn a university-backed certificate with no tuition cost', 'Build a portfolio of AI assignments validated by faculty'],
    ARRAY[]::TEXT[],
    '{"role_specific": "General", "content_type": "external", "content_url": "https://www.umgc.edu/artificial-intelligence", "provider": "University of Maryland", "access_tier": "free", "external_url": "https://www.umgc.edu/artificial-intelligence", "accreditation": "University of Maryland certificate", "target_domains": ["AI Fundamentals"]}'::jsonb
  ),
  
  -- Premium External Courses
  (
    'MIT OpenCourseWare: Artificial Intelligence',
    'Access MIT''s graduate-level AI lectures, assignments, and exams via OCW''s open license repository.',
    'advanced',
    900,
    ARRAY['Study search, knowledge representation, learning, and reasoning at MIT depth', 'Review lecture notes, assignments, and solutions for self-paced mastery', 'Qualify learners for advanced AI leadership pathways'],
    ARRAY[]::TEXT[],
    '{"role_specific": "General", "content_type": "external", "content_url": "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2020/", "provider": "MIT OpenCourseWare", "access_tier": "enterprise", "is_premium": true, "external_url": "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2020/", "accreditation": "No formal certificate; recognized MIT curriculum", "target_domains": ["AI Fundamentals", "Strategic Understanding"]}'::jsonb
  ),
  (
    'Stanford CS229 Machine Learning',
    'Stanford University''s famed graduate machine learning course, made available via open course materials.',
    'advanced',
    960,
    ARRAY['Master supervised, unsupervised, and reinforcement learning at graduate depth', 'Complete mathematical derivations and problem sets used in Stanford''s curriculum', 'Prepare for advanced AI research or enterprise leadership roles'],
    ARRAY[]::TEXT[],
    '{"role_specific": "General", "content_type": "external", "content_url": "https://cs229.stanford.edu/", "provider": "Stanford University", "access_tier": "enterprise", "is_premium": true, "external_url": "https://cs229.stanford.edu/", "accreditation": "No formal certificate; globally recognized curriculum", "target_domains": ["AI Fundamentals", "Strategic Understanding"]}'::jsonb
  ),
  
  -- Partner Programs
  (
    'Coursera for Business Partnerships',
    'Negotiate enterprise licensing for Coursera''s AI specializations and professional certificates.',
    'intermediate',
    60,
    ARRAY['Evaluate Coursera''s partnership model and revenue sharing terms', 'Select AI learning paths from top universities for enterprise deployment', 'Integrate Coursera analytics with internal progress tracking'],
    ARRAY[]::TEXT[],
    '{"role_specific": "General", "content_type": "partner", "content_url": "https://www.coursera.org/business", "provider": "Coursera for Business", "access_tier": "partner", "is_premium": true, "external_url": "https://www.coursera.org/business", "cta_text": "Contact Coursera Partnerships", "target_domains": ["Strategic Understanding"]}'::jsonb
  ),
  (
    'EverWorker Academy: AI Fundamentals for Business Leaders',
    'Partner with EverWorker Academy to license AI business training tailored for leadership teams.',
    'intermediate',
    240,
    ARRAY['Explore AI strategy frameworks for business leaders', 'Assess licensing opportunities for white-label deployment', 'Align AI capability building with change management goals'],
    ARRAY[]::TEXT[],
    '{"role_specific": "Executive", "content_type": "partner", "content_url": "https://everworker.academy/", "provider": "EverWorker Academy", "access_tier": "partner", "is_premium": true, "external_url": "https://everworker.academy/", "cta_text": "Explore Licensing Options", "target_domains": ["Strategic Understanding", "AI Impact & Applications"]}'::jsonb
  ),
  (
    'DataCamp AI Fundamentals Partnership',
    'Integrate DataCamp''s AI skills assessments and learning paths with analytics and reporting.',
    'intermediate',
    120,
    ARRAY['Review DataCamp''s AI curriculum and assessment tooling', 'Design pathways that blend in-house and DataCamp content', 'Negotiate revenue sharing and dashboard integration'],
    ARRAY[]::TEXT[],
    '{"role_specific": "General", "content_type": "partner", "content_url": "https://www.datacamp.com/business", "provider": "DataCamp", "access_tier": "partner", "is_premium": true, "external_url": "https://www.datacamp.com/business", "cta_text": "Connect with DataCamp", "target_domains": ["AI Fundamentals", "Practical Usage"]}'::jsonb
  ),
  
  -- Affiliate Programs
  (
    'AI Fire Academy Affiliate Program',
    'Earn up to 35% commission promoting AI Fire Academy''s premium AI education programs.',
    'intermediate',
    45,
    ARRAY['Understand the AI Fire Academy course catalog and commission structure', 'Set up tracking links and marketing assets', 'Optimize referral flows for recurring revenue'],
    ARRAY[]::TEXT[],
    '{"role_specific": "General", "content_type": "affiliate", "content_url": "https://aifireacademy.com/affiliates", "provider": "AI Fire Academy", "access_tier": "affiliate", "is_premium": true, "external_url": "https://aifireacademy.com/affiliates", "cta_text": "Join Affiliate Program", "target_domains": ["Practical Usage"]}'::jsonb
  ),
  (
    'CustomGPT.ai Education Affiliate',
    'Monetize CustomGPT.ai education plans with 20% recurring commission for two years.',
    'intermediate',
    45,
    ARRAY['Promote CustomGPT.ai educational tiers and tooling', 'Implement affiliate tracking and reporting', 'Bundle CustomGPT.ai with internal AI literacy journeys'],
    ARRAY[]::TEXT[],
    '{"role_specific": "General", "content_type": "affiliate", "content_url": "https://customgpt.ai/affiliates", "provider": "CustomGPT.ai", "access_tier": "affiliate", "is_premium": true, "external_url": "https://customgpt.ai/affiliates", "cta_text": "Apply to CustomGPT Affiliate", "target_domains": ["Practical Usage", "AI Fundamentals"]}'::jsonb
  )
ON CONFLICT DO NOTHING;
```

---

## Step 4: Verify the Insert

After running the INSERT, verify all 17 modules were added:

```sql
-- Count total modules
SELECT COUNT(*) as total_modules FROM public.training_modules;
-- Expected result: 17 (or more if you didn't delete existing ones)

-- View all modules
SELECT 
  title, 
  difficulty_level, 
  estimated_duration,
  content->>'provider' as provider,
  content->>'access_tier' as access_tier
FROM public.training_modules
ORDER BY difficulty_level, title;
```

---

## Step 5: Test on the Website

1. Go to: **https://litmusai.netlify.app/training**
2. You should see all 17 training modules displayed
3. Open browser console (F12) and look for: `[Training] Modules fetched: 17 modules`

---

## Expected Result

You should see these 17 modules on the training page:

### Beginner (6 modules)
- AI Fundamentals for Sales Teams
- Elements of AI
- Google AI Essentials
- IBM SkillsBuild: AI Fundamentals
- University of Maryland: Introduction to AI

### Intermediate (9 modules)
- AI Fire Academy Affiliate Program
- AI-Powered Marketing Campaigns
- Coursera for Business Partnerships
- CustomGPT.ai Education Affiliate
- DataCamp AI Fundamentals Partnership
- Ethical AI in HR Practices
- EverWorker Academy: AI for Business Leaders
- freeCodeCamp: Machine Learning with Python
- Prompt Engineering Mastery

### Advanced (2 modules)
- MIT OpenCourseWare: Artificial Intelligence
- Operational Efficiency with AI
- Stanford CS229 Machine Learning

---

## Troubleshooting

### If you get an error about duplicate keys:
The `ON CONFLICT DO NOTHING` clause should prevent this, but if you still get errors, you can:
1. Delete existing modules first (see Step 2)
2. Or modify the INSERT to use `ON CONFLICT (title) DO UPDATE SET ...`

### If modules don't appear on the website:
1. Check browser console for errors
2. Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
3. Verify the modules are in the database with the verification query

---

**Status**: Ready to execute ✅

