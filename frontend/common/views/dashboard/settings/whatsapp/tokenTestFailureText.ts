import { WhatsappTokenTestFailureKind } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappTokenTestResult } from "@/frontend/common/stores/whatsappTokenTestStore";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/**
 * Renders the helper text for a failed access-token test. Meta's raw reason
 * (`result.reason`) is interpolated into a translated, actionable hint picked
 * via `failureKind`, so a Meta-side rejection is never confused with a Siraj
 * auth/permissions rejection (their English messages are near-identical).
 *
 * `failureKind` null means the mutation itself was rejected by our server
 * (auth/validation) and Meta was never asked.
 */
export function resolveTokenTestFailureText(labels: WhatsappLabels, result: WhatsappTokenTestResult): string | null {
  if (result.state !== "failed") {
    return null;
  }
  switch (result.failureKind) {
    case WhatsappTokenTestFailureKind.InvalidToken:
      return labels.tokenTestReasonInvalidToken(result.reason ?? "");
    case WhatsappTokenTestFailureKind.MetaPermissions:
      return labels.tokenTestReasonMetaPermissions(result.reason ?? "");
    case WhatsappTokenTestFailureKind.MetaError:
      return labels.tokenTestReasonMetaError(result.reason ?? "");
    case WhatsappTokenTestFailureKind.NotConnected:
      return labels.tokenTestReasonNotConnected(result.reason);
    case WhatsappTokenTestFailureKind.NetworkError:
      return labels.tokenTestReasonNetworkError(result.reason);
    case null:
      return labels.tokenTestReasonRequestRejected(result.reason);
    default:
      return labels.tokenTestReasonRequestRejected(result.reason);
  }
}
