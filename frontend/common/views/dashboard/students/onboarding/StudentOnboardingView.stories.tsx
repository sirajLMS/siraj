import type { Meta, StoryObj } from "@storybook/react";
import {
  type Control,
  type FieldErrors,
  type UseFormHandleSubmit,
  type UseFormRegister,
  useForm,
} from "react-hook-form";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";
import type { StudentOnboardingViewModel } from "@/frontend/common/views/dashboard/students/onboarding/useStudentOnboardingViewModel";
import { StudentOnboardingDesktopView } from "@/frontend/desktop/views/dashboard/students/onboarding/studentOnboarding.desktop";

const labels = {
  pageTitle: "New Student Registration",
  pageSubtitle: "Complete the following fields to enroll a new student under an existing parent.",
  statusBanner: "Account Status: Pending Registration",
  create: "Create Student",
  processing: "Creating...",
  sections: {
    parentAssignment: "Parent Assignment",
    studentInfo: "Student Information",
    teacherAssignment: "Teacher Assignment",
  },
  fields: {
    parent: "Parent",
    name: "Student Name",
    dateOfBirth: "Date of Birth",
    gender: "Gender",
    male: "Male",
    female: "Female",
    language: "Language",
    status: "Status",
    primaryTeacher: "Primary Teacher",
  },
  placeholders: {
    parent: "Select parent",
    name: "e.g. Ahmed Mohammed",
    dateOfBirth: "YYYY-MM-DD",
    language: "Select language",
    primaryTeacher: "Select teacher (optional)",
  },
  options: {
    status: {
      onTrial: "On Trial",
      regular: "Regular",
    },
  },
  validation: {
    parentRequired: "Parent is required",
    nameMinLength: "Name must be at least 3 characters",
  },
};

function StudentOnboardingStory() {
  const { register, control, handleSubmit, formState } = useForm<StudentOnboardingFormData>({
    defaultValues: {
      parentId: "parent-1",
      name: "",
      dateOfBirth: "",
      gender: null,
      language: null,
      status: StudentStatus.OnTrial,
      primaryTeacherId: "",
    },
  });

  const viewModel: StudentOnboardingViewModel = {
    register: register as UseFormRegister<StudentOnboardingFormData>,
    control: control as Control<StudentOnboardingFormData>,
    errors: formState.errors as FieldErrors<StudentOnboardingFormData>,
    handleSubmit: handleSubmit as UseFormHandleSubmit<StudentOnboardingFormData>,
    isSubmitting: false,
    parentLocked: true,
    labels,
    onSubmit: () => undefined,
    successOpen: false,
    onCloseSuccess: () => undefined,
    successMessage: "Student created successfully.",
  };

  return <StudentOnboardingDesktopView {...viewModel} />;
}

const meta = {
  title: "Views/dashboard/students/onboarding/StudentOnboardingView",
  component: StudentOnboardingStory,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof StudentOnboardingStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
