"use client";

import type { AdminNoteInfo } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useViewport } from "@/frontend/common/hooks/useViewport";
import { AdminNoteCardDesktop } from "@/frontend/desktop/views/dashboard/classes/audit/adminNoteCard.desktop";
import { AdminNoteCardMobile } from "@/frontend/mobile/views/dashboard/classes/audit/adminNoteCard.mobile";

export interface AdminNoteCardProps {
  readonly note: AdminNoteInfo | null | undefined;
  readonly labels: {
    readonly title: string;
    readonly titleMobile: string;
    readonly lastUpdated: string;
    readonly update: string;
    readonly edit: string;
  };
  readonly onUpdate: () => void;
  readonly onEdit: () => void;
}

export function AdminNoteCard(props: Readonly<AdminNoteCardProps>) {
  const { isMobile } = useViewport();

  if (isMobile) {
    return <AdminNoteCardMobile {...props} />;
  }

  return <AdminNoteCardDesktop {...props} />;
}
