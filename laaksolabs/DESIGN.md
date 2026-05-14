# Laakso Labs — Design System

> This reflects the **implemented** design system in `src/app/globals.css`. The original Starbucks-green concept was superseded by the maroon/charcoal direction decided during Phase 1.

## Reference Brands

### Apple (Dark Mode Precision)
- macOS Sonoma dark mode surfaces: warm near-black layering, not cold blue-gray
- Radius 10–14px on major containers
- Apple SF Pro weight contrast: tight tracking on headlines, spacious on labels
- Status indicators: small pulsing dots, not badges

### Premium Neutral (actual direction)
- Near-black backgrounds with warm undertone — not cold midnight blue
- Single deep maroon accent — one color owns all interactive moments
- Muted division colors (charcoal, violet) — informational only, never decorative
- Warm cream text — never cold white

## Color System (Implemented)

| Token | Dark Value | Light Value | Usage |
|---|---|---|---|
| `--bg` | `#080808` | `#F5F5F5` | Page background |
| `--surface-1` | `#141414` | `#FFFFFF` | Cards, panels |
| `--surface-2` | `#1E1E1E` | `#F5F5F5` | Hover states, nested |
| `--surface-3` | `#282828` | `#EBEBEB` | Chips, tags |
| `--border` | `#2A2A2A` | `#E4E4E4` | Default border |
| `--border-subtle` | `#1E1E1E` | `#EEEEEE` | Separators |
| `--border-strong` | `#3A3A3A` | `#CACACA` | Hover border |
| `--text` | `#F4F0EC` | `#0A0A0A` | Body text — warm cream |
| `--text-muted` | `#8A8884` | `#6A6A6A` | Secondary text |
| `--text-faint` | `#444440` | `#AAAAAA` | Tertiary / placeholder |
| `--accent` | `#B42020` | `#8B1515` | Maroon — buttons, active states, KPI highlights |
| `--accent-dim` | `rgba(180,32,32,0.14)` | `rgba(139,21,21,0.09)` | Accent tint for badges |
| `--sidebar-bg` | `#0A0A0A` | `#FFFFFF` | Sidebar background |
| `--sidebar-accent` | `#B42020` | `#8B1515` | Sidebar icons, nav active |

### Functional Colors

| Token | Dark Value | Usage |
|---|---|---|
| `--active` | `#6B9E82` | Active status — muted sage |
| `--urgent` | `#C05A52` | Urgent priority, overdue |
| `--high` | `#BA7A45` | High priority — warm amber |
| `--medium` | `#9B8B5A` | Medium priority — warm tan |
| `--low` | `#5E5E5A` | Low priority — gray |
| `--onboard` | `#9B8B5A` | Onboarding status |
| `--paused` | `#C05A52` | Paused / churned |
| `--prospect` | `#7A96B5` | Prospect / lead |

### Division Colors

| Division | Token | Value | Usage |
|---|---|---|---|
| Div 1 (Marketing) | `--div1` | `#6C6C70` | Moody charcoal |
| Div 2 (Consulting) | `--div2` | `#8A78B4` | Muted violet |
| Div 3 (The Fund) | `--div3` | `#6C6C70` | Moody charcoal (same as Div 1) |

## Typography

**Stack**: Geist Sans + Geist Mono

| Role | Size | Weight | Tracking | Font |
|---|---|---|---|---|
| Section label (`.label`) | 10px | 500 | 0.08em UPPERCASE | Geist Sans |
| Body | 13px | 400 | -0.005em | Geist Sans |
| Data number (`.num`) | varies | 600 | -0.02em tabular | Geist Mono |
| Card title | 13px | 600 | -0.01em | Geist Sans |
| Page headline | 22px | 700 | -0.03em | Geist Sans |
| Micro label | 11px | 400 | 0.02em | Geist Sans |

## Spacing & Radius

| Token | Value |
|---|---|
| `--radius-sm` | `6px` — badges, chips, inputs |
| `--radius` | `10px` — buttons, small cards |
| `--radius-lg` | `14px` — cards, panels |
| `--radius-xl` | `18px` — modals |
| Page padding | `28px 32px` |
| Section gap | `24–28px` |
| Card padding | `20–24px` |

## Shadows

```css
--shadow-card:     0 1px 3px rgba(0,0,0,0.55), 0 4px 20px rgba(0,0,0,0.3);
--shadow-elevated: 0 2px 10px rgba(0,0,0,0.6), 0 20px 50px rgba(0,0,0,0.4);
```

## Reusable CSS Classes

| Class | Usage |
|---|---|
| `.card` | Surface container — bg surface-1, border, radius-lg, shadow-card |
| `.card-hover` | Adds bg: surface-2 on hover |
| `.label` | Section label — 10px, uppercase, muted |
| `.label-sidebar` | Same but on sidebar background |
| `.num` | Monospace tabular numbers |
| `.dot` | 7px status dot base |
| `.dot-active / .dot-paused / …` | Status-specific dot variants |
| `.div-badge.d1 / .d2 / .d3` | Division badge with matching color |
| `.priority-chip.urgent / .high / .medium / .low` | Priority badge with color |
| `.animate-in` | fade-up 0.45s on mount |
| `.animate-fade` | fade-in 0.3s on mount |
| `.delay-0` → `.delay-8` | Stagger delays (55ms increments) |

## Motion

- Micro-interactions: 100–150ms ease
- Page load stagger: 55ms increments, fade-up 8px (`animate-in`)
- Hover transitions: 100–120ms
- Optimistic UI: state updates immediately, no spinners

## Anti-patterns (Banned)

- Tailwind color classes (use CSS vars only — `var(--accent)`, never `bg-red-600`)
- Gradient text backgrounds
- Purple gradients / neon glows
- Glassmorphism (not used in this build)
- Cold blue-gray surfaces
- Emojis as icons (use Lucide icons only)
- Inter font
- Pure black or pure white
- Multiple accent colors competing for attention
