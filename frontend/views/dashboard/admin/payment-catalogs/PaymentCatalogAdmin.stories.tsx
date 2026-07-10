import type { Meta, StoryObj } from "@storybook/react";
import {
  AccountStatus,
  AppPermission,
  CurrencyCode,
  IdentifierKind,
  PaymentDirection,
} from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { PaymentCatalogAdminView } from "@/frontend/views/dashboard/admin/payment-catalogs/PaymentCatalogAdminView";

const mockMobileWallets = [
  {
    id: "wallet-1",
    slug: "vodafone-cash",
    name: { en: "Vodafone Cash", ar: "فودافون كاش" },
    description: null,
    instructions: null,
    countryCode: "EG",
    currencyCode: CurrencyCode.Egp,
    phoneRegion: "EG",
    supportedDirections: PaymentDirection.Both,
    logoUrl: null,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    __typename: "SupportedMobileWallet" as const,
  },
];

const mockPaymentLinks = [
  {
    id: "link-1",
    slug: "paypal",
    name: { en: "PayPal", ar: "باي بال" },
    description: null,
    instructions: null,
    urlAllowlist: ["paypal.com", "*.paypal.com"],
    urlExample: "https://paypal.me/example",
    supportedDirections: PaymentDirection.Payin,
    logoUrl: null,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    __typename: "SupportedPaymentLink" as const,
  },
];

const mockOnlineAccounts = [
  {
    id: "account-1",
    slug: "wise",
    name: { en: "Wise", ar: "وايز" },
    description: null,
    instructions: null,
    identifierKind: IdentifierKind.Email,
    identifierLabel: { en: "Wise email", ar: "بريد وايز" },
    supportedDirections: PaymentDirection.Payout,
    logoUrl: null,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    __typename: "SupportedOnlineAccount" as const,
  },
];

const baseArgs = {
  activeTab: "mobileWallet" as const,
  onTabChange: () => {},
  mobileWallets: mockMobileWallets,
  paymentLinks: mockPaymentLinks,
  onlineAccounts: mockOnlineAccounts,
  loading: false,
  onAdd: () => {},
  onEdit: () => {},
  onDelete: () => {},
};

const meta: Meta<typeof PaymentCatalogAdminView> = {
  title: "Views/dashboard/admin/payment-catalogs/PaymentCatalogAdminView",
  component: PaymentCatalogAdminView,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof PaymentCatalogAdminView>;

export const Default: Story = {
  args: baseArgs,
  decorators: [
    Story => {
      const perms = [AppPermission.PaymentMethodsManageCatalogs];
      useUserStore.setState({
        permissions: perms,
        user: {
          id: "mock-id",
          name: "Mock Admin",
          role: "Admin",
          avatarUrl: "",
          permissions: perms,
          notificationCount: 0,
          teacherId: null,
          parentId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
          email: "admin@example.com",
          phone: null,
          status: AccountStatus.Activated,
          displayCurrency: CurrencyCode.Usd,
          __typename: "User",
        },
      });
      return <Story />;
    },
  ],
};

export const PaymentLinksTab: Story = {
  args: { ...baseArgs, activeTab: "paymentLink" },
  decorators: Default.decorators,
};

export const OnlineAccountsTab: Story = {
  args: { ...baseArgs, activeTab: "onlineAccount" },
  decorators: Default.decorators,
};

export const Loading: Story = {
  args: { ...baseArgs, loading: true, mobileWallets: [], paymentLinks: [], onlineAccounts: [] },
  decorators: Default.decorators,
};
