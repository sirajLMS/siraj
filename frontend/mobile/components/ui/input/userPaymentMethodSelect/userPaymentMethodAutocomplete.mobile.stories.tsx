import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { PaymentDirection, PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { UserPaymentMethodFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import {
  UserPaymentMethodAutocompleteMobile,
  type UserPaymentMethodAutocompleteProps,
} from "@/frontend/mobile/components/ui/input/userPaymentMethodSelect/userPaymentMethodAutocomplete.mobile";

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

function UserPaymentMethodAutocompleteStory({
  initialValue = mockMethods[0] ?? null,
  ...props
}: Readonly<
  Partial<Omit<UserPaymentMethodAutocompleteProps, "value" | "onChangeAction" | "options">> & {
    initialValue?: UserPaymentMethodFieldsFragment | null;
  }
>) {
  const [value, setValue] = useState<UserPaymentMethodFieldsFragment | null>(initialValue);

  return (
    <Box sx={{ width: "100%", maxWidth: 375, p: 2 }}>
      <UserPaymentMethodAutocompleteMobile
        value={value}
        options={mockMethods}
        onChangeAction={setValue}
        label="Pay-in method"
        fullWidth
        {...props}
      />
    </Box>
  );
}

const meta: Meta<typeof UserPaymentMethodAutocompleteStory> = {
  title: "UI/UserPaymentMethodAutocomplete/Mobile",
  component: UserPaymentMethodAutocompleteStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
};

export default meta;
type Story = StoryObj<typeof UserPaymentMethodAutocompleteStory>;

export const Default: Story = {
  args: {
    required: true,
  },
};

export const EmptyRequired: Story = {
  args: {
    initialValue: null,
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    required: true,
  },
};
