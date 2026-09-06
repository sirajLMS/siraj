import { WhatsappMessageDirection } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappInboxLabels } from "@/shared/locale/types/whatsappInbox";

type DirectionLabelKey = "directionInbound" | "directionEcho" | "directionApiOutbound";

const DIRECTION_LABEL_KEYS: Record<WhatsappMessageDirection, DirectionLabelKey> = {
  [WhatsappMessageDirection.Inbound]: "directionInbound",
  [WhatsappMessageDirection.Echo]: "directionEcho",
  [WhatsappMessageDirection.ApiOutbound]: "directionApiOutbound",
};

/** Record-based direction → label lookup (no enum-comparison lint hazards). */
export function getWhatsappMessageDirectionLabel(
  labels: Pick<WhatsappInboxLabels, DirectionLabelKey>,
  direction: WhatsappMessageDirection | null
): string {
  if (direction === null) {
    return "";
  }
  const key = DIRECTION_LABEL_KEYS[direction];
  return key ? labels[key] : "";
}
