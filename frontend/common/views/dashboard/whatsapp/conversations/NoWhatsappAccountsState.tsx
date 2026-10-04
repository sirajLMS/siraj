"use client";

import { NoWhatsappAccountsEmptyState } from "@/frontend/common/views/dashboard/whatsapp/__shared__";
import type { WhatsappConversationShellLabels } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

/**
 * Empty-state content when the tenant has no connected WhatsApp numbers —
 * no list, composer, or registry can function without one. Renders only the
 * icon and copy block; the consuming desktop view owns the panel chrome.
 */
export function NoWhatsappAccountsState({
  labels,
}: Readonly<{ labels: Pick<WhatsappConversationShellLabels, "noAccountsTitle" | "noAccountsDescription"> }>) {
  return <NoWhatsappAccountsEmptyState title={labels.noAccountsTitle} description={labels.noAccountsDescription} />;
}
