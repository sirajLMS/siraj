import { mapError } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.helpers";
import type { NoticeState } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.hooks";
import type { WhatsappGroupsLabels } from "@/shared/locale/types/whatsappGroups";

export type JoinRequestActionKind = "approve" | "reject";

export type JoinRequestMutate = (input: { groupId: string; joinRequestIds: string[] }) => Promise<unknown>;

const JOIN_REQUEST_ACTION_MESSAGES: Record<
  JoinRequestActionKind,
  { successKey: "approved" | "rejected"; logContext: string }
> = {
  approve: { successKey: "approved", logContext: "WhatsApp join request approve failed" },
  reject: { successKey: "rejected", logContext: "WhatsApp join request reject failed" },
};

interface JoinRequestActionDeps {
  readonly groupId: string;
  readonly labels: WhatsappGroupsLabels;
  readonly showNotice: NoticeState["showNotice"];
  readonly refetches: readonly (() => Promise<unknown>)[];
  readonly mutate: JoinRequestMutate;
  readonly setBusy: (requestId: string | null) => void;
}

/**
 * Marks the target join-request row busy, runs the approve/reject mutation,
 * shows the translated toast, refetches the affected queries, and clears the
 * busy marker once the chain settles.
 */
export function runJoinRequestAction(
  deps: JoinRequestActionDeps,
  kind: JoinRequestActionKind,
  requestId: string
): void {
  const action = JOIN_REQUEST_ACTION_MESSAGES[kind];
  deps.setBusy(requestId);
  void deps
    .mutate({ groupId: deps.groupId, joinRequestIds: [requestId] })
    .then(() => {
      deps.showNotice(deps.labels[action.successKey], "success");
      return Promise.all(deps.refetches.map(refetch => refetch()));
    })
    .catch((error: unknown) => {
      deps.showNotice(mapError(error, deps.labels.errorGeneric, action.logContext), "error");
    })
    .finally(() => deps.setBusy(null));
}
