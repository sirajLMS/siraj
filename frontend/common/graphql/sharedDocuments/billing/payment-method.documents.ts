import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const PAYMENT_METHOD_DETAILS_FIELDS = gql`
  fragment PaymentMethodDetailsFields on PaymentMethodDetails {
    walletId
    phone
    paymentLinkId
    url
    onlineAccountId
    identifier
    iban
    bankName
    beneficiaryName
    swiftBic
    accountNumber
    routingNumber
    note
  }
`;

export const PAYMENT_METHOD_TRANSACTION_SNAPSHOT_FIELDS = gql`
  fragment PaymentMethodTransactionSnapshotFields on PaymentMethodTransactionSnapshot {
    userPaymentMethodId
    type
    direction
    label
    details {
      ...PaymentMethodDetailsFields
    }
    catalog {
      catalogId
      catalogSlug
      catalogName
    }
    snapshottedAt
  }
  ${PAYMENT_METHOD_DETAILS_FIELDS}
`;

export const USER_PAYMENT_METHOD_FIELDS = gql`
  fragment UserPaymentMethodFields on UserPaymentMethod {
    id
    userId
    type
    direction
    isDefault
    label
    details {
      ...PaymentMethodDetailsFields
    }
    verifiedAt
    verifiedByUserId
    createdAt
    updatedAt
  }
  ${PAYMENT_METHOD_DETAILS_FIELDS}
`;

export const PAYMENT_METHOD_DEFAULTS_FIELDS = gql`
  fragment PaymentMethodDefaultsFields on PaymentMethodDefaults {
    payinDefault {
      ...UserPaymentMethodFields
    }
    payoutDefault {
      ...UserPaymentMethodFields
    }
  }
  ${USER_PAYMENT_METHOD_FIELDS}
`;

const SUPPORTED_MOBILE_WALLET_FIELDS = gql`
  fragment SupportedMobileWalletFields on SupportedMobileWallet {
    id
    slug
    name
    description
    instructions
    countryCode
    currencyCode
    phoneRegion
    supportedDirections
    logoUrl
    isActive
    createdAt
    updatedAt
  }
`;

const SUPPORTED_PAYMENT_LINK_FIELDS = gql`
  fragment SupportedPaymentLinkFields on SupportedPaymentLink {
    id
    slug
    name
    description
    instructions
    urlAllowlist
    urlExample
    supportedDirections
    logoUrl
    isActive
    createdAt
    updatedAt
  }
`;

const SUPPORTED_ONLINE_ACCOUNT_FIELDS = gql`
  fragment SupportedOnlineAccountFields on SupportedOnlineAccount {
    id
    slug
    name
    description
    instructions
    identifierKind
    identifierLabel
    supportedDirections
    logoUrl
    isActive
    createdAt
    updatedAt
  }
`;

export const userPaymentMethodsQueryDocument: TypedDocumentNode<
  Operations.UserPaymentMethodsQuery,
  Types.QueryUserPaymentMethodsArgs
> = gql`
  ${USER_PAYMENT_METHOD_FIELDS}
  query userPaymentMethods($userId: ID!, $direction: PaymentDirection) {
    userPaymentMethods(userId: $userId, direction: $direction) {
      ...UserPaymentMethodFields
    }
  }
`;

export const userPaymentMethodQueryDocument: TypedDocumentNode<
  Operations.UserPaymentMethodQuery,
  Types.QueryUserPaymentMethodArgs
> = gql`
  ${USER_PAYMENT_METHOD_FIELDS}
  query userPaymentMethod($id: ID!) {
    userPaymentMethod(id: $id) {
      ...UserPaymentMethodFields
    }
  }
`;

export const supportedMobileWalletsQueryDocument: TypedDocumentNode<
  Operations.SupportedMobileWalletsQuery,
  Types.QuerySupportedMobileWalletsArgs
> = gql`
  ${SUPPORTED_MOBILE_WALLET_FIELDS}
  query supportedMobileWallets($countryCode: CountryCode, $direction: PaymentDirection, $activeOnly: Boolean) {
    supportedMobileWallets(countryCode: $countryCode, direction: $direction, activeOnly: $activeOnly) {
      ...SupportedMobileWalletFields
    }
  }
`;

export const supportedPaymentLinksQueryDocument: TypedDocumentNode<
  Operations.SupportedPaymentLinksQuery,
  Types.QuerySupportedPaymentLinksArgs
> = gql`
  ${SUPPORTED_PAYMENT_LINK_FIELDS}
  query supportedPaymentLinks($direction: PaymentDirection, $activeOnly: Boolean) {
    supportedPaymentLinks(direction: $direction, activeOnly: $activeOnly) {
      ...SupportedPaymentLinkFields
    }
  }
`;

export const supportedOnlineAccountsQueryDocument: TypedDocumentNode<
  Operations.SupportedOnlineAccountsQuery,
  Types.QuerySupportedOnlineAccountsArgs
> = gql`
  ${SUPPORTED_ONLINE_ACCOUNT_FIELDS}
  query supportedOnlineAccounts($direction: PaymentDirection, $activeOnly: Boolean) {
    supportedOnlineAccounts(direction: $direction, activeOnly: $activeOnly) {
      ...SupportedOnlineAccountFields
    }
  }
`;

export const createUserPaymentMethodMutationDocument: TypedDocumentNode<
  Operations.CreateUserPaymentMethodMutation,
  Types.MutationCreateUserPaymentMethodArgs
> = gql`
  ${USER_PAYMENT_METHOD_FIELDS}
  mutation createUserPaymentMethod($input: UserPaymentMethodCreateInput!) {
    createUserPaymentMethod(input: $input) {
      ...UserPaymentMethodFields
    }
  }
`;

export const updateUserPaymentMethodMutationDocument: TypedDocumentNode<
  Operations.UpdateUserPaymentMethodMutation,
  Types.MutationUpdateUserPaymentMethodArgs
> = gql`
  ${USER_PAYMENT_METHOD_FIELDS}
  mutation updateUserPaymentMethod($id: ID!, $input: UserPaymentMethodUpdateInput!) {
    updateUserPaymentMethod(id: $id, input: $input) {
      ...UserPaymentMethodFields
    }
  }
`;

export const deleteUserPaymentMethodMutationDocument: TypedDocumentNode<
  Operations.DeleteUserPaymentMethodMutation,
  Types.MutationDeleteUserPaymentMethodArgs
> = gql`
  mutation deleteUserPaymentMethod($id: ID!) {
    deleteUserPaymentMethod(id: $id)
  }
`;

export const setDefaultUserPaymentMethodMutationDocument: TypedDocumentNode<
  Operations.SetDefaultUserPaymentMethodMutation,
  Types.MutationSetDefaultUserPaymentMethodArgs
> = gql`
  ${USER_PAYMENT_METHOD_FIELDS}
  mutation setDefaultUserPaymentMethod($id: ID!) {
    setDefaultUserPaymentMethod(id: $id) {
      ...UserPaymentMethodFields
    }
  }
`;

export const verifyBankTransferPaymentMethodMutationDocument: TypedDocumentNode<
  Operations.VerifyBankTransferPaymentMethodMutation,
  Types.MutationVerifyBankTransferPaymentMethodArgs
> = gql`
  ${USER_PAYMENT_METHOD_FIELDS}
  mutation verifyBankTransferPaymentMethod($id: ID!) {
    verifyBankTransferPaymentMethod(id: $id) {
      ...UserPaymentMethodFields
    }
  }
`;

export const createSupportedMobileWalletMutationDocument: TypedDocumentNode<
  Operations.CreateSupportedMobileWalletMutation,
  Types.MutationCreateSupportedMobileWalletArgs
> = gql`
  ${SUPPORTED_MOBILE_WALLET_FIELDS}
  mutation createSupportedMobileWallet($input: SupportedMobileWalletCreateInput!) {
    createSupportedMobileWallet(input: $input) {
      ...SupportedMobileWalletFields
    }
  }
`;

export const updateSupportedMobileWalletMutationDocument: TypedDocumentNode<
  Operations.UpdateSupportedMobileWalletMutation,
  Types.MutationUpdateSupportedMobileWalletArgs
> = gql`
  ${SUPPORTED_MOBILE_WALLET_FIELDS}
  mutation updateSupportedMobileWallet($id: ID!, $input: SupportedMobileWalletUpdateInput!) {
    updateSupportedMobileWallet(id: $id, input: $input) {
      ...SupportedMobileWalletFields
    }
  }
`;

export const deactivateSupportedMobileWalletMutationDocument: TypedDocumentNode<
  Operations.DeactivateSupportedMobileWalletMutation,
  Types.MutationDeactivateSupportedMobileWalletArgs
> = gql`
  ${SUPPORTED_MOBILE_WALLET_FIELDS}
  mutation deactivateSupportedMobileWallet($id: ID!) {
    deactivateSupportedMobileWallet(id: $id) {
      ...SupportedMobileWalletFields
    }
  }
`;

export const createSupportedPaymentLinkMutationDocument: TypedDocumentNode<
  Operations.CreateSupportedPaymentLinkMutation,
  Types.MutationCreateSupportedPaymentLinkArgs
> = gql`
  ${SUPPORTED_PAYMENT_LINK_FIELDS}
  mutation createSupportedPaymentLink($input: SupportedPaymentLinkCreateInput!) {
    createSupportedPaymentLink(input: $input) {
      ...SupportedPaymentLinkFields
    }
  }
`;

export const updateSupportedPaymentLinkMutationDocument: TypedDocumentNode<
  Operations.UpdateSupportedPaymentLinkMutation,
  Types.MutationUpdateSupportedPaymentLinkArgs
> = gql`
  ${SUPPORTED_PAYMENT_LINK_FIELDS}
  mutation updateSupportedPaymentLink($id: ID!, $input: SupportedPaymentLinkUpdateInput!) {
    updateSupportedPaymentLink(id: $id, input: $input) {
      ...SupportedPaymentLinkFields
    }
  }
`;

export const deactivateSupportedPaymentLinkMutationDocument: TypedDocumentNode<
  Operations.DeactivateSupportedPaymentLinkMutation,
  Types.MutationDeactivateSupportedPaymentLinkArgs
> = gql`
  ${SUPPORTED_PAYMENT_LINK_FIELDS}
  mutation deactivateSupportedPaymentLink($id: ID!) {
    deactivateSupportedPaymentLink(id: $id) {
      ...SupportedPaymentLinkFields
    }
  }
`;

export const createSupportedOnlineAccountMutationDocument: TypedDocumentNode<
  Operations.CreateSupportedOnlineAccountMutation,
  Types.MutationCreateSupportedOnlineAccountArgs
> = gql`
  ${SUPPORTED_ONLINE_ACCOUNT_FIELDS}
  mutation createSupportedOnlineAccount($input: SupportedOnlineAccountCreateInput!) {
    createSupportedOnlineAccount(input: $input) {
      ...SupportedOnlineAccountFields
    }
  }
`;

export const updateSupportedOnlineAccountMutationDocument: TypedDocumentNode<
  Operations.UpdateSupportedOnlineAccountMutation,
  Types.MutationUpdateSupportedOnlineAccountArgs
> = gql`
  ${SUPPORTED_ONLINE_ACCOUNT_FIELDS}
  mutation updateSupportedOnlineAccount($id: ID!, $input: SupportedOnlineAccountUpdateInput!) {
    updateSupportedOnlineAccount(id: $id, input: $input) {
      ...SupportedOnlineAccountFields
    }
  }
`;

export const deactivateSupportedOnlineAccountMutationDocument: TypedDocumentNode<
  Operations.DeactivateSupportedOnlineAccountMutation,
  Types.MutationDeactivateSupportedOnlineAccountArgs
> = gql`
  ${SUPPORTED_ONLINE_ACCOUNT_FIELDS}
  mutation deactivateSupportedOnlineAccount($id: ID!) {
    deactivateSupportedOnlineAccount(id: $id) {
      ...SupportedOnlineAccountFields
    }
  }
`;
