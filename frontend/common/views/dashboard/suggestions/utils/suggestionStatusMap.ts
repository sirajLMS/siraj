import { SuggestionStatus } from "@/frontend/common/graphql/generated/gql/graphql";

export function mapStatusForBadge(status: SuggestionStatus): string {
  const mapping: Record<SuggestionStatus, string> = {
    [SuggestionStatus.Pending]: "pending",
    [SuggestionStatus.Reviewed]: "paid",
    [SuggestionStatus.Duplicate]: "overdue",
  };
  return mapping[status] ?? "pending";
}

export function statusLabelKey(status: SuggestionStatus): "pending" | "reviewed" | "duplicate" {
  if (status === SuggestionStatus.Reviewed) return "reviewed";
  if (status === SuggestionStatus.Duplicate) return "duplicate";
  return "pending";
}
