-- Replace stale placeholder course media with curated, attributed lesson videos.

begin;

with curated_modules (
  id,
  title,
  description,
  role_specific,
  difficulty_level,
  estimated_duration_minutes,
  content_type,
  content_url,
  is_premium,
  learning_objectives,
  target_domains,
  prerequisites
) as (
  values
    (
      'module-ai-fundamentals-intro',
      'Introduction to AI Fundamentals',
      'Learn the basics of artificial intelligence, how AI works, and how to use AI tools responsibly. This introductory course covers core concepts with hands-on exercises.',
      'General',
      1,
      120,
      'interactive',
      'https://www.youtube-nocookie.com/embed/qYNweeDHiyU',
      false,
      $json$["Understand what AI is and how it differs from traditional programming", "Learn about different types of AI and machine learning", "Write effective prompts for AI tools", "Use AI responsibly and ethically", "Apply AI to boost productivity in daily tasks"]$json$::jsonb,
      $json$["AI Fundamentals", "Practical Usage", "Ethics & Critical Thinking"]$json$::jsonb,
      $json${
        "requirements": [],
        "resources": [
          {"label": "Google AI Essentials", "url": "https://grow.google/ai-essentials/"}
        ],
        "sections": [],
        "metadata": {
          "provider": "LitmusAI Originals",
          "access_tier": "free",
          "format": "interactive",
          "accreditation": "Internal certificate of completion",
          "video_url": "https://www.youtube-nocookie.com/embed/qYNweeDHiyU",
          "video_title": "AI, Machine Learning, Deep Learning and Generative AI Explained",
          "creator": "IBM Technology",
          "creator_url": "https://www.youtube.com/@IBMTechnology",
          "duration_minutes": 10,
          "license": "Embedded from YouTube for educational use; all rights remain with the creator.",
          "original_url": "https://www.youtube.com/watch?v=qYNweeDHiyU",
          "attribution": "Video by IBM Technology. Embedded from YouTube for educational use.",
          "curation_note": "Matches the module's AI fundamentals, machine learning, and generative AI objectives without leaning on a product demo.",
          "fallback_url": "https://www.youtube.com/watch?v=GvYYFloV0aA"
        }
      }$json$::jsonb
    ),
    (
      'module-ai-sales',
      'AI Fundamentals for Sales Teams',
      'Leverage AI for lead generation, customer insights, and pipeline prioritization with practical playbooks for sales.',
      'Sales',
      1,
      45,
      'video',
      'https://www.youtube-nocookie.com/embed/R8CepUwdZis',
      false,
      $json$["Understand AI-assisted prospecting workflows", "Automate lead scoring and next-best action recommendations", "Build sales enablement assets with generative AI"]$json$::jsonb,
      $json$["Practical Usage", "AI Impact & Applications"]$json$::jsonb,
      $json${
        "requirements": ["Familiarity with your CRM or sales engagement platform", "Baseline understanding of your sales funnel stages"],
        "resources": [
          {"label": "AI Discovery Call Script Template", "url": "https://drive.google.com/your-template"},
          {"label": "Sample AI-Assisted Prospecting Workflow", "url": "https://www.notion.so/your-workflow"}
        ],
        "sections": [
          {"title": "AI Opportunity Landscape for Sales", "summary": "Where AI accelerates outbound, inbound, and account expansion motions.", "duration_minutes": 8},
          {"title": "Prompt Engineering for Sales Emails", "summary": "Framework and live demo for writing hyper-personalized outreach prompts.", "duration_minutes": 14},
          {"title": "Hands-on Lab: Build a Sales Playbook", "summary": "Guided exercise to build a multi-touch campaign using generative AI.", "duration_minutes": 18}
        ],
        "metadata": {
          "provider": "LitmusAI Originals",
          "access_tier": "professional",
          "format": "video",
          "accreditation": "Internal certificate of completion",
          "video_url": "https://www.youtube-nocookie.com/embed/R8CepUwdZis",
          "video_title": "5 Ways Generative AI is Revolutionizing Sales Automation",
          "creator": "IBM",
          "creator_url": "https://www.youtube.com/@IBM",
          "duration_minutes": 8,
          "license": "Embedded from YouTube for educational use; all rights remain with the creator.",
          "original_url": "https://www.youtube.com/watch?v=R8CepUwdZis",
          "attribution": "Video by IBM. Embedded from YouTube for educational use.",
          "curation_note": "Covers sales automation, prospecting support, and workflow leverage, matching the sales module's lead generation and enablement goals.",
          "fallback_url": "https://www.youtube.com/watch?v=wJWTXk4HDS0"
        }
      }$json$::jsonb
    ),
    (
      'module-ethical-hr',
      'Ethical AI in HR Practices',
      'Implement AI hiring and talent management responsibly with governance guardrails and bias mitigation steps.',
      'HR',
      2,
      55,
      'video',
      'https://www.youtube-nocookie.com/embed/og67qeTZPYs',
      false,
      $json$["Audit datasets and models for potential bias", "Design fair review workflows combining humans and AI", "Create transparent AI usage policies for employees"]$json$::jsonb,
      $json$["Ethics & Critical Thinking", "AI Impact & Applications"]$json$::jsonb,
      $json${
        "requirements": ["Basic understanding of your talent lifecycle", "Awareness of regional employment regulations"],
        "resources": [
          {"label": "Bias Assessment Checklist", "url": "https://example.com/bias-checklist.pdf"},
          {"label": "Responsible AI Policy Template", "url": "https://example.com/ai-policy-template"}
        ],
        "sections": [
          {"title": "Foundations of Responsible AI in People Ops", "summary": "Core principles for ethical automation in recruitment and performance cycles.", "duration_minutes": 10},
          {"title": "Mitigating Bias During Screening", "summary": "Human-in-the-loop review techniques and tooling recommendations.", "duration_minutes": 20},
          {"title": "Designing Transparent Employee Communication", "summary": "How to explain AI decisions to candidates and employees.", "duration_minutes": 15}
        ],
        "metadata": {
          "provider": "LitmusAI Originals",
          "access_tier": "professional",
          "format": "video",
          "accreditation": "Internal certificate of completion",
          "video_url": "https://www.youtube-nocookie.com/embed/og67qeTZPYs",
          "video_title": "Algorithmic Bias in AI: What It Is and How to Fix It",
          "creator": "IBM Technology",
          "creator_url": "https://www.youtube.com/@IBMTechnology",
          "duration_minutes": 9,
          "license": "Embedded from YouTube for educational use; all rights remain with the creator.",
          "original_url": "https://www.youtube.com/watch?v=og67qeTZPYs",
          "attribution": "Video by IBM Technology. Embedded from YouTube for educational use.",
          "curation_note": "Directly supports HR lessons on bias checks, human review, fairness, and responsible AI governance.",
          "fallback_url": "https://www.youtube.com/watch?v=yh-3WU1FKrk"
        }
      }$json$::jsonb
    ),
    (
      'module-marketing-ai',
      'AI-Powered Marketing Campaigns',
      'Create adaptive marketing campaigns using AI for content, segmentation, and performance optimization.',
      'Marketing',
      2,
      60,
      'video',
      'https://www.youtube-nocookie.com/embed/c54qSfmTT5U',
      true,
      $json$["Generate campaign briefs and creative variations using AI", "Build dynamic audience segments from zero-party data", "Automate experimentation with AI-assisted analytics"]$json$::jsonb,
      $json$["Practical Usage", "Strategic Understanding"]$json$::jsonb,
      $json${
        "requirements": ["Access to your marketing automation platform", "Baseline persona definitions and ICP clarity"],
        "resources": [
          {"label": "AI Campaign Brief Prompt Pack", "url": "https://example.com/marketing-prompts"}
        ],
        "sections": [
          {"title": "From ICP to AI-Powered Segmentation", "summary": "Translate personas into AI-ready segmentation prompts.", "duration_minutes": 12},
          {"title": "Content Generation Systems", "summary": "Build a structured prompting system for multi-channel content.", "duration_minutes": 18},
          {"title": "Measurement & Iteration", "summary": "Instrument AI-assisted campaign dashboards for rapid iteration.", "duration_minutes": 17}
        ],
        "metadata": {
          "provider": "LitmusAI Originals",
          "access_tier": "enterprise",
          "format": "video",
          "accreditation": "Internal certificate of completion",
          "video_url": "https://www.youtube-nocookie.com/embed/c54qSfmTT5U",
          "video_title": "Putting AI to Work for Marketing",
          "creator": "IBM Technology",
          "creator_url": "https://www.youtube.com/@IBMTechnology",
          "duration_minutes": 12,
          "license": "Embedded from YouTube for educational use; all rights remain with the creator.",
          "original_url": "https://www.youtube.com/watch?v=c54qSfmTT5U",
          "attribution": "Video by IBM Technology. Embedded from YouTube for educational use.",
          "curation_note": "Matches the marketing module's campaign planning, content variation, and performance iteration themes.",
          "fallback_url": "https://www.youtube.com/watch?v=kyTu3mgGfUA"
        }
      }$json$::jsonb
    ),
    (
      'module-ops-ai',
      'Operational Efficiency with AI',
      'Automate operations with AI copilots for process documentation, forecasting, and scenario planning.',
      'Operations',
      3,
      65,
      'interactive',
      'https://www.youtube-nocookie.com/embed/4VCwKSaMOqY',
      true,
      $json$["Map processes to automation opportunities", "Deploy decision-support copilots for forecasting", "Design resilient human-in-loop oversight models"]$json$::jsonb,
      $json$["Strategic Understanding", "AI Impact & Applications"]$json$::jsonb,
      $json${
        "requirements": ["Process documentation for core workflows", "Access to operational performance data"],
        "resources": [
          {"label": "AI Copilot Business Case Template", "url": "https://example.com/ops-business-case"}
        ],
        "sections": [
          {"title": "Identifying Automation Wins", "summary": "Assess effort vs. impact using an AI automation scorecard.", "duration_minutes": 15},
          {"title": "Designing Copilot Interfaces", "summary": "Key design patterns for conversational copilots in operations.", "duration_minutes": 20},
          {"title": "Governance and Monitoring", "summary": "Set success metrics and ongoing monitoring routines.", "duration_minutes": 18}
        ],
        "metadata": {
          "provider": "LitmusAI Originals",
          "access_tier": "enterprise",
          "format": "interactive",
          "accreditation": "Internal certificate of completion",
          "video_url": "https://www.youtube-nocookie.com/embed/4VCwKSaMOqY",
          "video_title": "Putting AI to work in IT Operations",
          "creator": "IBM Technology",
          "creator_url": "https://www.youtube.com/@IBMTechnology",
          "duration_minutes": 7,
          "license": "Embedded from YouTube for educational use; all rights remain with the creator.",
          "original_url": "https://www.youtube.com/watch?v=4VCwKSaMOqY",
          "attribution": "Video by IBM Technology. Embedded from YouTube for educational use.",
          "curation_note": "Supports process automation, monitoring, and human oversight themes for operational AI workflows.",
          "fallback_url": "https://www.youtube.com/watch?v=hnFpPA9xEBo"
        }
      }$json$::jsonb
    ),
    (
      'module-prompt-master',
      'Prompt Engineering Mastery',
      'Master advanced prompt patterns, system instructions, and evaluation loops for reliable AI outputs.',
      'General',
      2,
      50,
      'interactive',
      'https://www.youtube-nocookie.com/embed/T9aRN5JkmL8',
      false,
      $json$["Apply advanced prompt frameworks like IDEA & CRAFT", "Chain multi-step prompts with memory and guardrails", "Evaluate and iterate prompts using quality rubrics"]$json$::jsonb,
      $json$["Practical Usage", "AI Fundamentals"]$json$::jsonb,
      $json${
        "requirements": ["Basic familiarity with large language models", "An AI workspace (ChatGPT, Claude, Gemini, etc.)"],
        "resources": [
          {"label": "Prompt Evaluation Scorecard", "url": "https://example.com/prompt-scorecard"}
        ],
        "sections": [
          {"title": "Prompt Design Fundamentals", "summary": "Core building blocks: instructions, context, format, examples, tone.", "duration_minutes": 10},
          {"title": "Midjourney, GPT, and Claude Patterns", "summary": "Adapting prompts across creative, analytical, and strategic use cases.", "duration_minutes": 16},
          {"title": "Evaluation & Refinement Lab", "summary": "Hands-on exercises with scoring rubrics and rapid iteration cycles.", "duration_minutes": 18}
        ],
        "metadata": {
          "provider": "LitmusAI Originals",
          "access_tier": "professional",
          "format": "interactive",
          "accreditation": "Internal certificate of completion",
          "video_url": "https://www.youtube-nocookie.com/embed/T9aRN5JkmL8",
          "video_title": "AI prompt engineering: A deep dive",
          "creator": "Anthropic",
          "creator_url": "https://www.youtube.com/@anthropic-ai",
          "duration_minutes": 12,
          "license": "Embedded from YouTube for educational use; all rights remain with the creator.",
          "original_url": "https://www.youtube.com/watch?v=T9aRN5JkmL8",
          "attribution": "Video by Anthropic. Embedded from YouTube for educational use.",
          "curation_note": "Aligns with advanced prompt structure, model behavior, and evaluation lessons in Prompt Engineering Mastery.",
          "fallback_url": "https://www.youtube.com/watch?v=_ZvnD73m40o"
        }
      }$json$::jsonb
    )
)
insert into public.training_module (
  id,
  title,
  description,
  role_specific,
  difficulty_level,
  estimated_duration_minutes,
  content_type,
  content_url,
  prerequisites,
  learning_objectives,
  is_premium,
  is_active,
  target_domains
)
select
  id,
  title,
  description,
  role_specific,
  difficulty_level,
  estimated_duration_minutes,
  content_type,
  content_url,
  prerequisites::text,
  learning_objectives::text,
  is_premium,
  true,
  target_domains::text
from curated_modules
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  role_specific = excluded.role_specific,
  difficulty_level = excluded.difficulty_level,
  estimated_duration_minutes = excluded.estimated_duration_minutes,
  content_type = excluded.content_type,
  content_url = excluded.content_url,
  prerequisites = excluded.prerequisites,
  learning_objectives = excluded.learning_objectives,
  is_premium = excluded.is_premium,
  is_active = true,
  target_domains = excluded.target_domains;

with curated_lessons (
  id,
  module_id,
  title,
  description,
  order_index,
  estimated_duration_minutes,
  content
) as (
  values
    (
      'lesson-module-ai-fundamentals-intro-video',
      'module-ai-fundamentals-intro',
      'Video: AI Literacy Foundations',
      'A concise visual overview of modern AI, core concepts, and responsible use.',
      8,
      12,
      $json${
        "video_url": "https://www.youtube-nocookie.com/embed/qYNweeDHiyU",
        "video_title": "AI, Machine Learning, Deep Learning and Generative AI Explained",
        "creator": "IBM Technology",
        "creator_url": "https://www.youtube.com/@IBMTechnology",
        "duration_minutes": 10,
        "license": "Embedded from YouTube for educational use; all rights remain with the creator.",
        "original_url": "https://www.youtube.com/watch?v=qYNweeDHiyU",
        "attribution": "Video by IBM Technology. Embedded from YouTube for educational use.",
        "curation_note": "Matches the module's AI fundamentals, machine learning, and generative AI objectives without leaning on a product demo.",
        "fallback_url": "https://www.youtube.com/watch?v=GvYYFloV0aA",
        "summary": "Use this video to connect the text lessons to a practical overview of how AI systems are used in real workflows.",
        "key_takeaways": [
          "AI literacy starts with clear mental models for what AI can and cannot do",
          "Prompt quality depends on context, constraints, and examples",
          "Responsible use requires verification, privacy awareness, and human review"
        ],
        "resources": [
          {"title": "Google AI Essentials", "url": "https://grow.google/ai-essentials/"}
        ]
      }$json$::jsonb
    ),
    (
      'lesson-module-ai-sales-video',
      'module-ai-sales',
      'AI Sales Workflow Walkthrough',
      'A guided video module on applying AI to prospecting, lead scoring, and sales enablement.',
      1,
      18,
      $json${
        "video_url": "https://www.youtube-nocookie.com/embed/R8CepUwdZis",
        "video_title": "5 Ways Generative AI is Revolutionizing Sales Automation",
        "creator": "IBM",
        "creator_url": "https://www.youtube.com/@IBM",
        "duration_minutes": 8,
        "license": "Embedded from YouTube for educational use; all rights remain with the creator.",
        "original_url": "https://www.youtube.com/watch?v=R8CepUwdZis",
        "attribution": "Video by IBM. Embedded from YouTube for educational use.",
        "curation_note": "Covers sales automation, prospecting support, and workflow leverage, matching the sales module's lead generation and enablement goals.",
        "fallback_url": "https://www.youtube.com/watch?v=wJWTXk4HDS0",
        "key_points": [
          "Use AI to prioritize accounts and next-best actions",
          "Draft personalized outreach with clear human review steps",
          "Connect AI workflows to existing CRM stages"
        ],
        "key_takeaways": [
          "Use AI to prioritize accounts and next-best actions",
          "Draft personalized outreach with clear human review steps",
          "Connect AI workflows to existing CRM stages"
        ],
        "resources": []
      }$json$::jsonb
    ),
    (
      'lesson-module-ethical-hr-video',
      'module-ethical-hr',
      'Responsible AI for People Operations',
      'A practical video lesson on bias checks, transparent communication, and human oversight in HR workflows.',
      1,
      20,
      $json${
        "video_url": "https://www.youtube-nocookie.com/embed/og67qeTZPYs",
        "video_title": "Algorithmic Bias in AI: What It Is and How to Fix It",
        "creator": "IBM Technology",
        "creator_url": "https://www.youtube.com/@IBMTechnology",
        "duration_minutes": 9,
        "license": "Embedded from YouTube for educational use; all rights remain with the creator.",
        "original_url": "https://www.youtube.com/watch?v=og67qeTZPYs",
        "attribution": "Video by IBM Technology. Embedded from YouTube for educational use.",
        "curation_note": "Directly supports HR lessons on bias checks, human review, fairness, and responsible AI governance.",
        "fallback_url": "https://www.youtube.com/watch?v=yh-3WU1FKrk",
        "key_points": [
          "Audit AI-assisted hiring workflows for fairness risks",
          "Keep humans accountable for talent decisions",
          "Document policy and communication guardrails"
        ],
        "key_takeaways": [
          "Audit AI-assisted hiring workflows for fairness risks",
          "Keep humans accountable for talent decisions",
          "Document policy and communication guardrails"
        ],
        "resources": []
      }$json$::jsonb
    ),
    (
      'lesson-module-marketing-ai-video',
      'module-marketing-ai',
      'Building AI-Powered Campaign Systems',
      'A video lesson on using AI for campaign briefs, segmentation, content variants, and performance iteration.',
      1,
      22,
      $json${
        "video_url": "https://www.youtube-nocookie.com/embed/c54qSfmTT5U",
        "video_title": "Putting AI to Work for Marketing",
        "creator": "IBM Technology",
        "creator_url": "https://www.youtube.com/@IBMTechnology",
        "duration_minutes": 12,
        "license": "Embedded from YouTube for educational use; all rights remain with the creator.",
        "original_url": "https://www.youtube.com/watch?v=c54qSfmTT5U",
        "attribution": "Video by IBM Technology. Embedded from YouTube for educational use.",
        "curation_note": "Matches the marketing module's campaign planning, content variation, and performance iteration themes.",
        "fallback_url": "https://www.youtube.com/watch?v=kyTu3mgGfUA",
        "key_points": [
          "Translate campaign goals into structured AI prompts",
          "Generate audience and channel variants responsibly",
          "Review AI output against brand and performance criteria"
        ],
        "key_takeaways": [
          "Translate campaign goals into structured AI prompts",
          "Generate audience and channel variants responsibly",
          "Review AI output against brand and performance criteria"
        ],
        "resources": []
      }$json$::jsonb
    ),
    (
      'lesson-module-ops-ai-video',
      'module-ops-ai',
      'Operational AI Copilot Walkthrough',
      'A practical video lesson on finding automation opportunities, designing copilots, and monitoring outcomes.',
      1,
      22,
      $json${
        "video_url": "https://www.youtube-nocookie.com/embed/4VCwKSaMOqY",
        "video_title": "Putting AI to work in IT Operations",
        "creator": "IBM Technology",
        "creator_url": "https://www.youtube.com/@IBMTechnology",
        "duration_minutes": 7,
        "license": "Embedded from YouTube for educational use; all rights remain with the creator.",
        "original_url": "https://www.youtube.com/watch?v=4VCwKSaMOqY",
        "attribution": "Video by IBM Technology. Embedded from YouTube for educational use.",
        "curation_note": "Supports process automation, monitoring, and human oversight themes for operational AI workflows.",
        "fallback_url": "https://www.youtube.com/watch?v=hnFpPA9xEBo",
        "key_points": [
          "Map repetitive workflows before selecting an AI intervention",
          "Define human checkpoints for forecasts and process recommendations",
          "Measure cycle time, quality, and exception handling after launch"
        ],
        "key_takeaways": [
          "Map repetitive workflows before selecting an AI intervention",
          "Define human checkpoints for forecasts and process recommendations",
          "Measure cycle time, quality, and exception handling after launch"
        ],
        "resources": []
      }$json$::jsonb
    ),
    (
      'lesson-module-prompt-master-video',
      'module-prompt-master',
      'Video: Prompt Engineering in Practice',
      'Watch a practical walkthrough of prompt structure, examples, and iteration.',
      7,
      12,
      $json${
        "video_url": "https://www.youtube-nocookie.com/embed/T9aRN5JkmL8",
        "video_title": "AI prompt engineering: A deep dive",
        "creator": "Anthropic",
        "creator_url": "https://www.youtube.com/@anthropic-ai",
        "duration_minutes": 12,
        "license": "Embedded from YouTube for educational use; all rights remain with the creator.",
        "original_url": "https://www.youtube.com/watch?v=T9aRN5JkmL8",
        "attribution": "Video by Anthropic. Embedded from YouTube for educational use.",
        "curation_note": "Aligns with advanced prompt structure, model behavior, and evaluation lessons in Prompt Engineering Mastery.",
        "fallback_url": "https://www.youtube.com/watch?v=_ZvnD73m40o",
        "summary": "This video reinforces the CRAFT framework and shows how prompt specificity changes output quality.",
        "key_takeaways": [
          "Examples help models match your desired format and style",
          "Breaking complex tasks into steps improves reasoning quality",
          "Iteration is part of the workflow, not a failure state"
        ],
        "resources": [
          {"title": "Prompt Engineering Guide", "url": "https://www.promptingguide.ai/"}
        ]
      }$json$::jsonb
    )
)
insert into public.lesson (
  id,
  module_id,
  title,
  description,
  order_index,
  content_type,
  content,
  estimated_duration_minutes,
  is_required
)
select
  id,
  module_id,
  title,
  description,
  order_index,
  'video',
  content::text,
  estimated_duration_minutes,
  true
from curated_lessons
on conflict (id) do update set
  module_id = excluded.module_id,
  title = excluded.title,
  description = excluded.description,
  order_index = excluded.order_index,
  content_type = excluded.content_type,
  content = excluded.content,
  estimated_duration_minutes = excluded.estimated_duration_minutes,
  is_required = true;

do $$
declare
  placeholder_pattern text := '(media\.w3\.org|interactive-examples\.mdn\.mozilla\.net|flower\.mp4|bunny|sintel|movie_300)';
begin
  if exists (
    select 1
    from public.training_module
    where id in (
      'module-ai-fundamentals-intro',
      'module-ai-sales',
      'module-ethical-hr',
      'module-marketing-ai',
      'module-ops-ai',
      'module-prompt-master'
    )
    and coalesce(content_url, '') ~* placeholder_pattern
  ) then
    raise exception 'Curated training video migration left placeholder module media behind.';
  end if;

  if exists (
    select tm.id
    from public.training_module tm
    where tm.id in (
      'module-ai-fundamentals-intro',
      'module-ai-sales',
      'module-ethical-hr',
      'module-marketing-ai',
      'module-ops-ai',
      'module-prompt-master'
    )
    and not exists (
      select 1
      from public.lesson l
      where l.module_id = tm.id
      and l.content_type = 'video'
      and coalesce(l.content, '') !~* placeholder_pattern
    )
  ) then
    raise exception 'Curated training video migration left a module without a curated video lesson.';
  end if;
end $$;

commit;
