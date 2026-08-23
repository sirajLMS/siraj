import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  AppearanceSettingsQuery,
  AppearanceSettingsQueryVariables,
  PublishAppearanceMutation,
  PublishAppearanceMutationVariables,
  ResetAppearanceDraftMutation,
  SaveAppearanceDraftMutation,
  SaveAppearanceDraftMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

/**
 * Reusable selection of the nested `AppearanceFields` value bundle
 * (per-mode colors + scalar brand fields). Lives on the draft row and is
 * the same shape authors edit when composing a new draft.
 */
const APPEARANCE_FIELDS_FRAGMENT = gql`
  fragment AppearanceFieldsSelection on AppearanceFields {
    colors {
      light {
        primaryMain
        secondaryMain
      }
      dark {
        primaryMain
        secondaryMain
      }
    }
    logoUrl
    siteName
    siteTitle
    siteDescription
    defaultColorScheme
  }
`;

/**
 * Full selection of the `AppearanceSettings` row, including the live draft
 * bundle. `id` is included so Apollo Client can normalize and update the
 * cache in-place after `saveAppearanceDraft` / `publishAppearance` /
 * `resetAppearanceDraft` mutations return the entity.
 */
const APPEARANCE_SETTINGS_FIELDS_FRAGMENT = gql`
  ${APPEARANCE_FIELDS_FRAGMENT}
  fragment AppearanceSettingsFieldsSelection on AppearanceSettings {
    id
    primaryMain
    secondaryMain
    logoUrl
    siteName
    siteTitle
    siteDescription
    defaultColorScheme
    draftFields {
      ...AppearanceFieldsSelection
    }
    updatedByUserId
    updatedAt
    createdAt
  }
`;

/**
 * Read the single global appearance row.
 *
 * Pass `draft: true` to escalate the permission gate to
 * `SETTINGS_APPEARANCE_MANAGE` (the resolver returns the same row either
 * way — `draftFields` is always present — but the auth check differs).
 */
export const appearanceSettingsQueryDocument: TypedDocumentNode<
  AppearanceSettingsQuery,
  AppearanceSettingsQueryVariables
> = gql`
  ${APPEARANCE_SETTINGS_FIELDS_FRAGMENT}
  query appearanceSettings($draft: Boolean = false) {
    appearanceSettings(draft: $draft) {
      ...AppearanceSettingsFieldsSelection
    }
  }
`;

/**
 * Persist a new draft bundle (does NOT touch the published columns).
 * Returns the updated row so Apollo can update its cache directly.
 */
export const saveAppearanceDraftMutationDocument: TypedDocumentNode<
  SaveAppearanceDraftMutation,
  SaveAppearanceDraftMutationVariables
> = gql`
  ${APPEARANCE_SETTINGS_FIELDS_FRAGMENT}
  mutation saveAppearanceDraft($input: AppearanceDraftInput!, $expectedUpdatedAt: String) {
    saveAppearanceDraft(input: $input, expectedUpdatedAt: $expectedUpdatedAt) {
      ...AppearanceSettingsFieldsSelection
    }
  }
`;

/**
 * Copy `draft_fields` into the published columns + revalidate the
 * `"appearance"` cache tag + write an audit entry. Returns the row with
 * the now-matching published + draft state.
 */
export const publishAppearanceMutationDocument: TypedDocumentNode<
  PublishAppearanceMutation,
  PublishAppearanceMutationVariables
> = gql`
  ${APPEARANCE_SETTINGS_FIELDS_FRAGMENT}
  mutation publishAppearance($expectedUpdatedAt: String) {
    publishAppearance(expectedUpdatedAt: $expectedUpdatedAt) {
      ...AppearanceSettingsFieldsSelection
    }
  }
`;

/**
 * Reset `draft_fields` back to the current published values. Returns the
 * row with `draft_fields` matching the published columns.
 */
export const resetAppearanceDraftMutationDocument: TypedDocumentNode<ResetAppearanceDraftMutation> = gql`
  ${APPEARANCE_SETTINGS_FIELDS_FRAGMENT}
  mutation resetAppearanceDraft {
    resetAppearanceDraft {
      ...AppearanceSettingsFieldsSelection
    }
  }
`;
