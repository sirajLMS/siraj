import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const SUPPORTED_CURRENCY_FIELDS = gql`
  fragment SupportedCurrencyFields on SupportedCurrency {
    code
    symbol
    countryCode
    decimals
    sortOrder
    isActive
  }
`;

export const supportedCurrenciesQueryDocument: TypedDocumentNode<Operations.SupportedCurrenciesQuery> = gql`
  ${SUPPORTED_CURRENCY_FIELDS}
  query SupportedCurrencies($activeOnly: Boolean) {
    supportedCurrencies(activeOnly: $activeOnly) {
      ...SupportedCurrencyFields
    }
  }
`;

export const activateSupportedCurrencyMutationDocument: TypedDocumentNode<
  Operations.ActivateSupportedCurrencyMutation,
  Operations.ActivateSupportedCurrencyMutationVariables
> = gql`
  ${SUPPORTED_CURRENCY_FIELDS}
  mutation ActivateSupportedCurrency($input: SupportedCurrencyUpsertInput!) {
    activateSupportedCurrency(input: $input) {
      ...SupportedCurrencyFields
    }
  }
`;

export const deactivateSupportedCurrencyMutationDocument: TypedDocumentNode<
  Operations.DeactivateSupportedCurrencyMutation,
  Operations.DeactivateSupportedCurrencyMutationVariables
> = gql`
  mutation DeactivateSupportedCurrency($code: CurrencyCode!) {
    deactivateSupportedCurrency(code: $code)
  }
`;
