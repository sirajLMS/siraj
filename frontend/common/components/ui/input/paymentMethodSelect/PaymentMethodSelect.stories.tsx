import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  PaymentMethodSelect,
  type PaymentMethodSelectProps,
} from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodSelect";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";

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
    <Box sx={{ width: 400, p: 2 }}>
      <PaymentMethodSelect
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
  title: "UI/Input/PaymentMethodSelect",
  component: PaymentMethodSelectStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof PaymentMethodSelectStory>;

export const Default: Story = {
  args: {
    initialSlug: "vodafone-cash",
  },
};

export const Empty: Story = {};

export const Required: Story = {
  args: {
    initialSlug: "paypal",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    initialSlug: "wise",
    disabled: true,
  },
};

export const FilteredSubset: Story = {
  args: {
    initialSlug: "vodafone-cash",
    allowedSlugs: ["vodafone-cash", "etisalat-cash"],
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
