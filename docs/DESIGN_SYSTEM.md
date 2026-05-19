# LitmusAI Design System

LitmusAI should feel credible, focused, and encouraging: a product that helps working teams become AI-literate without turning training into theater. The brand is practical first, with enough polish and motion to make the learning path feel modern and motivating.

## Brand Personality

- Clear: users should immediately understand what to do next.
- Credible: assessments, learning paths, and credentials should feel measurable and trustworthy.
- Guided: the product should reduce uncertainty by showing the next step.
- Modern: glass, gradients, and motion can add energy, but content and conversion stay in control.
- Work-ready: copy should speak to workplace confidence, proof, progress, and practical AI skills.

## Color Roles

Use the Tailwind `brand` tokens as the source of truth.

- `brand-ink` (`#08111F`): strongest page text, dark surfaces, footer backgrounds.
- `brand-navy` (`#0B1220`): immersive hero and dark storytelling sections.
- `brand-panel` (`#101B2D`): elevated dark panels and product previews.
- `brand-mist` (`#F6FAFF`): page background and soft section fields.
- `brand-line` (`#DDE7F3`): default borders and dividers.
- `brand-violet` (`#6B4EFF`): primary action, active navigation, progress emphasis.
- `brand-cyan` (`#00D2FF`): secondary accent, highlights, interactive glow.
- `brand-emerald` (`#10B981`): success, lift, readiness gains, completion.
- `brand-orange` (`#F97316`): warm attention, warnings, or a single supporting accent.

Avoid building whole sections from one hue family. Pair violet and cyan with navy, white, slate, emerald, or orange so the interface feels like a product system rather than a single gradient.

## Typography

- Use `Roboto` for body text and controls.
- Use `Poppins` for headings and brand lockups.
- Keep hero headings large and tight, but use smaller headings inside panels, cards, dashboards, and navigation.
- Use normal letter spacing for most text. Uppercase eyebrow labels may use wide tracking.
- Prefer direct, conversion-oriented copy: "Build AI literacy you can prove at work" is stronger than abstract template language.

## Spacing And Layout

- Use `section-shell` for landing-page section width and horizontal padding.
- Standard vertical section rhythm: `py-20` for light sections and `py-24` for immersive dark sections.
- Cards should use `rounded-brand` or `rounded-brand-lg`; avoid overly bubbly shapes.
- Do not nest decorative cards inside other cards. If a panel contains repeated items, keep the parent visually quiet.
- Mobile layouts should collapse to one column early, with clear section headings before dense content.

## Components

### Navbar

- The public navbar is a normal top header that scrolls with the page.
- Keep one clean glass surface, compact brand lockup, text navigation, and one primary CTA.
- Active links use a subtle filled pill, not animated flips or oversized segmented containers.
- Mobile navigation opens as a glass dropdown below the top header and reuses the same destinations.

### Buttons

- `btn-primary`: primary conversion actions. Use for assessment starts, upgrade paths, and major next steps.
- `btn-secondary`: quiet filled secondary actions on light surfaces.
- `btn-outline`: dark or image surfaces where a bordered action needs to remain legible.
- `btn-ghost`: low-emphasis navigation or contextual actions.

### Cards And Panels

- `card`: default white elevated content card.
- `glass-panel`: immersive dark or hero surfaces with translucent borders and blur.
- `soft-panel`: light product storytelling surfaces.
- Use icons to speed scanning, but each icon should reinforce the label.

### Badges

- Use `eyebrow` for section identifiers.
- Badges should name useful user context: "Free AI Readiness Benchmark", "AI literacy plan", "Certification-ready".
- Avoid repeating the platform name in badges when the brand is already visible in the navbar.

## Motion Rules

- Motion should clarify progress, sequence, or state. Good uses include scroll reveals, progress-line growth, card lift, readiness bars, and small metric changes.
- Respect reduced-motion preferences using Framer Motion's `useReducedMotion`.
- Use quick, smooth timing: 180-250ms for hover states, 600-900ms for scroll reveals, up to 1200ms for progress paths.
- Avoid motion that changes layout after content is readable.

## Landing Page Usage

- Hero must communicate the offer in the first viewport: assessment, personalized path, training, and certification.
- The first body section should make the product outcome tangible, not repeat the hero.
- The journey section should show a guided path from benchmark to practice to credential.
- Testimonials and proof points should connect to measurable AI literacy, team confidence, and workplace use.
- The footer should be a semantic navigation area with grouped links and a bottom legal row. Do not add fake newsletter or contact forms without a working destination.
