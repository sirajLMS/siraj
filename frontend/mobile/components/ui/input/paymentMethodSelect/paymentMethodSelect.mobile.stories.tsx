import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { PaymentMethodSelectProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/types";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
import { PaymentMethodSelectMobile } from "@/frontend/mobile/components/ui/input/paymentMethodSelect/paymentMethodSelect.mobile";

const MOCK_OPTIONS: readonly PaymentMethodCatalogOption[] = [
  {
    id: "wallet-vodafone",
    slug: "vodafone-cash",
    displayName: "Vodafone Cash",
    logoUrl: null,
  },
  {
    id: "wallet-etisalat",
    slug: "etisalat-cash",
    displayName: "Etisalat Cash",
    logoUrl: null,
  },
  {
    id: "link-paypal",
    slug: "paypal",
    displayName: "PayPal",
    logoUrl: null,
  },
  {
    id: "link-wise",
    slug: "wise",
    displayName: "Wise",
    logoUrl: null,
  },
];

function PaymentMethodSelectStory({
  initialSlug,
  ...props
}: Readonly<Partial<PaymentMethodSelectProps> & { initialSlug?: string }>) {
  const [option, setOption] = useState<PaymentMethodCatalogOption | null>(() => {
    if (!initialSlug) return null;
    return MOCK_OPTIONS.find(entry => entry.slug === initialSlug) ?? null;
  });

  return (
    <Box sx={{ width: "100%", maxWidth: 375, p: 2 }}>
      <PaymentMethodSelectMobile
        option={option}
        options={MOCK_OPTIONS}
        setOptionAction={setOption}
        type={PaymentMethodType.MobileWallet}
        fullWidth
        {...props}
      />
    </Box>
  );
}

const meta: Meta<typeof PaymentMethodSelectStory> = {
  title: "UI/PaymentMethodSelect/Mobile",
  component: PaymentMethodSelectStory,
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
type Story = StoryObj<typeof PaymentMethodSelectStory>;

export const Default: Story = {
  args: {
    initialSlug: "vodafone-cash",
  },
};

export const Empty: Story = {};

export const Disabled: Story = {
  args: {
    initialSlug: "wise",
    disabled: true,
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    initialSlug: "vodafone-cash",
  },
};
