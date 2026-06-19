---
name: Abyssal Enterprise
colors:
  surface: '#111414'
  surface-dim: '#111414'
  surface-bright: '#373a3a'
  surface-container-lowest: '#0c0f0f'
  surface-container-low: '#191c1c'
  surface-container: '#1D2020'
  surface-container-high: '#282A2A'
  surface-container-highest: '#323535'
  on-surface: '#e1e3e2'
  on-surface-variant: '#bfc8c7'
  inverse-surface: '#e1e3e2'
  inverse-on-surface: '#2e3131'
  outline: '#899292'
  outline-variant: '#404848'
  surface-tint: '#98d1d0'
  primary: '#b4edec'
  on-primary: '#003737'
  primary-container: '#98d1d0'
  on-primary-container: '#205b5b'
  inverse-primary: '#2e6767'
  secondary: '#bcc7de'
  on-secondary: '#263143'
  secondary-container: '#3c475a'
  on-secondary-container: '#aab5cc'
  tertiary: '#efdbff'
  on-tertiary: '#3a284d'
  tertiary-container: '#d5bdeb'
  on-tertiary-container: '#5d4a71'
  error: '#FFB4AB'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#b3edec'
  primary-fixed-dim: '#98d1d0'
  on-primary-fixed: '#002020'
  on-primary-fixed-variant: '#0f4f4f'
  secondary-fixed: '#d8e3fa'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#efdbff'
  tertiary-fixed-dim: '#d5bdeb'
  on-tertiary-fixed: '#241337'
  on-tertiary-fixed-variant: '#513f65'
  background: '#111414'
  on-background: '#e1e3e2'
  surface-variant: '#323535'
  success: '#62DF7D'
  warning: '#FFBA46'
  info: '#B4C5FF'
  completed: '#DDB8FF'
  sidebar: '#002626'
  header-container: '#135E5E'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
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
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.1px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.5px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.5px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  grid-margin: 24px
  grid-gutter: 16px
  container-padding: 16px
  cell-padding-x: 12px
  cell-padding-y: 8px
---

## Brand & Style

The design system is optimized for high-density Enterprise Permission Management, where clarity, security, and precision are paramount. The aesthetic follows a **Modern SaaS** approach rooted in **Material Design 3 (M3)** principles, specifically tailored for a dark-mode environment.

The visual narrative is "Technical Depth"—using a deep-sea palette of teals and cyans to create a focused, low-strain workspace for administrators. The style leverages **Minimalism** with a focus on **Tonal Layering**; instead of heavy shadows, the system uses tiered surface containers to establish hierarchy. This ensures that even in complex data grids, the user's focus remains on the relationship between permissions, roles, and system states.

- **Primary Driver:** Data Density and System State.
- **Tone:** Professional, Secure, and Sophisticated.
- **Visual Strategy:** Surface-based elevation, high-contrast semantic labeling, and sharp, legible typography.

## Colors

The palette is a strict implementation of a Dark M3 color system. It prioritizes "On-Color" accessibility, ensuring that any text placed on a container or brand color meets high legibility standards.

- **Primary Palette:** Used for main actions and active states. The Teal tones (#98D1D0) provide a tech-forward feel.
- **Surface Tiers:** The UI is built on `surfaceContainer` (#1D2020), with `surfaceContainerLow` for background layering and `surfaceContainerHigh` for elevated elements like cards or modals.
- **Semantic Mapping:** 
    - **Success (#62DF7D):** Active status, granted permissions.
    - **Error (#FFB4AB):** Blocked status, core permission locks, or critical alerts.
    - **Warning (#FFBA46):** Pending states or potential permission conflicts.
    - **Info/Confirmed (#B4C5FF):** System-verified states.
- **Navigation:** The Sidebar and Header utilize a distinct deep teal shade (#002626 and #135E5E) to separate global navigation from the workspace.

## Typography

This design system uses **Inter** for all levels to ensure maximum legibility in data-heavy environments. The scale is optimized for SaaS, where `body-md` (14px) is the standard size for grid content and form inputs to maximize information density.

- **Headlines:** Use a tighter letter-spacing and heavier weights to provide clear section anchors.
- **Labels:** Utilized for SystemBadges and column headers. These often use `label-sm` or `label-md` with slight letter spacing to maintain clarity at small sizes.
- **Mobile Scaling:** For mobile-specific views, `headline-lg` should be capped at `headline-md` sizes to avoid excessive wrapping.

## Layout & Spacing

The layout employs a **Fluid Grid** model with a 12-column structure for desktop. To accommodate enterprise permission matrices, spacing is deliberately **tight and efficient**.

- **Rhythm:** Based on a 4px base unit. 
- **Data Grids:** Use `cell-padding-y: 8px` to ensure high row density, allowing administrators to view more permissions without excessive scrolling.
- **Margins:** Standard page margins are set to 24px, but the internal workspace container uses 16px padding to maintain a compact feel.
- **Breakpoints:**
    - **Desktop (1200px+):** 12 columns, fixed sidebar (280px).
    - **Tablet (768px - 1199px):** 8 columns, collapsed sidebar to icons only.
    - **Mobile (<767px):** 4 columns, sidebar converted to a bottom navigation or drawer.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** rather than physical shadows, following M3's "Surface Tint" philosophy.

- **Background:** `surface` (#111414) acts as the base.
- **Content Containers:** `surfaceContainer` (#1D2020) is used for the main data grid and cards.
- **Overlays/Modals:** `surfaceContainerHighest` (#323535) is used for elements that need to sit on top of the workspace.
- **Interactive States:** Shadows are strictly reserved for **Hover** states. A subtle 1px border (`border.light`) is combined with a soft, large-radius glow to indicate that a card or row is interactive.
- **Outlines:** Standard borders use `outline` (#899292) at 1px width, while secondary separators use `outlineVariant` (#404848).

## Shapes

The system uses **Soft (0.25rem)** roundedness for standard UI elements like inputs, buttons, and grid rows. This maintains a professional, "engineered" look while avoiding the harshness of sharp corners.

- **Small Components:** Buttons and Input fields use `rounded` (4px).
- **Large Components:** Data grids and main containers use `rounded-lg` (8px).
- **SystemBadges:** Use a specialized `rounded-full` (pill shape) to distinguish them from interactive buttons.

## Components

### SystemBadges
- **Variants:**
    - **System Group:** `secondaryContainer` background with `onSecondaryContainer` text.
    - **Core Permission:** `error` background (#FFB4AB) with a "Lock" icon.
    - **Override Grant:** `success.dark` background with `onSuccess` text.
    - **Override Deny:** `error.main` background with `onBlocked` text.
- **Styling:** Pill-shaped, `label-sm` typography, 4px horizontal gap between icon and text.

### PaginatedDataGrid
- **Header:** `surfaceContainerHigh` background, `label-md` bold text, `outline` bottom border.
- **Rows:** Alternating `surfaceContainer` and `surface` (optional), or unified `surfaceContainer` with 1px `outlineVariant` separators.
- **Active/Selected Row:** `primaryContainer` background with a 2px `primary.main` left-border accent.
- **Pagination:** Sticky footer using `surfaceContainerHigh`, clear `body-sm` text for "Page X of Y".

### MultiSelectDataGrid
- **Checkboxes:** First column fixed width (48px). Use `primary.main` for checked state.
- **Disabled State:** For "Core Permissions," the row background is dimmed to 40% opacity; cursor changes to `not-allowed`.

### BulkActionBar
- **Appearance:** Fixed floating bar at the bottom center or anchored below the header.
- **Background:** `primaryContainer` (#0D4D4D) with a subtle shadow.
- **Action Buttons:** Contained buttons. Use `error.main` for destructive actions like "Remove Selected."

### Input Fields & Controls
- **Inputs:** Outlined style using `outline`. On focus, transition to `primary.main` with a 2px stroke.
- **Tooltips:** `inverseSurface` background with `inverseOnSurface` text, 4px border radius, `body-sm` typography.