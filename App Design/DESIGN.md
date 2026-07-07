---
name: Digital Meeting
colors:
  surface: '#faf9ff'
  surface-dim: '#ccdaff'
  surface-bright: '#faf9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8ff'
  surface-container-highest: '#d8e2ff'
  on-surface: '#051a3e'
  on-surface-variant: '#434654'
  inverse-surface: '#1d3054'
  inverse-on-surface: '#edf0ff'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#0c56d0'
  primary: '#003d9b'
  on-primary: '#ffffff'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#b2c5ff'
  secondary: '#285ab9'
  on-secondary: '#ffffff'
  secondary-container: '#709bfe'
  on-secondary-container: '#003179'
  tertiary: '#384454'
  on-tertiary: '#ffffff'
  tertiary-container: '#4f5c6c'
  on-tertiary-container: '#c7d4e8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#d9e2ff'
  secondary-fixed-dim: '#b1c6ff'
  on-secondary-fixed: '#001946'
  on-secondary-fixed-variant: '#00419d'
  tertiary-fixed: '#d6e3f7'
  tertiary-fixed-dim: '#bbc7db'
  on-tertiary-fixed: '#101c2b'
  on-tertiary-fixed-variant: '#3b4858'
  background: '#faf9ff'
  on-background: '#051a3e'
  surface-variant: '#d8e2ff'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter-xs: 8px
  gutter-md: 16px
  margin-sm: 16px
  margin-lg: 32px
  container-max: 1280px
---

## Brand & Style
The design system is engineered for high-stakes professional environments where clarity, reliability, and administrative precision are paramount. The brand personality is authoritative yet approachable, prioritizing functional efficiency over decorative flair. 

The design style follows a **Corporate / Modern** aesthetic, utilizing a disciplined "Blue-Scale" system to establish depth. It leans into a structured UI with clear boundaries, subtle elevation, and an emphasis on data density that remains legible. The goal is to evoke a sense of focused calm and "institutional trust," ensuring users feel in total control of their digital workspace.

## Colors
The palette is strictly monochromatic-adjacent, leveraging shades of blue to create a functional hierarchy.

- **Primary (#0052CC):** Used for main actions, active states, and brand presence. It is a vibrant Royal Blue that ensures high visibility.
- **Secondary (#0747A6):** A deeper Navy used for headers, navigation backgrounds, and hover states for primary elements.
- **Tertiary (#DEEBFF):** A soft Sky Blue tint used for subtle backgrounds, highlights, and secondary button states to maintain a "light" feel without defaulting to pure white.
- **Neutral (#091E42):** A very dark Navy/Charcoal used for text and iconography to ensure maximum accessibility against white backgrounds.
- **Surface:** Pure white (#FFFFFF) is the primary canvas color to ensure maximum clarity and a "clean" clinical feel.

## Typography
This design system utilizes **Inter** for its systematic, utilitarian nature. The scale is built on a tight 4px baseline grid. 

Headlines use semi-bold and bold weights to provide immediate visual anchors. Large titles feature slight negative letter-spacing to appear more compact and professional. Body text is kept at 14px (md) for general data density, scaling to 16px (lg) for long-form reading or important status updates. Labels use uppercase styling and increased tracking to differentiate metadata from interactive content.

## Layout & Spacing
The layout follows a **Fixed Grid** model for desktop to maintain administrative control, and a fluid model for mobile devices.

- **Desktop:** 12-column grid with a 1280px max-width, 24px gutters, and 32px side margins.
- **Tablet:** 8-column grid with 16px gutters and 24px side margins.
- **Mobile:** 4-column fluid grid with 12px gutters and 16px margins.

Spacing should follow a strict 4px/8px incremental scale. High-density views (like participant lists) should use the 8px (gutter-xs) spacing, while dashboard cards should use 24px internal padding to maintain a feeling of "space and clarity."

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Low-Contrast Outlines**. 

Shadows are used sparingly; when applied, they are highly diffused (20px-40px blur) with very low opacity (5-8%) using a Navy tint (#091E42) rather than pure black. This prevents the UI from looking "dirty." 

Primary interactive surfaces use a 1px border (#DEEBFF) to define edges on white backgrounds. Active elements or modals use a secondary elevation level with a subtle soft shadow to pull the user's focus without breaking the flat, professional aesthetic.

## Shapes
The design system uses a **Soft (1)** roundedness logic. 

Standard components (Buttons, Inputs, Chips) use a 4px (0.25rem) corner radius. Large containers such as dashboard cards or modal windows use an 8px (0.5rem) radius. This subtle rounding retains a corporate, disciplined structure while feeling modern and touch-friendly. Avoid circular "pill" shapes except for status indicators (avatars or online/offline dots).

## Components

- **Buttons:** Primary buttons use a solid Primary Blue fill with white text. Secondary buttons use the Tertiary Blue fill with Primary Blue text. Ghost buttons use only Primary Blue text with no border.
- **Cards:** Dashboard cards for meeting stats must have a 1px border (#DEEBFF), 24px padding, and a subtle headline. They should not use heavy shadows unless they are "hovered" or "draggable."
- **Participant Lists:** Use a compact row format (48px-56px height). Include a circular avatar, Name (Body-MD-Bold), and Role (Label-SM). Action icons (mute, kick, pin) should appear on row hover.
- **Input Fields:** Use 1px borders (#D1D5DB). On focus, the border should change to Primary Blue with a 2px outer "glow" using a 20% opacity Primary Blue.
- **Chips:** Used for "Meeting Tags" or "Status." Use Tertiary Blue background with Secondary Blue text. The radius should match the Soft (4px) standard.
- **Admin Controls:** Toolbars should be pinned to the bottom or top with a slight backdrop blur and a thin top-border to separate from the main canvas.