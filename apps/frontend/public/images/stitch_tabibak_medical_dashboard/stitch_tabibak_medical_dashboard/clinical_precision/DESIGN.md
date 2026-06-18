---
name: Clinical Precision
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#3d4947'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#5c5f61'
  on-secondary: '#ffffff'
  secondary-container: '#e0e3e5'
  on-secondary-container: '#626567'
  tertiary: '#006387'
  on-tertiary: '#ffffff'
  tertiary-container: '#007da9'
  on-tertiary-container: '#fcfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#e0e3e5'
  secondary-fixed-dim: '#c4c7c9'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#444749'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#7bd0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.5'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  max-width: 1440px
---

## Brand & Style
The design system is engineered for a premium medical environment where clarity, speed of cognition, and trust are paramount. The brand personality is authoritative yet empathetic, balancing clinical rigor with a modern, approachable interface. 

The aesthetic is **Corporate Modern with subtle Glassmorphic accents**. It prioritizes high legibility and a reduced cognitive load through generous whitespace and a disciplined color application. The emotional response should be one of "calm efficiency"—a sanctuary for healthcare professionals to manage complex data without visual noise.

## Colors
The palette is rooted in a crisp medical blue-teal (#0D9488) that communicates stability and health. 

- **Primary:** Used for essential actions, active states, and branding elements.
- **Secondary Surface:** A cool, light gray (#F8FAFC) used for the main application background to reduce eye strain.
- **Slate Neutrals:** A range of slate tones (led by #1E293B) provides high-contrast typography and iconography.
- **Glassmorphic Tint:** A soft, translucent sky-blue used exclusively for "New" badges and non-critical highlights to add a layer of modern sophistication without distracting from primary data.

## Typography
Inter is the sole typeface, chosen for its exceptional legibility in data-dense environments and its neutral, professional tone. 

The type scale is strictly hierarchical. Headlines use a tighter letter-spacing and heavier weights to anchor sections. Body copy uses a generous line height (1.6) to ensure medical notes and patient histories are readable at a glance. Tabular data should utilize `body-md` for maximum information density while maintaining clarity.

## Layout & Spacing
The design system employs a **Fixed Grid** layout for desktop with a maximum width of 1440px, transitioning to a fluid layout for tablet and mobile devices.

- **Desktop (12 Columns):** 24px gutters, 40px side margins. Cards typically span 3, 4, 6, or 12 columns.
- **Tablet (8 Columns):** 16px gutters, 24px side margins.
- **Mobile (4 Columns):** 16px gutters, 16px side margins.

A strict 4px baseline grid governs all vertical spacing. Elements should be spaced in multiples of 8px (e.g., 16, 24, 32) to maintain a consistent rhythmic breathability throughout the dashboard.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Ambient Shadows**. 

The base layer is the Secondary Surface (#F8FAFC). Interactive cards and containers sit on an elevated white surface (#FFFFFF) with a soft, diffused shadow (0px 4px 20px rgba(30, 41, 59, 0.05)). 

For overlays and modals, a secondary elevation tier is used with a more pronounced shadow and a backdrop blur of 12px. This creates a clear focus on critical tasks (like prescription entry) while maintaining the context of the underlying dashboard.

## Shapes
The shape language is defined by "Soft Precision." Most UI containers, including patient cards and data modules, utilize a **0.5rem (8px)** base radius, while larger dashboard sections and main containers use **1rem (16px)**. 

Buttons follow the `rounded-lg` (16px) pattern to create a friendly, touch-accessible feel. Progress bars and status chips use fully rounded (pill-shaped) terminals to differentiate them from actionable containers.

## Components

- **Buttons:** Primary buttons use a solid Teal fill with white text. Secondary buttons use a Teal outline with a subtle hover state. Target sizes should never drop below 44px for touch-friendliness.
- **Cards:** The primary vehicle for information. Features a white background, 16px corner radius, and a subtle 1px border (#E2E8F0) to ensure definition against the light gray background.
- **Input Fields:** Large, clear targets with 12px padding and a 1px slate-200 border. Focus states use a 2px teal glow.
- **Status Chips:** Use a light tinted background of the status color (e.g., light green for 'Stable') with bold text.
- **Glass Badges:** For "New" or "Urgent" notifications, use a semi-transparent blue backdrop blur with a 1px white border to create a "jewel" effect.
- **Icons:** Use Lucide-style 2px stroke icons. Icons should be consistent in weight and strictly monochromatic (Slate-500) unless indicating a specific status.
- **Data Tables:** High density, removing vertical borders and using subtle horizontal dividers (#F1F5F9). The header row should be in `label-md` for clear categorization.