# Video Content Sources and Licensing

Reviewed: 2026-05-10

The canonical runtime catalog lives in `docs/course-content/curated-video-catalog.json`. Backend seeders and demo fallback data read from that file so local review, demo mode, and lesson content use the same curated source list.

## Curation Policy

- Use authoritative educational sources first: official product or organization channels, universities, major educational channels, then respected technical educators.
- Each video must match the module title plus at least two learning objectives.
- Prefer embeddable YouTube or Vimeo URLs. If a source cannot be embedded, keep a safe source link and attribution.
- Do not use generic sample videos, stock demo clips, or unrelated placeholder media.
- Keep one fallback candidate for each course video so replacements are quick if a source disappears.

## Current Catalog

| Module | Video | Creator | Source | Terms note | Fallback |
| --- | --- | --- | --- | --- | --- |
| `module-ai-fundamentals-intro` | AI, Machine Learning, Deep Learning and Generative AI Explained | IBM Technology | https://www.youtube.com/watch?v=qYNweeDHiyU | Embedded from YouTube for educational use; all rights remain with the creator. | https://www.youtube.com/watch?v=GvYYFloV0aA |
| `module-ai-sales` | 5 Ways Generative AI is Revolutionizing Sales Automation | IBM | https://www.youtube.com/watch?v=R8CepUwdZis | Embedded from YouTube for educational use; all rights remain with the creator. | https://www.youtube.com/watch?v=wJWTXk4HDS0 |
| `module-ethical-hr` | Algorithmic Bias in AI: What It Is and How to Fix It | IBM Technology | https://www.youtube.com/watch?v=og67qeTZPYs | Embedded from YouTube for educational use; all rights remain with the creator. | https://www.youtube.com/watch?v=yh-3WU1FKrk |
| `module-marketing-ai` | Putting AI to Work for Marketing | IBM Technology | https://www.youtube.com/watch?v=c54qSfmTT5U | Embedded from YouTube for educational use; all rights remain with the creator. | https://www.youtube.com/watch?v=kyTu3mgGfUA |
| `module-ops-ai` | Putting AI to work in IT Operations | IBM Technology | https://www.youtube.com/watch?v=4VCwKSaMOqY | Embedded from YouTube for educational use; all rights remain with the creator. | https://www.youtube.com/watch?v=hnFpPA9xEBo |
| `module-prompt-master` | AI prompt engineering: A deep dive | Anthropic | https://www.youtube.com/watch?v=T9aRN5JkmL8 | Embedded from YouTube for educational use; all rights remain with the creator. | https://www.youtube.com/watch?v=_ZvnD73m40o |
| `module-ai-fundamentals` demo fallback | AI, Machine Learning, Deep Learning and Generative AI Explained | IBM Technology | https://www.youtube.com/watch?v=qYNweeDHiyU | Embedded from YouTube for educational use; all rights remain with the creator. | https://www.youtube.com/watch?v=GvYYFloV0aA |
| `module-prompt-basics` demo fallback | Prompt Engineering Tutorial - Master ChatGPT and LLM Responses | freeCodeCamp.org | https://www.youtube.com/watch?v=_ZvnD73m40o | Embedded from YouTube for educational use; all rights remain with the creator. | https://www.youtube.com/watch?v=T9aRN5JkmL8 |
| `module-ethics-overview` demo fallback | What is Responsible AI? A Guide to AI Governance | IBM Technology | https://www.youtube.com/watch?v=yh-3WU1FKrk | Embedded from YouTube for educational use; all rights remain with the creator. | https://www.youtube.com/watch?v=w_3L1Bf2P_g |

## Required Metadata

Every catalog entry must include:

- `video_url`: embeddable YouTube/Vimeo URL when available.
- `video_title`: title shown in the lesson metadata strip.
- `creator` and `creator_url`: source attribution.
- `duration_minutes`: approximate learner-facing duration.
- `original_url`: the canonical source page.
- `license`: terms note for the embedded source.
- `attribution`: short learner-facing attribution.
- `curation_note`: why this video belongs in the module.
- `fallback_url`: replacement candidate.

## Maintenance

- Check links quarterly.
- Re-review content annually for accuracy and relevance.
- Replace videos immediately if a source becomes unavailable, blocks embedding, or no longer matches the module objectives.
- Run the seeded-content guard tests after any catalog change; they fail if placeholder video sources such as `media.w3.org`, `interactive-examples.mdn.mozilla.net`, `flower.mp4`, `bunny`, `sintel`, or `movie_300` return.
