import type { Meta, StoryObj } from "@storybook/react";
import { TeacherOnboardingView } from "@/frontend/views/dashboard/teachers/onboarding/TeacherOnboardingView";

const mockLabels = {
  pageTitle: "Teacher Onboarding",
  pageSubtitle: "Create a new teacher account",
  mandatoryFields: "Mandatory fields",
  sections: {
    teacherInfo: "Teacher Info",
    officialDetails: "Official Details",
    salaryDetails: "Salary Details",
    bankingLedger: "Banking Ledger",
  },
  fields: {
    fullName: "Full Name",
    email: "Email",
    nationality: "Nationality",
    nationalId: "National ID",
    phone: "Phone",
    age: "Age",
    gender: "Gender",
    male: "Male",
    female: "Female",
    address: "Address",
    qualifications: "Qualifications",
    zoomLink: "Zoom Link",
    country: "Country",
    zoomUsername: "Zoom Username",
    zoomPassword: "Zoom Password",
    timezone: "Timezone",
    salaryAmount: "Salary Amount",
    currency: "Currency",
    beneficiaryName: "Beneficiary Name",
    bankName: "Bank Name",
    accountNumber: "Account Number",
    routingNumber: "Routing Number",
    swiftBic: "SWIFT/BIC",
    iban: "IBAN",
  },
  placeholders: {
    fullName: "Enter full name",
    email: "Enter email",
    nationality: "Enter nationality",
    nationalId: "Enter national ID",
    phone: "Enter phone number",
    age: "Enter age",
    address: "Enter address",
    qualifications: "Enter qualifications",
    zoomLink: "Enter Zoom link",
    zoomUsername: "Enter Zoom username",
    zoomPassword: "Enter Zoom password",
    salaryAmount: "Enter salary amount",
    beneficiaryName: "Enter beneficiary name",
    bankName: "Enter bank name",
    accountNumber: "Enter account number",
    routingNumber: "Enter routing number",
    swiftBic: "Enter SWIFT/BIC",
    iban: "Enter IBAN",
  },
  actions: {
    signup: "Sign up",
    cancel: "Cancel",
    proceeding: "Proceeding...",
    successMessage: "Successfully completed!",
  },
  validation: {
    fullNameRequired: "Full name is required",
    emailRequired: "Email is required",
    emailInvalid: "Invalid email",
    nationalIdRequired: "National ID is required",
    phoneRequired: "Phone is required",
    genderRequired: "Gender is required",
    countryRequired: "Country is required",
    timezoneRequired: "Timezone is required",
    salaryAmountRequired: "Salary is required",
    currencyRequired: "Currency is required",
    beneficiaryNameRequired: "Beneficiary name is required",
    bankNameRequired: "Bank name is required",
    accountNumberRequired: "Account number is required",
    ibanRequired: "IBAN is required",
    urlInvalid: "Invalid URL",
  },
  bannerJoinFaculty: "Join our faculty",
  bannerRegistrationForm: "Registration Form",
};

const meta: Meta<typeof TeacherOnboardingView> = {
  title: "Views/dashboard/teachers/onboarding/TeacherOnboardingView",
  component: TeacherOnboardingView,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof TeacherOnboardingView>;

export const Default: Story = {
  args: {
    isSubmitting: false,
    showSuccess: false,
    labels: mockLabels,
    onSubmit: () => {},
    onDismissSuccess: () => {},
  },
};

export const Loading: Story = {
  args: {
    isSubmitting: true,
    showSuccess: false,
    labels: mockLabels,
    onSubmit: () => {},
    onDismissSuccess: () => {},
  },
};
