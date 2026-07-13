import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { CurrencyCode, IanaTimezone } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ParentOnboardingView } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentOnboardingView";
import type { ParentOnboardingFormData } from "@/frontend/common/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema";
import { InvoiceType, PaymentMethodType } from "@/frontend/common/views/dashboard/admin/parents/onboarding/types";

const defaultValues: ParentOnboardingFormData = {
  name: "",
  email: "",
  phone: "",
  nationality: "",
  address: "",
  whatsapp: "",
  facebook: "",
  twitter: "",
  invoiceType: InvoiceType.Monthly,
  feeAmount: "",
  payinMethod: {
    type: PaymentMethodType.BankTransfer,
    label: "",
    details: {},
  },
  currency: CurrencyCode.Usd,
  timezone: IanaTimezone.AfricaCairo,
};

function ParentOnboardingStoryWrapper({ isSubmitting }: Readonly<{ isSubmitting: boolean }>) {
  const form = useForm<ParentOnboardingFormData>({
    defaultValues: { ...defaultValues, timezone: IanaTimezone.AfricaCairo },
  });
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;
  return (
    <FormProvider {...form}>
      <ParentOnboardingView
        register={register}
        control={control}
        errors={errors}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onSubmit={() => {}}
      />
    </FormProvider>
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
