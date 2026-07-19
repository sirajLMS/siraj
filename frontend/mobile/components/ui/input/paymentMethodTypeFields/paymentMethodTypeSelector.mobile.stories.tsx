import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PaymentMethodTypeSelectorProps } from "@/frontend/mobile/components/ui/input/paymentMethodTypeFields";
import { PaymentMethodTypeSelectorMobile } from "@/frontend/mobile/components/ui/input/paymentMethodTypeFields/paymentMethodTypeSelector.mobile";

function PaymentMethodTypeSelectorStory({
  initialType = PaymentMethodType.BankTransfer,
  initialError = false,
  ...props
}: Readonly<
  Partial<PaymentMethodTypeSelectorProps> & {
    initialType?: PaymentMethodType | null;
    initialError?: boolean;
  }
>) {
  const [type, setType] = useState<PaymentMethodType | null>(initialType);

  return (
    <Box sx={{ width: 375, p: 2 }}>
      <PaymentMethodTypeSelectorMobile
        type={type}
        setTypeAction={setType}
        error={initialError}
        fullWidth
        {...props}
      />
    </Box>
  );
}

const meta: Meta<typeof PaymentMethodTypeSelectorStory> = {
  title: "UI/PaymentMethodTypeSelector/Mobile",
  component: PaymentMethodTypeSelectorStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: {
        mobile1: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
        mobile2: {
          name: "Mobile Large (414px)",
          styles: { width: "414px", height: "896px" },
        },
        tablet: {
          name: "Tablet (768px)",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop (1280px)",
          styles: { width: "1280px", height: "800px" },
        },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PaymentMethodTypeSelectorStory>;

export const Default: Story = {
  args: {
    initialType: PaymentMethodType.BankTransfer,
  },
};

export const WithError: Story = {
  args: {
    initialType: PaymentMethodType.Cash,
    initialError: true,
    required: true,
  },
};

export const AllowEmpty: Story = {
  args: {
    initialType: null,
    allowEmpty: true,
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    initialType: PaymentMethodType.MobileWallet,
    required: true,
  },
};
