import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CreateUserPaymentMethodMutation,
  CreateUserPaymentMethodMutationVariables,
  DeactivateSupportedMobileWalletMutation,
  DeactivateSupportedMobileWalletMutationVariables,
  DeactivateSupportedOnlineAccountMutation,
  DeactivateSupportedOnlineAccountMutationVariables,
  DeactivateSupportedPaymentLinkMutation,
  DeactivateSupportedPaymentLinkMutationVariables,
  DeleteUserPaymentMethodMutation,
  DeleteUserPaymentMethodMutationVariables,
  SetDefaultUserPaymentMethodMutation,
  SetDefaultUserPaymentMethodMutationVariables,
  SupportedMobileWalletsQuery,
  SupportedMobileWalletsQueryVariables,
  SupportedOnlineAccountsQuery,
  SupportedOnlineAccountsQueryVariables,
  SupportedPaymentLinksQuery,
  SupportedPaymentLinksQueryVariables,
  UpdateUserPaymentMethodMutation,
  UpdateUserPaymentMethodMutationVariables,
  UserPaymentMethodQuery,
  UserPaymentMethodQueryVariables,
  UserPaymentMethodsQuery,
  UserPaymentMethodsQueryVariables,
  VerifyBankTransferPaymentMethodMutation,
  VerifyBankTransferPaymentMethodMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

const PAYMENT_METHOD_DETAILS_FIELDS = gql`
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
      id
      catalogId
      catalogSlug
      catalogName
    }
    snapshottedAt
  }
  ${PAYMENT_METHOD_DETAILS_FIELDS}
`;

const USER_PAYMENT_METHOD_FIELDS = gql`
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
  UserPaymentMethodsQuery,
  UserPaymentMethodsQueryVariables
> = gql`
  ${USER_PAYMENT_METHOD_FIELDS}
  query userPaymentMethods($userId: ID!, $direction: PaymentDirection) {
    userPaymentMethods(userId: $userId, direction: $direction) {
      ...UserPaymentMethodFields
    }
  }
`;

export const userPaymentMethodQueryDocument: TypedDocumentNode<
  UserPaymentMethodQuery,
  UserPaymentMethodQueryVariables
> = gql`
  ${USER_PAYMENT_METHOD_FIELDS}
  query userPaymentMethod($id: ID!) {
    userPaymentMethod(id: $id) {
      ...UserPaymentMethodFields
    }
  }
`;

export const supportedMobileWalletsQueryDocument: TypedDocumentNode<
  SupportedMobileWalletsQuery,
  SupportedMobileWalletsQueryVariables
> = gql`
  ${SUPPORTED_MOBILE_WALLET_FIELDS}
  query supportedMobileWallets($countryCode: CountryCode, $direction: PaymentDirection, $activeOnly: Boolean) {
    supportedMobileWallets(countryCode: $countryCode, direction: $direction, activeOnly: $activeOnly) {
      ...SupportedMobileWalletFields
    }
  }
`;

export const supportedPaymentLinksQueryDocument: TypedDocumentNode<
  SupportedPaymentLinksQuery,
  SupportedPaymentLinksQueryVariables
> = gql`
  ${SUPPORTED_PAYMENT_LINK_FIELDS}
  query supportedPaymentLinks($direction: PaymentDirection, $activeOnly: Boolean) {
    supportedPaymentLinks(direction: $direction, activeOnly: $activeOnly) {
      ...SupportedPaymentLinkFields
    }
  }
`;

export const supportedOnlineAccountsQueryDocument: TypedDocumentNode<
  SupportedOnlineAccountsQuery,
  SupportedOnlineAccountsQueryVariables
> = gql`
  ${SUPPORTED_ONLINE_ACCOUNT_FIELDS}
  query supportedOnlineAccounts($direction: PaymentDirection, $activeOnly: Boolean) {
    supportedOnlineAccounts(direction: $direction, activeOnly: $activeOnly) {
      ...SupportedOnlineAccountFields
    }
  }
`;

export const createUserPaymentMethodMutationDocument: TypedDocumentNode<
  CreateUserPaymentMethodMutation,
  CreateUserPaymentMethodMutationVariables
> = gql`
  ${USER_PAYMENT_METHOD_FIELDS}
  mutation createUserPaymentMethod($input: UserPaymentMethodCreateInput!) {
    createUserPaymentMethod(input: $input) {
      ...UserPaymentMethodFields
    }
  }
`;

export const updateUserPaymentMethodMutationDocument: TypedDocumentNode<
  UpdateUserPaymentMethodMutation,
  UpdateUserPaymentMethodMutationVariables
> = gql`
  ${USER_PAYMENT_METHOD_FIELDS}
  mutation updateUserPaymentMethod($id: ID!, $input: UserPaymentMethodUpdateInput!) {
    updateUserPaymentMethod(id: $id, input: $input) {
      ...UserPaymentMethodFields
    }
  }
`;

export const deleteUserPaymentMethodMutationDocument: TypedDocumentNode<
  DeleteUserPaymentMethodMutation,
  DeleteUserPaymentMethodMutationVariables
> = gql`
  mutation deleteUserPaymentMethod($id: ID!) {
    deleteUserPaymentMethod(id: $id)
  }
`;

export const setDefaultUserPaymentMethodMutationDocument: TypedDocumentNode<
  SetDefaultUserPaymentMethodMutation,
  SetDefaultUserPaymentMethodMutationVariables
> = gql`
  ${USER_PAYMENT_METHOD_FIELDS}
  mutation setDefaultUserPaymentMethod($id: ID!) {
    setDefaultUserPaymentMethod(id: $id) {
      ...UserPaymentMethodFields
    }
  }
`;

export const verifyBankTransferPaymentMethodMutationDocument: TypedDocumentNode<
  VerifyBankTransferPaymentMethodMutation,
  VerifyBankTransferPaymentMethodMutationVariables
> = gql`
  ${USER_PAYMENT_METHOD_FIELDS}
  mutation verifyBankTransferPaymentMethod($id: ID!) {
    verifyBankTransferPaymentMethod(id: $id) {
      ...UserPaymentMethodFields
    }
  }
`;

export const deactivateSupportedMobileWalletMutationDocument: TypedDocumentNode<
  DeactivateSupportedMobileWalletMutation,
  DeactivateSupportedMobileWalletMutationVariables
> = gql`
  ${SUPPORTED_MOBILE_WALLET_FIELDS}
  mutation deactivateSupportedMobileWallet($id: ID!) {
    deactivateSupportedMobileWallet(id: $id) {
      ...SupportedMobileWalletFields
    }
  }
`;

export const deactivateSupportedPaymentLinkMutationDocument: TypedDocumentNode<
  DeactivateSupportedPaymentLinkMutation,
  DeactivateSupportedPaymentLinkMutationVariables
> = gql`
  ${SUPPORTED_PAYMENT_LINK_FIELDS}
  mutation deactivateSupportedPaymentLink($id: ID!) {
    deactivateSupportedPaymentLink(id: $id) {
      ...SupportedPaymentLinkFields
    }
  }
`;

export const deactivateSupportedOnlineAccountMutationDocument: TypedDocumentNode<
  DeactivateSupportedOnlineAccountMutation,
  DeactivateSupportedOnlineAccountMutationVariables
> = gql`
  ${SUPPORTED_ONLINE_ACCOUNT_FIELDS}
  mutation deactivateSupportedOnlineAccount($id: ID!) {
    deactivateSupportedOnlineAccount(id: $id) {
      ...SupportedOnlineAccountFields
    }
  }
`;
