---
name: Focused Reader
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-sm:
    fontFamily: Literata
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Literata
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Literata
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Literata
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  ui-label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  ui-label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  ui-meta:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar_width: 240px
  list_width: 320px
  base_unit: 4px
  gutter: 16px
  margin-page: 24px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Figma References

- RSS Reader: https://www.figma.com/design/CxhsJ3wzbtQDOVOXamoen0/FluxFeed?node-id=1-2&t=uO9wP0uHf2sojhcL-4
- RSS Popup: https://www.figma.com/design/CxhsJ3wzbtQDOVOXamoen0/FluxFeed?node-id=1-188&t=uO9wP0uHf2sojhcL-4
- Settings: https://www.figma.com/design/CxhsJ3wzbtQDOVOXamoen0/FluxFeed?node-id=1-305&t=uO9wP0uHf2sojhcL-4

## Brand & Style
The design system is centered on **Functional Minimalism**. It prioritizes information density and legibility for a browser extension environment where horizontal space is at a premium. The goal is to evoke a sense of calm, intellectual focus, and order, transforming a chaotic web of information into a curated library.

The style leans into **Corporate Modern** aesthetics with a "Utility-First" mindset. It avoids decorative flourishes in favor of clear hierarchy, generous whitespace between content blocks, and subtle structural cues like thin borders and soft tonal shifts. The interface should feel like a high-end digital broadsheet—authoritative yet unobtrusive.

## Colors
The palette is dominated by **Slate and Steel neutrals** to ensure the user’s focus remains entirely on the content. 

- **Primary:** Deep Slate (#0F172A). Used for text and primary UI actions to ensure maximum contrast.
- **Accent:** A "Traditional RSS" Amber (#F59E0B). Used sparingly for unread indicators, active states, and "Subscribe" actions. 
- **Neutrals:** A range of Slate grays handle borders, secondary text, and metadata.

**Dark Mode Strategy:** The system uses a deep midnight blue-black (#020617) for backgrounds rather than pure black to reduce eye strain. Surface layers use slightly lighter slate tones to create a sense of depth without relying on heavy shadows.

## Typography
This system employs a dual-font strategy to separate **Reading** from **Utility**.

- **Literata (Serif):** Used for headlines and article body text. It is designed specifically for digital reading, offering high legibility at smaller sizes and a warm, editorial feel.
- **Inter (Sans-Serif):** Used for all functional UI elements, sidebar navigation, feed names, and metadata. Its neutral, systematic nature provides a clear functional contrast to the serif content.

**Reading Optimization:** Article body text should maintain a line height of 1.6x the font size to prevent line-skipping. Maximum character width for the reading area should be capped at 75 characters (approx. 600px) for optimal scanning.

## Layout & Spacing
The layout follows a **Three-Pane Fixed Architecture**, optimized for the horizontal constraints of a browser window:

1.  **Navigation Sidebar (240px):** Fixed-width, contains feed folders and sources.
2.  **Article List (320px):** Scrollable list of headlines with unread indicators.
3.  **Reading Pane (Fluid):** Expands to fill the remaining space, with centered content and wide margins.

The spacing rhythm is based on a **4px baseline grid**. Components use consistent padding (e.g., 12px internal padding for list items) to maintain a dense but organized feel. On smaller browser windows (mobile/compact mode), the layout collapses into a single-pane view with a "Back" navigation pattern.

## Elevation & Depth
The design system utilizes **Tonal Layering** over shadows to minimize visual noise. 

- **Level 0 (Background):** Base background color (White/Midnight).
- **Level 1 (Sidebar/Containers):** Subtle tint shift (Slate 50 / Slate 900) to distinguish the sidebar and list from the main reading area.
- **Level 2 (Active States/Popovers):** Very soft, diffused shadows (0px 4px 12px rgba(0,0,0,0.05)) are used only for temporary overlays like dropdown menus or settings modals.

Borders are the primary method of separation. Use 1px borders in `Slate-200` (Light) or `Slate-800` (Dark) to define the three-pane boundaries.

## Shapes
Following `shadcn/ui` patterns, the system uses **Soft (4px)** corners. This provides a modern, approachable feel while maintaining the structural rigour of a professional tool.

- **Buttons & Inputs:** 4px radius.
- **Selection Overlays (Sidebar/List):** 4px radius with 2px inset from the container edge.
- **Article Thumbnails:** 4px radius to match UI elements.
- **Badges/Indicators:** Fully rounded (pill-shaped) for unread counts to differentiate them from interactive buttons.

## Components
- **Sidebar Items:** Clean rows with 16px icons, `ui-label-md` text, and a right-aligned pill for unread counts. The active state uses a subtle background fill and a 2px vertical accent bar on the left.
- **Article List Item:** A vertical stack including a `ui-meta` source name, `headline-md` title, and a 2-line `body-md` excerpt. Unread status is indicated by a 6px Amber dot to the left of the title.
- **Buttons:** Primarily ghost or outline variants to keep the UI light. The "Primary" button uses the Slate-900 background with white text.
- **Input Fields:** Minimalist with a 1px border. Focus states use a 2px ring in the Accent Amber color.
- **Reading Area:** Large margins (min 40px). The headline uses `display-sm`. Images are capped at 100% width with subtle 4px rounding.
- **Scrollbars:** Custom slimmed-down scrollbars in Slate-300/700 to prevent them from distracting the user during long-form reading.
