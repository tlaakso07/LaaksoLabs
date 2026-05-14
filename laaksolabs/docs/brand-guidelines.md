# Brand Guidelines v1.0
## Laakso Labs Command Center

> "Laakso" — Finnish for valley, built around the root *lock*: trust, security, locking in results. Lab: innovation, cutting-edge AI. We are the future of high-ticket AI services.

---

## Quick Reference
- **Primary Accent:** #B42020 (deep maroon)
- **Dark Background:** #080808
- **Light Background:** #F5F5F5
- **Primary Font:** Geist Sans
- **Mono Font:** Geist Mono
- **Voice:** Precise. Confident. Inevitable.

---

## 1. Color Palette

### Brand Accent
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Maroon | #B42020 | rgb(180, 32, 32) | Primary accent — CTAs, progress bars, active nav, KPI highlights (dark mode) |
| Deep Maroon | #8B1515 | rgb(139, 21, 21) | Primary accent — CTAs, progress bars, active nav, KPI highlights (light mode) |

### Dark Mode Surfaces
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Void | #080808 | rgb(8, 8, 8) | Page background |
| Surface 1 | #141414 | rgb(20, 20, 20) | Cards, panels |
| Surface 2 | #1E1E1E | rgb(30, 30, 30) | Elevated surfaces, tooltips |
| Surface 3 | #282828 | rgb(40, 40, 40) | Hover states |

### Light Mode Surfaces
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Frost | #F5F5F5 | rgb(245, 245, 245) | Page background |
| White | #FFFFFF | rgb(255, 255, 255) | Cards, panels |
| Off-White | #F5F5F5 | rgb(245, 245, 245) | Elevated surfaces |
| Subtle | #EBEBEB | rgb(235, 235, 235) | Hover states |

### Text
| Name | Hex | Usage |
|------|-----|-------|
| Warm White | #F4F0EC | Primary text (dark mode) |
| Near-Black | #0A0A0A | Primary text (light mode) |
| Muted Dark | #8A8884 | Secondary text (dark mode) |
| Muted Light | #6A6A6A | Secondary text (light mode) |
| Faint Dark | #444440 | Placeholder, disabled (dark mode) |
| Faint Light | #AAAAAA | Placeholder, disabled (light mode) |

### Division Colors
| Division | Name | Hex (Dark) | Hex (Light) | Usage |
|----------|------|-----------|-------------|-------|
| Div 1 — Marketing | Steel Blue | #5A8EC6 | #4A7EB5 | AI Design & Marketing division |
| Div 2 — Consulting | Muted Violet | #8A78B4 | #7A6AA5 | AI Consulting & SEO division |
| Div 3 — Fund | Warm Bronze | #C4A06A | #B08C52 | The Fund (equity) division |

### Status Colors
| Status | Hex | Usage |
|--------|-----|-------|
| Active | #6B9E82 | Active client, live status |
| Urgent | #C05A52 | Urgent tasks, overdue |
| High | #BA7A45 | High priority |
| Medium | #9B8B5A | Medium priority |
| Low | #5E5E5A | Low priority |
| Paused | #C05A52 | Paused engagements |
| Prospect | #7A96B5 | Leads, prospects |

### Borders & Shadows
| Name | Dark | Light |
|------|------|-------|
| Border Default | #2A2A2A | #E4E4E4 |
| Border Subtle | #1E1E1E | #EEEEEE |
| Border Strong | #3A3A3A | #CACACA |
| Shadow Card | `0 1px 3px rgba(0,0,0,0.55), 0 4px 20px rgba(0,0,0,0.3)` | `0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)` |

---

## 2. Typography

### Font Stack
```css
--font-heading: 'Geist', system-ui, sans-serif;
--font-body: 'Geist', system-ui, sans-serif;
--font-mono: 'Geist Mono', monospace;
```

### Type Scale
| Element | Font | Weight | Size | Letter Spacing | Usage |
|---------|------|--------|------|----------------|-------|
| KPI Hero | Geist Mono | 700 | 44px | -0.03em | Dashboard hero numbers |
| H1 | Geist | 600 | 24px | -0.02em | Page titles |
| H2 | Geist | 600 | 18px | -0.015em | Section headers |
| H3 | Geist | 600 | 14px | -0.01em | Card titles |
| Body | Geist | 400 | 13px | -0.005em | Default body text |
| Small | Geist | 400 | 12px | 0 | Supporting text |
| Caption | Geist | 500 | 10px | 0.08em (uppercase) | Labels, badges |
| Mono | Geist Mono | 400–600 | 11–13px | -0.02em | Numbers, data, code |

### Label Style
All section labels use 10px, 500 weight, 0.08em letter-spacing, uppercase.

### Numeric Data
All financial figures, percentages, and counts use Geist Mono with tabular-nums for perfect alignment.

---

## 3. Logo & Mark

### Concept
The Laakso Labs mark is a **Zap/bolt** — representing speed, electrical energy, and instant AI-powered results. The bolt is contained, precise, and confident. It sits in a rounded-square container, dark on dark or light on dark.

### Variants
- **Icon:** Zap bolt in 32×32px rounded-square container
- **Wordmark:** "Laakso Labs" in Geist 600, paired with the icon
- **Submark:** "Command Center" in 10px uppercase, 0.08em tracking, muted
- **Monochrome:** All white (on dark) or all black (on light)

### Specifications
- Icon container: 32×32px, 9px border-radius
- Zap size: 13px, strokeWidth 2
- Accent color: `--sidebar-accent` (maroon on dark sidebar)
- Minimum digital size: 24px width

### Don'ts
- Never use the generic Vercel/Next.js logo
- Never use gradients on the mark
- Never change the accent color to anything outside the brand palette
- Never place on a busy or patterned background
- Never use the icon without sufficient clear space (min 8px all sides)

---

## 4. Voice & Tone

### Brand Essence
Laakso Labs is a high-ticket AI services firm. We don't pitch — we close. We don't experiment — we deploy. We are the future, and the dashboard reflects that certainty.

### Brand Personality
**Precise:** Every word, number, and label has purpose. No filler.
**Confident:** We state, don't qualify. We close, don't pitch.
**Inevitable:** The future is AI-powered. We're already there.

### Voice Chart
| Trait | We Are | We Are Not |
|-------|--------|------------|
| Precise | "43% close rate. CAC dropped to 19%." | "We help clients achieve great results." |
| Confident | "Your campaigns are live. Here's the data." | "We hope this might work for your business." |
| Inevitable | "AI isn't coming — it's here. We deploy it." | "We're exploring AI possibilities with clients." |
| Premium | "High-ticket work. High-trust relationships." | "Affordable AI for everyone." |

### Tone by Context
| Context | Tone | Example |
|---------|------|---------|
| Dashboard KPIs | Direct, numerical | "$47,200 MRR — 23.6% to target" |
| Task labels | Active, brief | "Set retainer price with Dom" |
| Empty states | Calm, directive | "No revenue recorded yet. Mark invoices as paid to start tracking." |
| Error messages | Clear, solution-focused | "Could not load client data. Check your connection." |
| Status updates | Factual | "Active · $7,500/mo · 3 tasks open" |

### Prohibited Terms
- "Seamless" — overused SaaS filler
- "Leverage" — corporate jargon
- "Game-changer" — empty hype
- "Synergy" — meaningless
- "Unleash" — AI slop copywriting
- "Cutting-edge" in customer-facing copy — show it, don't say it

---

## 5. UI Component Standards

### Cards
- Background: `var(--surface-1)`
- Border: `1px solid var(--border)`
- Border-radius: `var(--radius-lg)` (14px)
- Shadow: `var(--shadow-card)`
- Hover: `border-color: var(--border-strong)`
- No colored top borders. No gradients. No shadows with color tints.

### Badges — Division
- Font: 10px, 600 weight, 0.04em tracking, uppercase
- Padding: 2px 6px
- Border-radius: 6px
- Color + border + background all derived from division color via `color-mix`

### Badges — Status
- Same structure as division badges
- Uses functional status colors
- Status dot: 7px circle, pulse animation for "active"

### Priority Chips
- Inline flex, 10px, 500 weight
- Background tint: 10-12% opacity of status color
- Text: full status color

### Progress Bars
- Height: 3px (sidebar) or 4px (KPI strip)
- Background track: muted surface
- Fill: `var(--accent)` (maroon)
- Border-radius: 2px

### Navigation — Active State
- `background: var(--sidebar-active)`
- `border-left: 2px solid var(--sidebar-accent)`
- Icon: `var(--sidebar-accent)` color
- Font weight: 500

---

## 6. Imagery & Icons

### Icon Library
Lucide React — consistent strokeWidth of 1.5 (inactive) or 2 (active/emphasis).

### Icon Sizes
- Navigation: 14px
- KPI cards: 16-18px
- Empty states: 17px
- Inline labels: 12-14px

### Photography / Illustration
Not currently in use. If added:
- Dark, cinematic quality
- No stock-photo aesthetics
- Minimal, purposeful

---

## 7. Motion & Animation

### Principles
- Ease: `cubic-bezier(0.16, 1, 0.3, 1)` — fast start, elegant settle
- Duration: 120ms (micro), 300ms (transitions), 1200ms (progress bars on load)
- Animate only `transform` and `opacity` — never layout properties

### Named Animations
```css
fade-up: opacity 0→1, translateY 8px→0, 450ms
fade-in: opacity 0→1, 300ms
pulse-gentle: scale 1→0.8→1, opacity 1→0.5→1, 2-2.5s infinite (status dots)
```

### Stagger Delays
Cascade cards/rows with 55ms increments (delay-0 through delay-8).

---

## 8. Grid & Spacing

### Layout Grid
- Max width: 1600px
- Page padding: 28px 32px
- Main layout: two-column, `1fr 380px`
- Card gap: 16px

### Spacing Scale (Tailwind)
All spacing follows the 4px base grid. Common values: 4, 8, 12, 16, 20, 24, 32px.

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Badges, chips |
| `--radius` | 10px | Tooltips, small cards |
| `--radius-lg` | 14px | Cards, panels |
| `--radius-xl` | 18px | Large containers |

---

## 9. Brand Values

**Lock + Lab = Laakso Labs**
- Lock: Trust, security, commitment, locking in results. Clients don't guess — they know.
- Lab: Experimentation, speed, precision, cutting-edge AI systems.

**Three Divisions, One Standard**
Every engagement — Marketing, Consulting, or Fund — delivers at the highest level. The brand reflects that consistency.

**The $200K MRR Target**
Revenue transparency is intentional. The dashboard shows the gap, always. We are accountable to the number.

**Trevor's Edge**
$12.9M net revenue in home services. 43% close rates. CAC from 140% to 19%. The dashboard is built for this operator mindset — fast, visual, no friction.
