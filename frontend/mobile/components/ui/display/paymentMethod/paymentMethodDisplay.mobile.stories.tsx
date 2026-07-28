import { Box, Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  CurrencyCode,
  PaymentDirection,
  PaymentMethodType,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { MobilePaymentMethodDisplay } from "@/frontend/mobile/components/ui/display/paymentMethod/paymentMethodDisplay.mobile";

const meta: Meta<typeof MobilePaymentMethodDisplay> = {
  title: "UI/PaymentMethodDisplay/Mobile",
  component: MobilePaymentMethodDisplay,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile",
      viewports: {
        mobile: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
        mobileLarge: {
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
type Story = StoryObj<typeof MobilePaymentMethodDisplay>;

export const MobileWallet: Story = {
  render: () => (
    <Box sx={{ width: "100%", p: 2 }}>
      <MobilePaymentMethodDisplay
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
    <Box sx={{ width: "100%", p: 2 }}>
      <MobilePaymentMethodDisplay
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
    <Box sx={{ width: "100%", p: 2 }}>
      <MobilePaymentMethodDisplay
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
    <Stack spacing={2} sx={{ width: "100%", p: 2 }}>
      <MobilePaymentMethodDisplay
        method={{
          type: PaymentMethodType.MobileWallet,
          direction: PaymentDirection.Payin,
          catalogSlug: "vodafone-cash",
          details: { phone: "+201012345678" },
        }}
      />
      <MobilePaymentMethodDisplay
        method={{
          type: PaymentMethodType.OnlineAccount,
          direction: PaymentDirection.Payout,
          catalogSlug: "wise",
          details: { identifier: "ahmed@example.com" },
        }}
      />
      <MobilePaymentMethodDisplay
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
    <Box sx={{ width: "100%", p: 2 }}>
      <MobilePaymentMethodDisplay
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
