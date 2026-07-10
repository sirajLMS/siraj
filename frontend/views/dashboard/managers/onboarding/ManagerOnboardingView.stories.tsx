import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { ManagerOnboardingView } from "@/frontend/views/dashboard/managers/onboarding/ManagerOnboardingView";
import type { ManagerOnboardingFormData } from "@/frontend/views/dashboard/managers/onboarding/schemas/managerOnboardingSchema";
import { ManagerAccountType } from "@/frontend/views/dashboard/managers/onboarding/types";

const defaultValues: ManagerOnboardingFormData = {
  name: "",
  email: "",
  phone: "",
  accountType: ManagerAccountType.Manager,
  password: "",
};

function ManagerOnboardingStoryWrapper({
  isSubmitting,
  showSuccess,
}: Readonly<{ isSubmitting: boolean; showSuccess: boolean }>) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ManagerOnboardingFormData>({
    defaultValues,
  });
  return (
    <ManagerOnboardingView
      register={register}
      control={control}
      errors={errors}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      showSuccess={showSuccess}
      onSubmit={() => {}}
      onCancel={() => {}}
      onDismissSuccess={() => {}}
    />
  );
}

const meta: Meta<typeof ManagerOnboardingStoryWrapper> = {
  title: "Views/dashboard/managers/onboarding/ManagerOnboardingView",
  component: ManagerOnboardingStoryWrapper,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof ManagerOnboardingStoryWrapper>;

export const Default: Story = {
  args: {
    isSubmitting: false,
    showSuccess: false,
  },
};

export const Loading: Story = {
  args: {
    isSubmitting: true,
    showSuccess: false,
  },
};

export const Success: Story = {
  args: {
    isSubmitting: false,
    showSuccess: true,
  },
};
