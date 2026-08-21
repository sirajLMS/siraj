import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  DeleteSiteContentMutation,
  DeleteSiteContentMutationVariables,
  SiteContentEntriesQuery,
  SiteContentEntryQuery,
  SiteContentEntryQueryVariables,
  UpdateSiteContentPublishStateMutation,
  UpdateSiteContentPublishStateMutationVariables,
  UpsertSiteContentMutation,
  UpsertSiteContentMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

const SITE_CONTENT_ENTRY_FIELDS = gql`
  fragment SiteContentEntryFields on SiteContentEntry {
    id
    slug
    title
    body
    contentType
    isPublished
    updatedByUserId
    createdAt
    updatedAt
  }
`;

export const siteContentEntriesQueryDocument: TypedDocumentNode<SiteContentEntriesQuery> = gql`
  ${SITE_CONTENT_ENTRY_FIELDS}
  query siteContentEntries {
    siteContentEntries {
      ...SiteContentEntryFields
    }
  }
`;

export const siteContentEntryQueryDocument: TypedDocumentNode<SiteContentEntryQuery, SiteContentEntryQueryVariables> =
  gql`
  ${SITE_CONTENT_ENTRY_FIELDS}
  query siteContentEntry($id: ID!) {
    siteContentEntry(id: $id) {
      ...SiteContentEntryFields
    }
  }
`;

export const upsertSiteContentMutationDocument: TypedDocumentNode<
  UpsertSiteContentMutation,
  UpsertSiteContentMutationVariables
> = gql`
  ${SITE_CONTENT_ENTRY_FIELDS}
  mutation upsertSiteContent($input: SiteContentUpsertInput!) {
    upsertSiteContent(input: $input) {
      ...SiteContentEntryFields
    }
  }
`;

export const updateSiteContentPublishStateMutationDocument: TypedDocumentNode<
  UpdateSiteContentPublishStateMutation,
  UpdateSiteContentPublishStateMutationVariables
> = gql`
  ${SITE_CONTENT_ENTRY_FIELDS}
  mutation updateSiteContentPublishState($id: ID!, $isPublished: Boolean!) {
    updateSiteContentPublishState(id: $id, isPublished: $isPublished) {
      ...SiteContentEntryFields
    }
  }
`;

export const deleteSiteContentMutationDocument: TypedDocumentNode<
  DeleteSiteContentMutation,
  DeleteSiteContentMutationVariables
> = gql`
  mutation deleteSiteContent($id: ID!) {
    deleteSiteContent(id: $id)
  }
`;
