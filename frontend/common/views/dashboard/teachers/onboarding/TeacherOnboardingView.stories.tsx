import type { Meta, StoryObj } from "@storybook/react";
import { TeacherOnboardingView } from "@/frontend/common/views/dashboard/teachers/onboarding/TeacherOnboardingView";

const mockLabels = {
  pageTitle: "Teacher Onboarding",
  pageSubtitle: "Create a new teacher account",
  mandatoryFields: "Mandatory fields",
  sections: {
    teacherInfo: "Teacher Info",
    officialDetails: "Official Details",
    salaryDetails: "Salary Details",
    paymentMethod: "Payment Method",
    meetingConfig: "Online Meeting",
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
    country: "Country",
    timezone: "Timezone",
    salaryAmount: "Salary Amount",
    currency: "Currency",
    meetingProvider: "Meeting provider",
    meetingUrl: "Meeting URL",
    meetingLabel: "Config label",
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
    salaryAmount: "Enter salary amount",
    meetingUrl: "https://zoom.us/j/123456789",
    meetingLabel: "Primary classroom",
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
    urlInvalid: "Invalid URL",
  },
  bannerJoinFaculty: "Join our faculty",
  bannerRegistrationForm: "Registration Form",
  optionalHint: "Optional: set a default online meeting link for scheduled classes.",
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
