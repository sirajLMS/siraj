# Login Page

This is the login page for the Siraj LMS educational management system.

## Structure

```
src/views/auth/login/
├── components/
│   ├── LoginHeader.tsx         # Header with logo and title
│   ├── LoginForm.tsx           # Main form with validation
│   ├── LoginFooter.tsx         # Footer with links
│   ├── ThemeLanguageControls.tsx # Theme and language switchers
│   └── index.ts                # Barrel export
├── schemas/
│   └── loginSchema.ts          # Zod validation schema
├── actions/
│   └── mockLogin.ts            # Mock login action (server-side)
└── README.md
```

## Features

- **Internationalization**: Full support for English and Arabic using next-intl
- **Theme Support**: Dark/light mode toggle integrated
- **Form Validation**: Client-side validation using Zod and react-hook-form
- **Mock Authentication**: Simulates random login responses for UI testing
- **Responsive Design**: Mobile-friendly layout
- **Accessibility**: ARIA labels and semantic HTML
- **Theme-aware**: Uses theme colors and spacing from the design system

## Components

### LoginHeader

Displays the school logo, title, and subtitle.

### LoginForm

Main form with:

- Username field with person icon
- Password field with lock icon and show/hide toggle
- Remember me checkbox
- Forgot password link
- Submit button with loading state
- Form validation with error messages

### LoginFooter

Contains:

- "Don't have an account?" with register link
- Help and language icons

### ThemeLanguageControls

Positioned in top-right corner with:

- Language switcher button group
- Theme toggle button

## Mock Login Behavior

The `mockLogin` action simulates:

- Random network delay (1-2 seconds)
- 70% success rate
- Random role assignment (admin, teacher, parent)
- Appropriate error messages

## Messages

All text is internationalized through:

- `src/types/message.ts` - Type definitions
- `src/messages/en.ts` - English translations
- `src/messages/ar.ts` - Arabic translations

## Usage

The page is accessible at `/[locale]/login` where `[locale]` is either `en` or `ar`.

## Next Steps

To connect to a real authentication system:

1. Replace `mockLogin` with actual API calls
2. Add session management
3. Implement redirect logic after successful login
4. Add forgot password functionality
5. Connect the register link to a registration page
