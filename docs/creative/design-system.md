# Assessment Form Design System

## Tokens

- Surface: `#F6FAFF`, `#FFFFFF`, ink text, slate borders.
- Accent: LitmusAI violet and cyan for active progress and selected controls.
- Radius: smaller inside the assessment tool than marketing cards; large enough to match the existing app.
- Spacing: compact mobile padding, wider desktop grid gap, stable sticky action spacing.
- Shadow: low-elevation panels; no stacked card-in-card look.
- Motion: 180-360ms, `power2.out`/CSS ease-out, disabled for reduced motion.

## Components

- Intro panel: compact calibration card with signal chips and sticky footer.
- Level selector: segmented choice cards with `aria-pressed`, clear active state, and preserved test IDs.
- Progress rail: desktop side context plus mobile strip.
- Question panel: single semantic form-like region with domain badge, heading, answers, and action.
- Answer option: label-wrapped radio, visible focus, selected state, stable dimensions.
- Action bar: inline on desktop, sticky at the bottom on mobile.

## Usage Rules

- Preserve `data-testid` values used by existing tests.
- Use real buttons for actions and radio inputs for answer choices.
- Keep essential information visible without hover.
- Respect `prefers-reduced-motion`.
