import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { UserPaymentMethodSelect } from "@/frontend/common/components/ui/input/userPaymentMethodSelect";
import {
  PaymentDirection,
  PaymentMethodType,
  type UserPaymentMethodFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";

const mockMethods: UserPaymentMethodFieldsFragment[] = [
  {
    id: "pm-1",
    userId: "user-1",
    type: PaymentMethodType.Cash,
    direction: PaymentDirection.Payin,
    isDefault: true,
    label: "Front desk",
    details: {
      note: "Collect at reception",
      walletId: null,
      phone: null,
      paymentLinkId: null,
      url: null,
      onlineAccountId: null,
      identifier: null,
      iban: null,
      bankName: null,
      beneficiaryName: null,
      swiftBic: null,
      accountNumber: null,
      routingNumber: null,
    },
    verifiedAt: null,
    verifiedByUserId: null,
    createdAt: null,
    updatedAt: null,
  },
  {
    id: "pm-2",
    userId: "user-1",
    type: PaymentMethodType.BankTransfer,
    direction: PaymentDirection.Payin,
    isDefault: false,
    label: "CIB account",
    details: {
      bankName: "CIB",
      iban: "EG12****7890",
      beneficiaryName: "Parent Name",
      walletId: null,
      phone: null,
      paymentLinkId: null,
      url: null,
      onlineAccountId: null,
      identifier: null,
      note: null,
      swiftBic: null,
      accountNumber: null,
      routingNumber: null,
    },
    verifiedAt: "2026-01-01T00:00:00.000Z",
    verifiedByUserId: "admin-1",
    createdAt: null,
    updatedAt: null,
  },
];

function SelectDemo() {
  const [value, setValue] = useState<UserPaymentMethodFieldsFragment | null>(mockMethods[0] ?? null);
  return (
    <UserPaymentMethodSelect
      value={value}
      options={mockMethods}
      setValueAction={setValue}
      label="Pay-in method"
      fullWidth
      required
    />
  );
}

const meta: Meta<typeof SelectDemo> = {
  title: "UI/Input/UserPaymentMethodSelect",
  component: SelectDemo,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SelectDemo>;

export const Default: Story = {};
