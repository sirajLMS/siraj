import type { AppearanceDraftInput, AppearanceSettingsQuery } from "@/frontend/common/graphql/generated/gql/graphql";

/**
 * Stable GraphQL error code emitted by the backend `AppearanceConflictError`
 * (AC-33). Matched on Apollo `GraphQLError.extensions.code` to surface the
 * Reload/Overwrite dialog instead of a generic error toast.
 */
const APPEARANCE_CONFLICT_ERROR_CODE = "APPEARANCE_CONFLICT";

/**
 * Returns `true` if the given Apollo error contains at least one
 * `APPEARANCE_CONFLICT` GraphQL error (AC-33). The backend resolver wraps
 * `AppearanceConflictError` into a `GraphQLError` with this code via
 * `runAppearanceMutation` in `site-appearance-settings.pothos.ts`.
 */
export function isAppearanceConflictError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const graphQLErrors = (err as { graphQLErrors?: Array<{ extensions?: { code?: string } }> }).graphQLErrors;
  if (!Array.isArray(graphQLErrors)) return false;
  return graphQLErrors.some(e => e?.extensions?.code === APPEARANCE_CONFLICT_ERROR_CODE);
}

/**
 * Shape of the `draftFields` fragment returned by the `appearanceSettings`
 * query (all fields nullable per the codegen `avoidOptionals: true` config).
 * Same structural shape as {@link AppearanceDraftInput} but with nullable
 * scalars — the runtime check below narrows it back to the non-nullable
 * store input type without an unsafe `as` cast.
 */
type AppearanceDraftFragment = NonNullable<
  NonNullable<NonNullable<AppearanceSettingsQuery>["appearanceSettings"]>["draftFields"]
>;

/**
 * Coerces the nullable `draftFields` fragment returned by the
 * `appearanceSettings` query into a non-nullable {@link AppearanceDraftInput}
 * suitable for `loadFromServer`. Returns `null` when any required field is
 * missing (AC-33 — used by the conflict Reload path to reseed the store from
 * the server response without an unsafe `as` cast).
 *
 * The published `appearance_settings` row should always satisfy this invariant
 * (the repo writes non-null values on `publishDraft`), but the codegen output
 * types are conservatively nullable, so we check at runtime before handing the
 * value to `loadFromServer`.
 */
export function toAppearanceDraftInput(value: AppearanceDraftFragment | null | undefined): AppearanceDraftInput | null {
  if (!value) return null;
  const { colors } = value;
  const light = colors?.light;
  const dark = colors?.dark;
  if (!light || !dark) return null;
  if (!light.primaryMain || !light.secondaryMain) return null;
  if (!dark.primaryMain || !dark.secondaryMain) return null;
  if (!value.siteName || !value.siteTitle || !value.siteDescription || !value.defaultColorScheme) return null;
  return {
    colors: {
      light: { primaryMain: light.primaryMain, secondaryMain: light.secondaryMain },
      dark: { primaryMain: dark.primaryMain, secondaryMain: dark.secondaryMain },
    },
    logoUrl: value.logoUrl ?? null,
    siteName: value.siteName,
    siteTitle: value.siteTitle,
    siteDescription: value.siteDescription,
    defaultColorScheme: value.defaultColorScheme,
  };
}
