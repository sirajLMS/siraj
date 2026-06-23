import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { ParentOnboardingView } from "./ParentOnboardingView";
import type { ParentOnboardingFormData } from "./schemas/parentOnboardingSchema";
import { InvoiceType, PaymentMethod } from "./types";

const defaultValues: ParentOnboardingFormData = {
  name: "",
  email: "",
  phone: "",
  nationality: "",
  address: "",
  whatsapp: "",
  facebook: "",
  twitter: "",
  skype: "",
  defaultZoomLink: "",
  invoiceType: InvoiceType.Monthly,
  feeAmount: "",
  paymentMethod: PaymentMethod.Paypal,
  currency: "USD",
};

function ParentOnboardingStoryWrapper({ isSubmitting }: Readonly<{ isSubmitting: boolean }>) {
  const { register, handleSubmit, formState: { errors } } = useForm<ParentOnboardingFormData>({
    defaultValues,
  });
  return (
    <ParentOnboardingView
      register={register}
      errors={errors}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      onSubmit={() => {}}
    />
  );
}

const meta: Meta<typeof ParentOnboardingStoryWrapper> = {
  title: "Views/dashboard/parents/onboarding/ParentOnboardingView",
  component: ParentOnboardingStoryWrapper,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof ParentOnboardingStoryWrapper>;

export const Default: Story = {
  args: {
    isSubmitting: false,
  },
};

export const Loading: Story = {
  args: {
    isSubmitting: true,
  },
};
