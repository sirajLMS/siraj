import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { PaymentMethodAutocompleteProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/types";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
import { PaymentMethodAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/paymentMethodSelect/paymentMethodAutocomplete.desktop";

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

function PaymentMethodAutocompleteStory({
  initialSlug,
  ...props
}: Readonly<Partial<PaymentMethodAutocompleteProps> & { initialSlug?: string }>) {
  const [option, setOption] = useState<PaymentMethodCatalogOption | null>(() => {
    if (!initialSlug) return null;
    return MOCK_OPTIONS.find(entry => entry.slug === initialSlug) ?? null;
  });

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <PaymentMethodAutocompleteDesktop
        option={option}
        options={MOCK_OPTIONS}
        onChangeAction={setOption}
        type={PaymentMethodType.MobileWallet}
        fullWidth
        {...props}
      />
    </Box>
  );
}

const meta: Meta<typeof PaymentMethodAutocompleteStory> = {
  title: "UI/PaymentMethodAutocomplete/Desktop",
  component: PaymentMethodAutocompleteStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof PaymentMethodAutocompleteStory>;

export const Default: Story = {
  args: {
    initialSlug: "vodafone-cash",
  },
};

export const Open: Story = {
  args: {
    initialSlug: "vodafone-cash",
    open: true,
  },
};

export const Required: Story = {
  args: {
    required: true,
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    initialSlug: "paypal",
  },
};
