import { Box, Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
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
type Story = StoryObj<typeof PaymentMethodOptionRowMobile>;

export const Default: Story = {
  render: () => (
    <Box sx={{ width: "100%", maxWidth: 375, p: 2 }}>
      <Stack spacing={1}>
        {MOCK_OPTIONS.map(option => (
          <PaymentMethodOptionRowMobile
            key={option.id}
            option={option}
            type={PaymentMethodType.MobileWallet}
          />
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
