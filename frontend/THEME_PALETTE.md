# Material 3 Theme Palette

This document summarizes the changes made to the theme palette to align with Material 3 standards and MUI requirements.

## New Structure

The palette has been refactored to support a flattened Material 3 "Color Family" structure while maintaining compatibility with MUI's standard palette objects.

### 1. Standard MUI Families (Object + Siblings)
The following families are implemented as MUI `PaletteColor` objects but also have their Material 3 siblings available at the top level of the palette:
- `primary`, `secondary`, `error`, `warning`, `info`, `success`

**Access Patterns:**
- `theme.palette.primary.main` (MUI Standard - **Always prefer `.main`**)
- `theme.palette.onPrimary` (M3 Sibling - **Replaces `contrastText`**)
- `theme.palette.primaryContainer`
- `theme.palette.onPrimaryContainer`

### 2. Custom & Layout Families (Flattened)
These families are fully flattened:
- `tertiary`, `header`, `footer`, `sidebar`

**Access Patterns:**
- `theme.palette.header` (Base Color String)
- `theme.palette.onHeader`

### 3. Status Families (Sub-object Flattened)
- `pending`, `confirmed`, `active`, `completed`, `cancelled`, `blocked`

### 4. Base Scheme (Standard M3)
Direct access to all standard Material 3 scheme properties from `Color.kt`:
- `background`, `surface`, `surfaceVariant`, `outline`, `outlineVariant`, `scrim`, etc.
- `surfaceContainerLowest` to `surfaceContainerHighest`

---

## CRITICAL IMPLEMENTATION RULES

1.  **No Quotes**: Never use MUI's string-based palette access (e.g., `color="primary.main"` or `sx={{ color: 'primary.main' }}`).
2.  **Theme Function**: Use the theme callback pattern ONLY when theme-specific values are needed:
    - `sx={(theme) => ({ color: theme.palette.primary.main })}`
    - If no theme values are used, use a plain object: `sx={{ display: 'flex' }}`
3.  **NO DELETION**: Never delete an existing theme value (like `boxShadow` or `border`) if it's missing from your context. **Map it** to the most appropriate theme property.
    - e.g. `boxShadow: theme => theme.palette.shadow.card` (Restored property)
4.  **No `contrastText`**: Do NOT use `palette.primary.contrastText`. Instead, use the corresponding M3 `on<Color>` property (e.g., `theme.palette.onPrimary`).
5.  **Universal Contrast**: The M3 `on<Color>` property is designed to provide legibility across `main`, `light`, and `dark` tones of that family.
6.  **Container Contrast**: Use `on<Color>Container` specifically for `Container` variants.
7.  **Background Access**: Use `theme.palette.background.default` or `theme.palette.background.paper`.
8.  **No Hardcoded Hex/RGB**: All colors MUST come from `theme.palette`.

---

## Layout Properties (Restored)
The following properties have been restored to the theme to support the application's layout system:
- **`theme.palette.border`**: `light`, `main`
- **`theme.palette.shadow`**: `card`, `cardHover`, `button`, `buttonHover`
