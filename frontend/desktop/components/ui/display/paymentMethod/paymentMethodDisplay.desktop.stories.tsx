import { Box, Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  CountryCode,
  CurrencyCode,
  PaymentDirection,
  PaymentMethodType,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { DesktopPaymentMethodDisplay } from "@/frontend/desktop/components/ui/display/paymentMethod/paymentMethodDisplay.desktop";

const meta: Meta<typeof DesktopPaymentMethodDisplay> = {
  title: "UI/PaymentMethodDisplay/Desktop",
  component: DesktopPaymentMethodDisplay,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof DesktopPaymentMethodDisplay>;

export const MobileWallet: Story = {
  render: () => (
    <Box sx={{ width: 480, p: 2 }}>
      <DesktopPaymentMethodDisplay
        method={{
          type: PaymentMethodType.MobileWallet,
          direction: PaymentDirection.Payin,
          label: "My Vodafone",
          catalogName: { en: "Vodafone Cash", ar: "فودافون كاش" },
          catalogSlug: "vodafone-cash",
          countryCode: CountryCode.Eg,
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
      <DesktopPaymentMethodDisplay
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
      <DesktopPaymentMethodDisplay
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
      <DesktopPaymentMethodDisplay
        method={{
          type: PaymentMethodType.MobileWallet,
          direction: PaymentDirection.Payin,
          catalogSlug: "vodafone-cash",
          details: { phone: "+201012345678" },
        }}
      />
      <DesktopPaymentMethodDisplay
        method={{
          type: PaymentMethodType.OnlineAccount,
          direction: PaymentDirection.Payout,
          catalogSlug: "wise",
          details: { identifier: "ahmed@example.com" },
        }}
      />
      <DesktopPaymentMethodDisplay
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
      <DesktopPaymentMethodDisplay
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
