import { CombinedGraphQLErrors } from "@apollo/client";

export function getGraphQLErrorCode(error: unknown): string | undefined {
  if (!CombinedGraphQLErrors.is(error)) return undefined;
  const code: unknown = error.errors[0]?.extensions?.code;
  return typeof code === "string" ? code : undefined;
}

/** Service-level domain errors arrive already localized; surface them directly when present. */
export function getGraphQLErrorMessage(error: unknown): string | null {
  if (CombinedGraphQLErrors.is(error)) return error.errors[0]?.message ?? null;
  if (error instanceof Error && error.message !== "") return error.message;
  return null;
}
