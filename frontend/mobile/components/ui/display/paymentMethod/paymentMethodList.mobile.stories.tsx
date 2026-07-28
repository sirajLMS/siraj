import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import {
  CurrencyCode,
  PaymentDirection,
  PaymentMethodType,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { MobilePaymentMethodList } from "@/frontend/mobile/components/ui/display/paymentMethod/paymentMethodList.mobile";

const sampleMethods: readonly PaymentMethodRow[] = [
  {
    id: "pm-1",
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
  },
  {
    id: "pm-2",
    type: PaymentMethodType.BankTransfer,
    direction: PaymentDirection.Payout,
    label: "Primary payout",
    verifiedAt: null,
    isDefault: false,
    isActive: true,
    masked: true,
    details: {
      beneficiaryName: "Ahmed Hassan",
      bankName: "National Bank of Egypt",
      iban: "EG123456789012345678901234",
    },
  },
  {
    id: "pm-3",
    type: PaymentMethodType.PaymentLink,
    direction: PaymentDirection.Both,
    catalogName: { en: "PayPal" },
    catalogSlug: "paypal",
    isDefault: false,
    isActive: true,
    details: { url: "https://paypal.me/example" },
  },
];

const meta: Meta<typeof MobilePaymentMethodList> = {
  title: "UI/PaymentMethodList/Mobile",
  component: MobilePaymentMethodList,
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
  args: {
    methods: sampleMethods,
    title: "Payment methods",
  },
  decorators: [
    Story => (
      <Box sx={{ p: 2, maxWidth: 375 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MobilePaymentMethodList>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    methods: [],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    methods: [],
    emptyMessage: "No payment methods yet.",
  },
};

export const WithActions: Story = {
  args: {
    onEditAction: () => undefined,
    onDeleteAction: () => undefined,
    onSetDefaultAction: () => undefined,
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    title: "طرق الدفع",
  },
};
