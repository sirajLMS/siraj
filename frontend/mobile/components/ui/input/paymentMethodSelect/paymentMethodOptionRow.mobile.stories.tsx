import { Box, Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { PaymentMethodOptionRowMobile } from "@/frontend/mobile/components/ui/input/paymentMethodSelect/paymentMethodOptionRow.mobile";

const MOCK_OPTIONS: readonly PaymentMethodCatalogOption[] = [
  {
    id: "wallet-vodafone",
    slug: "vodafone-cash",
    displayName: "Vodafone Cash",
    logoUrl: null,
  },
  {
    id: "link-paypal",
    slug: "paypal",
    displayName: "PayPal",
    logoUrl: "https://cdn.simpleicons.org/paypal/00457C",
  },
  {
    id: "link-wise",
    slug: "wise",
    displayName: "Wise",
    logoUrl: null,
  },
];

const meta: Meta<typeof PaymentMethodOptionRowMobile> = {
  title: "UI/PaymentMethodOptionRow/Mobile",
  component: PaymentMethodOptionRowMobile,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
};

export default meta;
type Story = StoryObj<typeof PaymentMethodOptionRowMobile>;

export const Default: Story = {
  render: () => (
    <Box sx={{ width: "100%", maxWidth: 375, p: 2 }}>
      <Stack spacing={1}>
        {MOCK_OPTIONS.map(option => (
          <PaymentMethodOptionRowMobile key={option.id} option={option} type={PaymentMethodType.MobileWallet} />
        ))}
      </Stack>
    </Box>
  ),
};

export const WithoutSlug: Story = {
  render: () => (
    <Box sx={{ width: "100%", maxWidth: 375, p: 2 }}>
      <Stack spacing={1}>
        {MOCK_OPTIONS.map(option => (
          <PaymentMethodOptionRowMobile
            key={option.id}
            option={option}
            type={PaymentMethodType.PaymentLink}
            showSlug={false}
          />
        ))}
      </Stack>
    </Box>
  ),
};

export const MixedTypes: Story = {
  render: () => (
    <Box sx={{ width: "100%", maxWidth: 375, p: 2 }}>
      <Stack spacing={1}>
        <PaymentMethodOptionRowMobile option={MOCK_OPTIONS[0]} type={PaymentMethodType.MobileWallet} />
        <PaymentMethodOptionRowMobile option={MOCK_OPTIONS[1]} type={PaymentMethodType.PaymentLink} />
        <PaymentMethodOptionRowMobile option={MOCK_OPTIONS[2]} type={PaymentMethodType.BankTransfer} />
      </Stack>
    </Box>
  ),
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  render: () => (
    <Box sx={{ width: "100%", maxWidth: 375, p: 2 }}>
      <Stack spacing={1}>
        {MOCK_OPTIONS.map(option => (
          <PaymentMethodOptionRowMobile
            key={option.id}
            option={{ ...option, displayName: "فودافون كاش" }}
            type={PaymentMethodType.MobileWallet}
          />
        ))}
      </Stack>
    </Box>
  ),
};
