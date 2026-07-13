import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { StudentOnboardingView } from "@/frontend/common/views/dashboard/students/onboarding/StudentOnboardingView";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";

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

  return (
    <StudentOnboardingView
      register={register}
      control={control}
      errors={formState.errors}
      handleSubmit={handleSubmit}
      isSubmitting={false}
      parentOptions={[{ id: "parent-1", label: "Ahmed Parent" }]}
      teacherOptions={[{ id: "teacher-1", name: "Sara Teacher" }]}
      parentLocked
      labels={labels}
      onSubmit={() => undefined}
    />
  );
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
