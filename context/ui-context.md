# UI Context

## Theme

The Gramflow design system is **Dark Mode Only** (no light mode support). It is styled as a **technical developer-workspace** that combines deep space backgrounds, clean translucent glass borders, layered structural cards, and high-energy neon color accents. This aesthetic is optimized for maximum readability, premium feel, and dynamic engagement tracking.

- **Theme Identity**: Technical Neon-Dark (Glassmorphism & glowing highlights)
- **Contrast Ratios**: Strictly adhering to WCAG AA standards for primary texts and neon interactive components.
- **Visual Micro-elements**: Sleek radial gradients, glowing action triggers, and semi-transparent panels using `backdrop-blur-xl`.

---

## Colors

All colors are defined as CSS Custom Properties. Components must reference these custom properties or their Tailwind configuration aliases rather than hardcoding hex values.

| Semantic Role | CSS Variable | Hex Value | OKLCH Value | Visual Representation / Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Page Base** | `--bg-base` | `#09090b` | `oklch(0.141 0.005 285.82)` | Primary page canvas, deep space charcoal background. |
| **Primary Surface** | `--bg-surface` | `#121214` | `oklch(0.210 0.006 285.88)` | Primary sidebars, fixed layouts, background panels. |
| **Elevated Surface** | `--bg-surface-elevated` | `#1a1a1e` | `oklch(0.274 0.006 286.03)` | Floating cards, modal frames, dropdown selections. |
| **Elevated Surface Hover** | `--bg-surface-elevated-hover` | `#222226` | `oklch(0.320 0.006 286.03)` | Highlight states on floating elements and lists. |
| **Primary Text** | `--text-primary` | `#fafafa` | `oklch(0.980 0.000 0.00)` | Primary content text, headers, active button labels. |
| **Secondary Text** | `--text-secondary` | `#c2c2c9` | `oklch(0.810 0.005 286.00)` | Subheaders, primary descriptions, field labels. |
| **Muted Text** | `--text-muted` | `#9f9fa9` | `oklch(0.705 0.015 286.07)` | Minor metadata, helper guides, deactivated icons. |
| **Disabled Text** | `--text-disabled` | `#52525b` | `oklch(0.420 0.005 286.00)` | Inactive states, disabled input placeholder text. |
| **Primary Accent** | `--accent-primary` | `#7f22fe` | `oklch(0.541 0.281 293.01)` | **Electric Purple**: Triggers, primary CTAs, active paths. |
| **Primary Accent Hover** | `--accent-primary-hover` | `#9647ff` | `oklch(0.610 0.260 293.00)` | High-intensity purple variant for interactive hover. |
| **Secondary Accent** | `--accent-secondary` | `#14b8a6` | `oklch(0.696 0.170 162.48)` | **Neon Emerald-Teal**: Success status, active counts, metrics. |
| **Secondary Accent Hover**| `--accent-secondary-hover`| `#2dd4bf` | `oklch(0.780 0.160 162.00)` | Highlight teal variant for hover events. |
| **AI/Condition Accent** | `--accent-ai` | `#d946ef` | `oklch(0.627 0.265 303.90)` | **Neon Orchid**: Flow condition branches, automation splits. |
| **AI/Condition Hover** | `--accent-ai-hover` | `#e879f9` | `oklch(0.710 0.220 304.00)` | Orchid hover feedback variant. |
| **Warning/Cap Accent** | `--accent-warning` | `#eab308` | `oklch(0.769 0.188 70.08)` | **Cyber Amber**: System warnings, close-to-limit warnings. |
| **State Error** | `--state-error` | `#ff6467` | `oklch(0.650 0.200 15.00)` | **Crimson Coral**: Failed runs, errors, account disconnected. |
| **State Error Hover** | `--state-error-hover` | `#ff8587` | `oklch(0.720 0.180 15.00)` | Bright error hover feedback. |
| **Default Border** | `--border-default` | `rgba(255,255,255,0.08)`| `oklch(1.000 0.000 0.00 / 0.08)`| Subtle structural boundaries, cards and panels divisions. |
| **Hover Border** | `--border-hover` | `rgba(255,255,255,0.15)`| `oklch(1.000 0.000 0.00 / 0.15)`| Active component outline triggers on mouse-over. |
| **Focus Border** | `--border-focus` | `rgba(127,34,254,0.40)`| `oklch(0.541 0.281 293.01 / 0.4)`| High focus visual indicator for active text fields. |

---

## Typography

Typography relies on clean, high-legibility geometric sans-serif fonts matching modern technical workspaces.

| Typographic Role | Target Font Family | Variable | Standard Font Weight / Style |
| :--- | :--- | :--- | :--- |
| **UI Copy & Headings** | **Geist Sans** (fallback: Inter) | `--font-sans` | `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700) |
| **Code & Keywords** | **Geist Mono** (fallback: Fira Code) | `--font-mono` | `font-normal` (400), `font-medium` (500) for variables & logs |

### Font Sizes & Hierarchy

- **Main Dashboard Header**: `text-2xl` (`1.5rem` / `24px`), `font-semibold`, tracking `tracking-tight`
- **Section/Card Headers**: `text-base` (`1rem` / `16px`), `font-semibold`
- **Body UI Text**: `text-sm` (`0.875rem` / `14px`), `font-normal` or `font-medium`
- **Subtext/Labels/Metadata**: `text-xs` (`0.75rem` / `12px`), `font-normal` or `font-medium`
- **Micro-labels / Mini-stats**: `text-[10px]` or `text-[11px]`, `font-semibold`

---

## Border Radius

A consistent border-radius hierarchy establishes visual organization and separates layout shells from interactive tokens.

| Visual Context | Tailwind Radius Utility Class | Absolute Value | Usage Example |
| :--- | :--- | :--- | :--- |
| **Inline Elements** | `rounded-lg` | `8px` (`0.5rem`) | Action buttons, text input fields, icon slots. |
| **Structural Cards & Panels** | `rounded-2xl` | `16px` (`1rem`) | Metrics cards, flow-builder canvas boxes, pricing frames. |
| **Layout Overlays & Modals** | `rounded-3xl` | `24px` (`1.5rem`) | Centered modal screens, slide-over panels, outer shells. |
| **System Indicators & Badges** | `rounded-full` | `9999px` | User profile avatar pictures, numeric notifications. |

---

## Component Library

The application's interface uses custom integrations on top of **shadcn/ui** primitives styled using Tailwind CSS classes.

- **Storage Location**: Raw primitives live under `frontend/src/components/ui/` (controlled by the shadcn CLI). These files must never be edited directly.
- **Custom Wrapper Style**: App-level components wrapping the primitives should implement the semantic color system and border-radius tokens.
- **Charting Styling**: Recharts panels must reference CSS variables (e.g., `--accent-primary` and `--accent-secondary`) to match the color themes programmatically:
  ```typescript
  config={{
    dms: { color: "var(--accent-primary)", label: "DMs" },
    leads: { color: "var(--accent-secondary)", label: "Leads" }
  }}
  ```

---

## Layout Patterns

To present a coherent visual hierarchy, the interface must follow these key viewport grids:

- **Dashboard Layout Grid**:
  - Full-viewport (`h-screen`, `w-screen`) layout.
  - Left navigation sidebar: fixed width (`w-72`), border-right partition (`border-r border-white/10`).
  - Right content workspace: scrollable flex (`flex-1 overflow-y-auto bg-zinc-950`).
- **Card Layout & Glassmorphism**:
  - Main cards are styled with translucent backgrounds: `bg-[linear-gradient(160deg,var(--bg-surface-elevated),rgba(26,26,30,0.6))] backdrop-blur-xl`.
  - Border thickness: `border border-white/10`.
- **Campaign Visual Flow Builder**:
  - Interactive trigger-action canvas uses a dot-grid radial gradient backdrop: `bg-[radial-gradient(circle_at_center,var(--border-default)_1px,transparent_1px)] bg-[size:16px_16px]`.
  - Connecting lines use gradient bars: `bg-[linear-gradient(90deg,var(--accent-primary),var(--accent-secondary))]`.
  - Nodes have active neon shadows: `shadow-[0_0_20px_var(--accent-primary-glow)]`.

---

## Icons

We use **Lucide React** for unified, stroke-based indicator icons.

- **Stroke-width**: Standardized to `strokeWidth={2}`.
- **Icon Sizing Guidelines**:
  - Inline metadata icons: `h-3.5 w-3.5` or `h-4 w-4` with `--text-muted` coloring.
  - Sidebar and Button icons: `h-4 w-4` or `h-5 w-5` aligned with corresponding labels.
  - Grid category/card main indicators: `h-5 w-5` or `h-6 w-6` inside elevated circular badge wrappers (`bg-[#7f22fe]/20`).
