import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import type { PaymentMethodDefaultsEditorProps } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/types";
import { PaymentDirection, PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { PaymentMethodDefaultsEditorMobile } from "@/frontend/mobile/components/ui/input/paymentMethodDefaultsEditor/paymentMethodDefaultsEditor.mobile";

const MOCK_METHODS: readonly PaymentMethodRow[] = [
  {
    id: "pm-payin-1",
    type: PaymentMethodType.MobileWallet,
    direction: PaymentDirection.Payin,
    label: "Vodafone Cash",
    catalogSlug: "vodafone-cash",
    isDefault: true,
  },
  {
    id: "pm-payout-1",
    type: PaymentMethodType.BankTransfer,
    direction: PaymentDirection.Payout,
    label: "Primary bank account",
    isDefault: false,
  },
  {
    id: "pm-both-1",
    type: PaymentMethodType.PaymentLink,
    direction: PaymentDirection.Both,
    label: "PayPal",
    catalogSlug: "paypal",
    isDefault: false,
  },
];

function PaymentMethodDefaultsEditorStory({
  initialPayinDefaultId = "pm-payin-1",
  initialPayoutDefaultId = "pm-payout-1",
  ...props
}: Readonly<
  Partial<PaymentMethodDefaultsEditorProps> & {
    initialPayinDefaultId?: string | null;
    initialPayoutDefaultId?: string | null;
  }
>) {
  const [payinDefaultId, setPayinDefaultId] = useState<string | null>(initialPayinDefaultId);
  const [payoutDefaultId, setPayoutDefaultId] = useState<string | null>(initialPayoutDefaultId);

  return (
    <Box sx={{ width: "100%", maxWidth: 375, p: 2 }}>
      <PaymentMethodDefaultsEditorMobile
        methods={MOCK_METHODS}
        payinDefaultId={payinDefaultId}
        payoutDefaultId={payoutDefaultId}
        onPayinDefaultChangeAction={setPayinDefaultId}
        onPayoutDefaultChangeAction={setPayoutDefaultId}
        instructions={{ en: "Send payment to the default wallet number." }}
        onInstructionsSaveAction={() => undefined}
        {...props}
      />
    </Box>
  );
}

const meta: Meta<typeof PaymentMethodDefaultsEditorStory> = {
  title: "UI/PaymentMethodDefaultsEditor/Mobile",
  component: PaymentMethodDefaultsEditorStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
};

export default meta;
type Story = StoryObj<typeof PaymentMethodDefaultsEditorStory>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const SuccessOpen: Story = {
  args: {
    successOpen: true,
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
};
