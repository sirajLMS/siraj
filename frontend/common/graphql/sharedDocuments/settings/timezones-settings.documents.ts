import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  SettingsTimezonesQuery,
  SettingsTimezonesQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

const SETTINGS_TIMEZONE_FIELDS = gql`
  fragment SettingsTimezoneFields on SettingsTimezone {
    id
    ianaId
    name
    baseOffsetMinutes
    offsetMinutes
    isDstSupported
  }
`;

export const settingsTimezonesQueryDocument: TypedDocumentNode<
  SettingsTimezonesQuery,
  SettingsTimezonesQueryVariables
> = gql`
  ${SETTINGS_TIMEZONE_FIELDS}
  query settingsTimezones($paginationArgs: PaginationArgs) {
    settingsTimezones(paginationArgs: $paginationArgs) {
      id
      totalCount
      rows {
        ...SettingsTimezoneFields
      }
      pageInfo {
        count
        currentPage
        endCursor
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        startCursor
        total
      }
    }
  }
`;
