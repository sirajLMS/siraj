"use client";

import { NoWhatsappAccountsEmptyState } from "@/frontend/common/views/dashboard/whatsapp/__shared__";

/**
 * Empty-state content when the tenant has no connected WhatsApp numbers —
 * no group list, creation, or sync can function without one. Renders only the
 * icon and copy block; the consuming desktop view owns the panel chrome.
 */
export function NoWhatsappGroupsAccountsState({ labels }: Readonly<{ labels: string }>) {
  return <NoWhatsappAccountsEmptyState title={labels} />;
}
