import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

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
