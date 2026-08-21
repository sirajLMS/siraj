import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ActivateSupportedCurrencyMutation,
  ActivateSupportedCurrencyMutationVariables,
  DeactivateSupportedCurrencyMutation,
  DeactivateSupportedCurrencyMutationVariables,
  SupportedCurrenciesQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const SUPPORTED_CURRENCY_FIELDS = gql`
  fragment SupportedCurrencyFields on SupportedCurrency {
    id
    code
    symbol
    countryCode
    decimals
    sortOrder
    isActive
  }
`;

export const supportedCurrenciesQueryDocument: TypedDocumentNode<SupportedCurrenciesQuery> = gql`
  ${SUPPORTED_CURRENCY_FIELDS}
  query SupportedCurrencies($activeOnly: Boolean) {
    supportedCurrencies(activeOnly: $activeOnly) {
      ...SupportedCurrencyFields
    }
  }
`;

export const activateSupportedCurrencyMutationDocument: TypedDocumentNode<
  ActivateSupportedCurrencyMutation,
  ActivateSupportedCurrencyMutationVariables
> = gql`
  ${SUPPORTED_CURRENCY_FIELDS}
  mutation ActivateSupportedCurrency($input: SupportedCurrencyUpsertInput!) {
    activateSupportedCurrency(input: $input) {
      ...SupportedCurrencyFields
    }
  }
`;

export const deactivateSupportedCurrencyMutationDocument: TypedDocumentNode<
  DeactivateSupportedCurrencyMutation,
  DeactivateSupportedCurrencyMutationVariables
> = gql`
  mutation DeactivateSupportedCurrency($code: CurrencyCode!) {
    deactivateSupportedCurrency(code: $code)
  }
`;
