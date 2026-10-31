# Exam Preparation OS — Visual Design System

This document is the single source of truth for the Exam Preparation OS visual design. All components, pages, and integrations must consume these tokens.

## Brand Personality
*   **Confident:** The Royal Blue on Soft White palette communicates authority, focus, and clarity.
*   **Clean:** Predominantly neutral surfaces (Soft White / White) with restrained Royal Blue accents.
*   **Premium:** Generous whitespace, deep slate typography, and subtle elevation instead of heavy borders.
*   **Intelligent:** Interactions feel responsive and deliberate. Royal Blue signals interactivity and progress.
*   **Focused:** Interfaces prioritize content. Extraneous decorative elements are removed.
*   **Academic (Modern):** Trustworthy, calm, and structured without feeling dated or like a generic SaaS.

## Avoid
*   **NO GRADIENTS:** No blue gradients, purple AI gradients, or background meshes. Use solid tonal colors.
*   **NO DECORATIVE EFFECTS:** No glassmorphism, 3D blobs, neon glows, or glowing cards.
*   **NO INVERTED DARK MODE:** Dark mode must be a deliberate Deep Slate / Navy, not pure black inversion.
*   **NO RAINBOW DASHBOARDS:** Keep data visualization and badges semantic and restrained.

---

## Final Color Palette

### 1. Brand Tokens (OKLCH)
The interface is built entirely around these official colors and their accessible variants:

*   **Royal Blue (Primary Brand)**
    *   HEX: `#4A78E0` (Exact Brand)
    *   OKLCH: `oklch(0.594 0.166 264.1)`
    *   Usage: Primary accents, progress bars, active states, selected tabs.
    *   *Note on Buttons:* Because `#4A78E0` on White provides 4.16:1 contrast (slightly below AA 4.5:1 for normal text), buttons use a specifically derived darker Royal Blue (`#416CCF`) for background to guarantee compliance, while `--primary` remains the exact brand color.

*   **Soft White (Primary Background)**
    *   HEX: `#F4F6FA`
    *   OKLCH: `oklch(0.973 0.006 264.5)`
    *   Usage: Dominant application background.

*   **Steel Gray (Secondary / Metadata)**
    *   HEX: `#5A6473`
    *   OKLCH: `oklch(0.500 0.027 258.4)`
    *   Usage: Secondary text, metadata, descriptions, inactive icons. (5.54:1 contrast on Soft White).

*   **Deep Slate (Primary Text)**
    *   HEX: `#1E293B`
    *   OKLCH: `oklch(0.279 0.037 260.0)`
    *   Usage: Main headings, primary body text, important numerical values. (13.52:1 AAA contrast on Soft White).

### 2. Semantic Colors
Do not redefine these as alternative brand colors.
*   **Success (Restrained Green):** `oklch(0.65 0.12 150)`
*   **Warning (Vibrant Red):** `oklch(0.60 0.22 20)`
*   **Destructive (Crimson Red):** `oklch(0.55 0.20 15)`

*   `--surface-hover`: `oklch(0.24 0.02 270)`
*   `--foreground`: `oklch(0.95 0.01 107)` — Warm off-white
*   `--foreground-muted`: `oklch(0.68 0.01 270)` — Soft slate
*   `--border`: `oklch(0.30 0.02 270)` — Dark slate
*   `--primary`: `oklch(0.65 0.18 266)` — Accessible lighter cobalt
*   `--primary-foreground`: `oklch(0.15 0.02 270)` — Dark charcoal
*   `--secondary`: `oklch(0.28 0.02 270)`
*   `--secondary-foreground`: `oklch(0.95 0.01 107)`
*   `--accent`: `oklch(0.28 0.04 266)` — Dark cobalt tint
*   `--accent-foreground`: `oklch(0.80 0.12 266)` — Light cobalt
*   `--success`: `oklch(0.62 0.08 145)`
*   `--success-foreground`: `oklch(0.15 0 0)`
*   `--warning`: `oklch(0.72 0.12 75)`
*   `--warning-foreground`: `oklch(0.15 0 0)`
*   `--destructive`: `oklch(0.58 0.14 25)`
*   `--destructive-foreground`: `oklch(0.15 0 0)`
*   `--info`: `oklch(0.68 0.08 250)`

### WCAG Contrast Validation
| Combination | Ratio | Grade |
|---|---|---|
| Cobalt on Cream | 7.04:1 | ✅ AAA |
| White on Cobalt (buttons) | 8.21:1 | ✅ AAA |
| Dark text on Cream | 14.62:1 | ✅ AAA |
| Muted text on Cream | 4.48:1 | ✅ AA |
| Success on Cream | 4.44:1 | ✅ AA |
| Warning on Cream | 4.18:1 | ✅ AA |
| Destructive on Cream | 5.02:1 | ✅ AA |
| Light Cobalt on Dark bg | 6.21:1 | ✅ AA |
| Off-white on Dark bg | 14.89:1 | ✅ AAA |
| Muted slate on Dark bg | 5.43:1 | ✅ AA |

## Typography
Use Inter (or system-ui if unavailable) for a clean, legible academic look.
*   **Display:** `-tracking-[0.02em] font-semibold text-4xl`
*   **Heading:** `-tracking-[0.01em] font-medium text-2xl`
*   **Subheading:** `font-medium text-lg`
*   **Body:** `font-normal text-base leading-relaxed`
*   **Label:** `font-medium text-sm text-foreground-muted uppercase tracking-wider`
*   **Caption:** `font-normal text-xs text-foreground-muted`
*   **Numeric:** `tabular-nums font-medium`

## Spacing
Standard Tailwind spacing scale with emphasis on macro-whitespace:
*   Use `p-8` for major sections.
*   Use `gap-6` between major cards.
*   Use `gap-2` for tight UI elements.

## Radius
Controlled rounding. Do not use maximum pill shapes for structural elements.
*   **Cards/Surfaces:** `rounded-lg` (`0.5rem`)
*   **Buttons:** `rounded-md` (`0.375rem`)
*   **Inputs:** `rounded-md` (`0.375rem`)
*   **Inner Elements:** `rounded-sm` (`0.125rem`)

## Shadows
Subtle elevation to establish hierarchy without visual noise.
*   **Default (Surface):** `shadow-sm` (Border does most of the work)
*   **Elevated (Dropdowns/Modals):** `shadow-lg` (Soft, diffused OKLCH shadow)
*   **Hover (Cards):** Transition to `shadow-md`

## Motion System
Animations must be purposeful, using `motion` (fka framer-motion) as the exclusive and default animation library. Do not install GSAP, Anime.js, React Spring, Lenis, or Three.js at this stage.

*   **Duration:** Fast (`150ms` - `200ms`) for micro-interactions; Medium (`300ms`) for layout changes.
*   **Easing:** `easeOut` (`[0, 0, 0.2, 1]`) for entrances, `easeIn` (`[0.4, 0, 1, 1]`) for exits, `easeInOut` (`[0.4, 0, 0.2, 1]`) for layout transitions.
*   **Entrance Transitions:** Fade in + slide up (opacity 0->1, y 10->0).
*   **Exit Transitions:** Fade out + scale down (opacity 1->0, scale 1->0.95).
*   **Hover Transitions:** Slight scale up (1.02) or background color shift.
*   **Reduced Motion:** All motion components must respect `prefers-reduced-motion: reduce` by snapping to the final state or fading instead of sliding.

## Design Skill Priority
When multiple design skills give recommendations, use this priority:
1. Product usability
2. Accessibility
3. Existing `DESIGN.md`
4. UI/UX Pro Max
5. Impeccable
6. taste / redesign guidance
7. Recent.design skills
8. Individual UI component libraries (Libraries like Aceternity/Skiper must NOT override the product design system).

## Design Review Workflow
For every major UI screen, use this workflow:
RESEARCH -> DESIGN -> IMPLEMENT -> UI/UX PRO MAX REVIEW -> IMPECCABLE CRITIQUE -> TASTE / REDESIGN REVIEW -> ACCESSIBILITY REVIEW -> RESPONSIVE REVIEW -> POLISH -> FINAL IMPLEMENTATION.

## Component Rules
1.  All components must use `var(--color)` values for theming.
2.  Aceternity/Skiper UI components must have their hardcoded colors replaced with semantic design tokens.
3.  Drag and Drop (dnd-kit) must include keyboard sensors and ARIA live regions for accessibility.
