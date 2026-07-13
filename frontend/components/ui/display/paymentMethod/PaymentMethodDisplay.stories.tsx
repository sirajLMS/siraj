import { Box, Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { PaymentMethodDisplay } from "@/frontend/components/ui/display/paymentMethod/PaymentMethodDisplay";
import { CurrencyCode, PaymentDirection, PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";

const meta: Meta<typeof PaymentMethodDisplay> = {
  title: "UI/Display/PaymentMethodDisplay",
  component: PaymentMethodDisplay,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof PaymentMethodDisplay>;

export const MobileWallet: Story = {
  render: () => (
    <Box sx={{ width: 480, p: 2 }}>
      <PaymentMethodDisplay
        method={{
          type: PaymentMethodType.MobileWallet,
          direction: PaymentDirection.Payin,
          label: "My Vodafone",
          catalogName: { en: "Vodafone Cash", ar: "فودافون كاش" },
          catalogSlug: "vodafone-cash",
          countryCode: "EG",
          currencyCode: CurrencyCode.Egp,
          isDefault: true,
          isActive: true,
          details: { phone: "+201012345678" },
        }}
      />
    </Box>
  ),
};

export const BankTransferMasked: Story = {
  render: () => (
    <Box sx={{ width: 480, p: 2 }}>
      <PaymentMethodDisplay
        method={{
          type: PaymentMethodType.BankTransfer,
          direction: PaymentDirection.Payout,
          label: "Primary payout",
          verifiedAt: null,
          masked: true,
          details: {
            beneficiaryName: "Ahmed Hassan",
            bankName: "National Bank of Egypt",
            iban: "EG123456789012345678901234",
          },
        }}
      />
    </Box>
  ),
};

export const PaymentLink: Story = {
  render: () => (
    <Box sx={{ width: 480, p: 2 }}>
      <PaymentMethodDisplay
        method={{
          type: PaymentMethodType.PaymentLink,
          direction: PaymentDirection.Both,
          catalogName: { en: "PayPal" },
          catalogSlug: "paypal",
          isActive: true,
          details: { url: "https://paypal.me/example" },
        }}
      />
    </Box>
  ),
};

export const AllTypes: Story = {
  render: () => (
    <Stack spacing={2} sx={{ width: 520, p: 2 }}>
      <PaymentMethodDisplay
        method={{
          type: PaymentMethodType.MobileWallet,
          direction: PaymentDirection.Payin,
          catalogSlug: "vodafone-cash",
          details: { phone: "+201012345678" },
        }}
      />
      <PaymentMethodDisplay
        method={{
          type: PaymentMethodType.OnlineAccount,
          direction: PaymentDirection.Payout,
          catalogSlug: "wise",
          details: { identifier: "ahmed@example.com" },
        }}
      />
      <PaymentMethodDisplay
        method={{
          type: PaymentMethodType.Cash,
          direction: PaymentDirection.Payin,
          details: { note: "Collect at front desk" },
        }}
      />
    </Stack>
  ),
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  render: () => (
    <Box sx={{ width: 480, p: 2 }}>
      <PaymentMethodDisplay
        method={{
          type: PaymentMethodType.MobileWallet,
          direction: PaymentDirection.Payin,
          catalogName: { en: "Vodafone Cash", ar: "فودافون كاش" },
          catalogSlug: "vodafone-cash",
          isDefault: true,
          details: { phone: "+201012345678" },
        }}
      />
    </Box>
  ),
};
