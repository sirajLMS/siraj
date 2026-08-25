import type { UserEntityOnboardingLabels } from "@/shared/locale/types/onboarding/userEntity";

export const onboardingUserEntityEn: UserEntityOnboardingLabels = {
  sectionTitle: "Account Details",
  fields: {
    fullName: "Full Name",
    email: "Email",
    password: "Password",
    phone: "Phone",
    avatar: "Avatar",
    timezone: "Time Zone",
    displayCurrency: "Display Currency",
  },
  placeholders: {
    fullName: "Enter full name",
    email: "Enter email",
    password: "Enter password",
    phone: "Enter phone number",
  },
  validation: {
    fullNameRequired: "Full name is required",
    emailInvalid: "Enter a valid email address",
    passwordRequired: "Password is required",
    phoneRequired: "Phone number is required",
    timezoneRequired: "Time zone is required",
    currencyRequired: "Currency is required",
    nameMinLength: "Name must be at least 3 characters",
    passwordMinLength: "Password must be at least 12 characters long.",
    passwordWeakComplexity: "Password must contain at least 2 of: lowercase, uppercase, digits, symbols",
    passwordStrength: "Password strength",
    strengthWeak: "Weak",
    strengthFair: "Fair",
    strengthStrong: "Strong",
    showPassword: "Show password",
    hidePassword: "Hide password",
  },
};
