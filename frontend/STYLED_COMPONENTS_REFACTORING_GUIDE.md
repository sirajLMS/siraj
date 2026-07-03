# MUI Styled Components Refactoring Guide

This guide documents the process for extracting MUI components with custom styles to top-level styled components, following the pattern established in `frontend/views/dashboard/permissions`.

## Overview

When refactoring components, extract all MUI components that use custom `sx` props with theme callbacks to top-level `styled` components. This improves readability, reusability, and maintainability.

## Refactoring Process

### Step 1: Identify Components to Extract

Look for MUI components with:
- `sx` props using theme callbacks: `sx={theme => ({ ... })}`
- Custom styles that are repeated (e.g., multiple IconButtons with same hover effect)
- Complex styling logic that should be separated from JSX

**DO extract:**
- Icons with custom colors
- Containers with flex layouts and custom styles
- Typography with custom colors, weights, or transformations
- Links with custom styling
- Buttons with custom padding, borders, or hover effects
- Box wrappers with theme-based backgrounds or borders

**DO NOT extract:**
- Components that need the `component` prop (e.g., `Box component="form"`)
- Card and CardContent (use `sx` prop directly - styled has TypeScript issues)
- Simple one-off styles that don't repeat
- Components where styling is tightly coupled to props

### Step 2: Extract to Top-Level Styled Components

Use `styled` from `@mui/material/styles`:

```typescript
import { styled } from "@mui/material/styles";

// Descriptive comment explaining the component's purpose
const StyledComponentName = styled(MuiComponent)(({ theme }) => ({
  // Theme-based styles
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.background.default,
}));

// For styles without theme access
const StyledSimpleComponent = styled(MuiComponent)({
  display: "flex",
  flexDirection: "column",
});
```

### Step 3: Add Descriptive Comments

Every styled component MUST have a comment explaining its purpose:

```typescript
// Main container for the login header section - centers content vertically
const StyledHeaderContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

// Circular icon container with primary background color
const StyledIconContainer = styled(Box)(({ theme }) => ({
  width: 64,
  height: 64,
  backgroundColor: theme.palette.primary.main,
  borderRadius: Number(theme.shape.borderRadius) * 2,
}));
```

### Step 4: Use Extracted Components

Replace inline styled components with the extracted versions:

**Before:**
```typescript
<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
  <Box sx={theme => ({ width: 64, height: 64, backgroundColor: theme.palette.primary.main })}>
    <School sx={theme => ({ fontSize: 40, color: theme.palette.onPrimary })} />
  </Box>
</Box>
```

**After:**
```typescript
<StyledHeaderContainer sx={{ mb: 4 }}>
  <StyledIconContainer>
    <StyledSchoolIcon />
  </StyledIconContainer>
</StyledHeaderContainer>
```

### Step 5: Handle Layout Props

Keep layout-specific props (margins, gaps, padding) in `sx` when they vary by usage:

```typescript
// Styled component defines base styles
const StyledContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

// Usage adds layout-specific spacing
<StyledContainer sx={{ mb: 4, gap: 2 }}>
```

## Critical Rules

### 1. Safe Type Conversions

When using `theme.shape.borderRadius` in arithmetic, wrap with `Number()`:

```typescript
// ❌ Wrong - borderRadius can be string
borderRadius: theme.shape.borderRadius * 2,

// ✅ Correct - safe conversion
borderRadius: Number(theme.shape.borderRadius) * 2,
```

### 2. Component Prop Limitation

The `component` prop does NOT work with styled components:

```typescript
// ❌ Wrong - TypeScript error
const StyledForm = styled(Box)({ ... });
<StyledForm component="form">

// ✅ Correct - use regular Box with component prop
<Box component="form" sx={{ display: "flex", flexDirection: "column" }}>
```

### 3. Card and CardContent

Do NOT use `styled` with Card or CardContent - use `sx` prop directly:

```typescript
// ❌ Wrong - TypeScript overload error
const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: theme.layout.authWidth,
}));

// ✅ Correct - use sx prop
<Card sx={theme => ({ maxWidth: theme.layout?.authWidth || 400 })}>
```

### 4. Typography Component Prop

The `component` prop on Typography doesn't work with styled:

```typescript
// ❌ Wrong
const StyledTitle = styled(Typography)({ ... });
<StyledTitle variant="headlineLg" component="h1">

// ✅ Correct - remove component prop or use wrapper
<StyledTitle variant="headlineLg" sx={{ mb: 0.5 }}>
```

### 5. Theme Value Access

Use optional chaining when theme values might not exist:

```typescript
// ✅ Correct - safe access
maxWidth: theme.layout?.authWidth || 400,
boxShadow: theme.palette.shadow?.card || 3,
```

## Validation Loop (MANDATORY)

After extracting styled components, run this validation loop until ALL three checks pass:

```bash
# 1. TypeScript compilation
bun tsgo

# 2. Biome formatting and linting
bun biome:check <file-path>

# 3. ESLint (via lint queue client — NEVER run `bun lint` directly)
curl -s -X POST http://localhost:4777/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"refactor","files":["<file-path>"]}'
```

**Process:**
1. Run all three checks
2. If any check fails, fix the issues
3. Run all three checks again
4. Repeat until all three pass in a complete round
5. Only then move to the next file

**Example:**
```bash
# Round 1
bun tsgo                    # ❌ Found error
bun biome:check file.tsx    # ✅ Passed
# lint via queue client     # ✅ Passed

# Fix TypeScript error, then Round 2
bun tsgo                    # ✅ Passed
bun biome:check file.tsx    # ✅ Passed
# lint via queue client     # ✅ Passed
# ✅ All passed - done!
```

## Naming Conventions

Use descriptive names that indicate the component's purpose:

```typescript
// ✅ Good names
const StyledHeaderContainer = styled(Box)({ ... });
const StyledIconContainer = styled(Box)({ ... });
const StyledSchoolIcon = styled(School)({ ... });
const StyledTitle = styled(Typography)({ ... });
const StyledSubtitle = styled(Typography)({ ... });
const StyledForgotPasswordLink = styled(Link)({ ... });
const StyledSubmitButton = styled(Button)({ ... });

// ❌ Bad names
const Container = styled(Box)({ ... });
const Wrapper = styled(Box)({ ... });
const StyledBox = styled(Box)({ ... });
const MyButton = styled(Button)({ ... });
```

## Complete Example

```typescript
"use client";

import { School } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";

// Main container for the login header section - centers content vertically
const StyledHeaderContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

// Circular icon container with primary background color
const StyledIconContainer = styled(Box)(({ theme }) => ({
  width: 64,
  height: 64,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: theme.palette.primary.main,
  borderRadius: Number(theme.shape.borderRadius) * 2,
}));

// School icon styled with onPrimary color for contrast
const StyledSchoolIcon = styled(School)(({ theme }) => ({
  fontSize: 40,
  color: theme.palette.onPrimary,
}));

// Main title typography with bold weight
const StyledTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: 700,
}));

// Subtitle with uppercase transformation and letter spacing
const StyledSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
}));

export function LoginHeader() {
  const t = useTranslations("auth.login");

  return (
    <StyledHeaderContainer sx={{ mb: 4 }}>
      <StyledIconContainer sx={{ mb: 2 }}>
        <StyledSchoolIcon />
      </StyledIconContainer>
      <StyledTitle variant="headlineLg" sx={{ mb: 0.5 }}>
        {t("title")}
      </StyledTitle>
      <StyledSubtitle variant="bodyMd">{t("subtitle")}</StyledSubtitle>
    </StyledHeaderContainer>
  );
}
```

## Common Patterns

### Icon with Theme Color

```typescript
const StyledPersonIcon = styled(Person)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));
```

### Flex Container

```typescript
const StyledFormActionsContainer = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});
```

### Link with Custom Style

```typescript
const StyledForgotPasswordLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: "14px",
  fontWeight: 500,
}));
```

### Button with Hover Effect

```typescript
const StyledFooterIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  "&:hover": {
    color: theme.palette.primary.main,
  },
}));
```

### Grid Layout

```typescript
const StyledButtonGrid = styled(Box)({
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
});
```

## Checklist

Before marking a file as refactored:

- [ ] All MUI components with theme-based `sx` props extracted to styled components
- [ ] Each styled component has a descriptive comment
- [ ] Safe type conversions applied (e.g., `Number()` for borderRadius)
- [ ] No `component` prop used on styled components
- [ ] Card/CardContent use `sx` prop directly (not styled)
- [ ] Naming follows conventions (StyledXxx)
- [ ] Layout props (margins, gaps) kept in `sx` at usage
- [ ] `bun tsgo` passes
- [ ] `bun biome:check` passes
- [ ] lint via queue client passes (NEVER run `bun lint` directly)
- [ ] All three checks pass in a complete round

## Reference

For working examples, see:
- `frontend/views/auth/login/components/LoginHeader.tsx`
- `frontend/views/auth/login/components/LoginFooter.tsx`
- `frontend/views/auth/login/components/LoginForm.tsx`
- `frontend/views/auth/login/components/DemoFastLogin.tsx`
- `frontend/views/auth/login/components/ThemeLanguageControls.tsx`
- `frontend/views/auth/login/LoginView.tsx`
- `frontend/views/dashboard/permissions/components/*.tsx` (original pattern source)
