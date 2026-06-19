---
name: Siraj Dark
colors:
  surface: "#0e1515"
  surface-dim: "#0e1515"
  surface-bright: "#333b3a"
  surface-container-lowest: "#080f0f"
  surface-container-low: "#161d1d"
  surface-container: "#1a2121"
  surface-container-high: "#242b2b"
  surface-container-highest: "#2f3636"
  on-surface: "#dde4e3"
  on-surface-variant: "#bcc9c8"
  inverse-surface: "#dde4e3"
  inverse-on-surface: "#2b3232"
  outline: "#879393"
  outline-variant: "#3d4949"
  surface-tint: "#6bd7d7"
  primary: "#6bd7d7"
  on-primary: "#003737"
  primary-container: "#28a0a0"
  on-primary-container: "#002f2f"
  inverse-primary: "#006a6a"
  secondary: "#b1cccb"
  on-secondary: "#1c3434"
  secondary-container: "#354d4d"
  on-secondary-container: "#a3bdbd"
  tertiary: "#ffb691"
  on-tertiary: "#552100"
  tertiary-container: "#d07b4d"
  on-tertiary-container: "#4a1c00"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  primary-fixed: "#89f4f3"
  primary-fixed-dim: "#6bd7d7"
  on-primary-fixed: "#002020"
  on-primary-fixed-variant: "#004f50"
  secondary-fixed: "#cde8e7"
  secondary-fixed-dim: "#b1cccb"
  on-secondary-fixed: "#061f1f"
  on-secondary-fixed-variant: "#334b4b"
  tertiary-fixed: "#ffdbcb"
  tertiary-fixed-dim: "#ffb691"
  on-tertiary-fixed: "#341100"
  on-tertiary-fixed-variant: "#75340b"
  background: "#0e1515"
  on-background: "#dde4e3"
  surface-variant: "#2f3636"
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: "700"
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: "600"
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: "600"
    lineHeight: 36px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: "500"
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: "500"
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: "600"
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

The design system is a sophisticated evolution of its predecessor, optimized for low-light environments and high-performance focus. It targets a professional, tech-forward audience that values deep immersion and reduced eye strain without sacrificing brand identity.

The design style is **Corporate / Modern** with a lean towards **Tonal Layering**. It moves away from physical metaphors toward a digital-first, systematic hierarchy where depth is communicated through light and saturation rather than shadows. The personality is precise, calm, and authoritative, evoking a sense of stable, high-end engineering.

## Colors

This design system utilizes a "Deep Sea" dark palette. The primary brand teal has been shifted from its original dark value to a more luminous **#149696** to ensure it "pops" against dark backgrounds and meets accessibility standards.

- **Primary:** Used for key actions, active states, and brand moments.
- **Secondary:** A muted, desaturated teal used for subtle fills, secondary buttons, and less prominent UI elements.
- **Surface Hierarchy:** Depth is created by "lifting" surfaces. The further an element is from the backplane, the lighter and more saturated the teal-charcoal mix becomes.
- **Typography Colors:** Pure white is reserved for headings and primary buttons. Secondary text uses a light gray-teal to maintain a cohesive atmospheric feel.

## Typography

The design system uses **Hanken Grotesk** exclusively to maintain a sharp, contemporary, and engineered feel.

- **Weight Strategy:** Use Bold (700) for large displays and SemiBold (600) for standard headlines. Regular (400) is optimized for long-form reading in dark mode to prevent "haloing" (text appearing too blurry on dark backgrounds).
- **Scale:** On mobile, large display fonts scale down to prevent excessive line breaks, while body text remains consistent at 16px for readability.
- **Tracking:** Headlines feature slightly tighter tracking to feel more "locked-in" and architectural. Labels use increased tracking for clarity at small sizes.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for desktop to maintain a professional, structured density, while transitioning to a **Fluid Grid** for mobile.

- **Grid:** 12-column system for desktop (1280px max-width) with 24px gutters.
- **Rhythm:** An 8px linear scale drives all padding and margins.
- **Mobile Adaptive:** Margins shrink to 16px on mobile devices. Elements should stack vertically, and padding within cards should reduce from 24px (lg) to 16px (md) to maximize screen real estate.

## Elevation & Depth

This design system eschews traditional drop shadows in favor of **Tonal Layers** and **Low-contrast Outlines**.

- **Elevation Levels:**
  - **Level 0 (Base):** Background (#0a1111).
  - **Level 1 (Cards/Sections):** Surface Container (#121d1d) with a 1px solid stroke of #1a2a2a.
  - **Level 2 (Popovers/Modals):** Surface Container High (#1a2a2a) with a subtle outer glow of the primary color at 5% opacity to simulate light emission.
- **Interactions:** Hover states should be indicated by an increase in surface luminance or a subtle primary-colored border, rather than a shadow "lift."

## Shapes

The shape language is defined by a consistent **0.5rem (8px)** base radius. This creates a professional balance between geometric rigor and approachable softness.

- **Buttons & Inputs:** Use the standard 0.5rem (8px) radius.
- **Cards & Modals:** Use `rounded-lg` (16px) to define major layout containers.
- **Status Pills:** Use `rounded-xl` (24px) or full pill-shape to distinguish them from actionable buttons.

## Components

- **Buttons:**
  - _Primary:_ Solid fill (#149696) with white text.
  - _Secondary:_ Ghost style with a #263e3e border and light teal text.
- **Input Fields:** Use Surface Container High (#1a2a2a) for the fill. On focus, the border transitions to the primary teal with a subtle inner glow.
- **Chips:** Small, pill-shaped elements with a secondary color background (#263e3e). Active chips use a primary border.
- **Cards:** Use Level 1 elevation (Surface Container). Content within cards should use the 24px (lg) spacing unit for internal padding.
- **Checkboxes/Radios:** Square-round hybrids with 4px radius. Checked state uses the primary teal color.
- **Lists:** Use subtle 1px dividers of #1a2a2a. Interactive list items should have a hover state that lightens the background to #1a2a2a.
