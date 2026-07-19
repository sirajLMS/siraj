import { Box, Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
import { PaymentMethodOptionRowDesktop } from "@/frontend/desktop/components/ui/input/paymentMethodSelect/paymentMethodOptionRow.desktop";

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

const meta: Meta<typeof PaymentMethodOptionRowDesktop> = {
  title: "UI/PaymentMethodOptionRow/Desktop",
  component: PaymentMethodOptionRowDesktop,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof PaymentMethodOptionRowDesktop>;

export const Default: Story = {
  render: () => (
    <Box sx={{ width: 400, p: 2 }}>
      <Stack spacing={1}>
        {MOCK_OPTIONS.map(option => (
          <PaymentMethodOptionRowDesktop key={option.id} option={option} type={PaymentMethodType.MobileWallet} />
        ))}
      </Stack>
    </Box>
  ),
};

export const WithoutSlug: Story = {
  render: () => (
    <Box sx={{ width: 400, p: 2 }}>
      <Stack spacing={1}>
        {MOCK_OPTIONS.map(option => (
          <PaymentMethodOptionRowDesktop
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
    <Box sx={{ width: 400, p: 2 }}>
      <Stack spacing={1}>
        <PaymentMethodOptionRowDesktop option={MOCK_OPTIONS[0]} type={PaymentMethodType.MobileWallet} />
        <PaymentMethodOptionRowDesktop option={MOCK_OPTIONS[1]} type={PaymentMethodType.PaymentLink} />
        <PaymentMethodOptionRowDesktop option={MOCK_OPTIONS[2]} type={PaymentMethodType.BankTransfer} />
      </Stack>
    </Box>
  ),
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  render: () => (
    <Box sx={{ width: 400, p: 2 }}>
      <Stack spacing={1}>
        {MOCK_OPTIONS.map(option => (
          <PaymentMethodOptionRowDesktop
            key={option.id}
            option={{ ...option, displayName: "فودافون كاش" }}
            type={PaymentMethodType.MobileWallet}
          />
        ))}
      </Stack>
    </Box>
  ),
};
