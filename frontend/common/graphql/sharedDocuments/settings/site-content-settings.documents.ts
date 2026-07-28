import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

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

export const siteContentEntriesQueryDocument: TypedDocumentNode<Operations.SiteContentEntriesQuery> = gql`
  ${SITE_CONTENT_ENTRY_FIELDS}
  query siteContentEntries {
    siteContentEntries {
      ...SiteContentEntryFields
    }
  }
`;

export const siteContentEntryQueryDocument: TypedDocumentNode<
  Operations.SiteContentEntryQuery,
  Types.QuerySiteContentEntryArgs
> = gql`
  ${SITE_CONTENT_ENTRY_FIELDS}
  query siteContentEntry($id: ID!) {
    siteContentEntry(id: $id) {
      ...SiteContentEntryFields
    }
  }
`;

export const upsertSiteContentMutationDocument: TypedDocumentNode<
  Operations.UpsertSiteContentMutation,
  Types.MutationUpsertSiteContentArgs
> = gql`
  ${SITE_CONTENT_ENTRY_FIELDS}
  mutation upsertSiteContent($input: SiteContentUpsertInput!) {
    upsertSiteContent(input: $input) {
      ...SiteContentEntryFields
    }
  }
`;

export const updateSiteContentPublishStateMutationDocument: TypedDocumentNode<
  Operations.UpdateSiteContentPublishStateMutation,
  Types.MutationUpdateSiteContentPublishStateArgs
> = gql`
  ${SITE_CONTENT_ENTRY_FIELDS}
  mutation updateSiteContentPublishState($id: ID!, $isPublished: Boolean!) {
    updateSiteContentPublishState(id: $id, isPublished: $isPublished) {
      ...SiteContentEntryFields
    }
  }
`;

export const deleteSiteContentMutationDocument: TypedDocumentNode<
  Operations.DeleteSiteContentMutation,
  Types.MutationDeleteSiteContentArgs
> = gql`
  mutation deleteSiteContent($id: ID!) {
    deleteSiteContent(id: $id)
  }
`;
