import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
import type {
  PaymentMethodCatalogFormValue,
  PaymentMethodDetailsFormValue,
  PaymentMethodTypeFieldsProps,
} from "@/frontend/mobile/components/ui/input/paymentMethodTypeFields";
import { PaymentMethodTypeFieldsMobile } from "@/frontend/mobile/components/ui/input/paymentMethodTypeFields/paymentMethodTypeFields.mobile";

type StoryFormValues = {
  details: PaymentMethodDetailsFormValue;
  catalog: PaymentMethodCatalogFormValue;
};

const MOCK_WALLET_OPTIONS: readonly PaymentMethodCatalogOption[] = [
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
];

const MOCK_PAYMENT_LINK_OPTIONS: readonly PaymentMethodCatalogOption[] = [
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

const BANK_TRANSFER_DEFAULTS: StoryFormValues = {
  details: {
    beneficiaryName: "Ahmed Hassan",
    bankName: "Commercial International Bank",
    iban: "EG380019000500000000026246800",
    swiftBic: "CIBEEGCX",
    accountNumber: "00000026246800",
  },
  catalog: {},
};

const MOBILE_WALLET_DEFAULTS: StoryFormValues = {
  details: {
    walletId: "wallet-vodafone",
    phone: "+201012345678",
  },
  catalog: {},
};

const PAYMENT_LINK_CATALOG_DEFAULTS: StoryFormValues = {
  details: {
    paymentLinkId: "link-paypal",
    url: "https://paypal.me/example",
  },
  catalog: {
    name: { en: "PayPal Checkout" },
    description: { en: "Accept PayPal payments for invoices." },
    instructions: { en: "Send the payment link after confirming the amount." },
    urlAllowlist: ["paypal.me", "paypal.com"],
  },
};

function PaymentMethodTypeFieldsStory({
  type = PaymentMethodType.BankTransfer,
  defaultValues = BANK_TRANSFER_DEFAULTS,
  initialWallet = MOCK_WALLET_OPTIONS[0] ?? null,
  initialPaymentLink = MOCK_PAYMENT_LINK_OPTIONS[0] ?? null,
  ...props
}: Readonly<
  Partial<PaymentMethodTypeFieldsProps<StoryFormValues>> & {
    defaultValues?: StoryFormValues;
    initialWallet?: PaymentMethodCatalogOption | null;
    initialPaymentLink?: PaymentMethodCatalogOption | null;
  }
>) {
  const { control } = useForm<StoryFormValues>({ defaultValues });
  const [selectedWallet, setSelectedWallet] = useState<PaymentMethodCatalogOption | null>(initialWallet);
  const [selectedPaymentLink, setSelectedPaymentLink] = useState<PaymentMethodCatalogOption | null>(
    initialPaymentLink,
  );

  return (
    <Box sx={{ width: 375, p: 2 }}>
      <PaymentMethodTypeFieldsMobile
        type={type}
        control={control}
        detailsPrefix="details"
        catalogPrefix="catalog"
        walletOptions={MOCK_WALLET_OPTIONS}
        paymentLinkOptions={MOCK_PAYMENT_LINK_OPTIONS}
        selectedWallet={selectedWallet}
        selectedPaymentLink={selectedPaymentLink}
        onWalletChangeAction={setSelectedWallet}
        onPaymentLinkChangeAction={setSelectedPaymentLink}
        {...props}
      />
    </Box>
  );
}

const meta: Meta<typeof PaymentMethodTypeFieldsStory> = {
  title: "UI/PaymentMethodTypeFields/Mobile",
  component: PaymentMethodTypeFieldsStory,
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
type Story = StoryObj<typeof PaymentMethodTypeFieldsStory>;

export const Default: Story = {};

export const MobileWallet: Story = {
  args: {
    type: PaymentMethodType.MobileWallet,
    defaultValues: MOBILE_WALLET_DEFAULTS,
  },
};

export const WithCatalogMetadata: Story = {
  args: {
    type: PaymentMethodType.PaymentLink,
    defaultValues: PAYMENT_LINK_CATALOG_DEFAULTS,
    showCatalogMetadata: true,
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    type: PaymentMethodType.BankTransfer,
    defaultValues: BANK_TRANSFER_DEFAULTS,
  },
};
