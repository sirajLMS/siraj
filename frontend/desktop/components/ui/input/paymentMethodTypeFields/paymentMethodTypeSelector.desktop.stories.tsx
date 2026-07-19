import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PaymentMethodTypeSelectorProps } from "@/frontend/desktop/components/ui/input/paymentMethodTypeFields";
import { PaymentMethodTypeSelectorDesktop } from "@/frontend/desktop/components/ui/input/paymentMethodTypeFields/paymentMethodTypeSelector.desktop";

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
    <Box sx={{ width: 640, p: 2 }}>
      <PaymentMethodTypeSelectorDesktop type={type} setTypeAction={setType} error={initialError} fullWidth {...props} />
    </Box>
  );
}

const meta: Meta<typeof PaymentMethodTypeSelectorStory> = {
  title: "UI/PaymentMethodTypeSelector/Desktop",
  component: PaymentMethodTypeSelectorStory,
  tags: ["ai-generated"],
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
