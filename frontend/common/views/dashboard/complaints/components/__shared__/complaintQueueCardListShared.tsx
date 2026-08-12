"use client";

import type { ReactNode } from "react";
import type { AdminComplaintRow } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import type { ComplaintsAdminLabels } from "@/shared/locale";

export interface ComplaintQueueCardListSharedProps {
  readonly rows: readonly AdminComplaintRow[];
  readonly labels: ComplaintsAdminLabels;
  readonly draftResponses: Readonly<Record<string, string>>;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onDraftChange: (id: string, text: string) => void;
  readonly onAnswer: (id: string, options: { readonly sendEmail: boolean }) => void;
  readonly onDelete: (id: string) => void;
  readonly onPageChange: (page: number) => void;
}

export interface ComplaintQueueCardListRenderCardProps {
  readonly row: AdminComplaintRow;
  readonly labels: ComplaintsAdminLabels;
  readonly draftResponse: string;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly onDraftChange: (text: string) => void;
  readonly onAnswer: (options: { readonly sendEmail: boolean }) => void;
  readonly onDelete: () => void;
}

export type ComplaintQueueCardRenderer = (props: ComplaintQueueCardListRenderCardProps) => ReactNode;

export function buildQueueCardProps(
  row: AdminComplaintRow,
  labels: ComplaintsAdminLabels,
  draftResponses: Readonly<Record<string, string>>,
  canManage: boolean,
  canDelete: boolean,
  onDraftChange: (id: string, text: string) => void,
  onAnswer: (id: string, options: { readonly sendEmail: boolean }) => void,
  onDelete: (id: string) => void
): ComplaintQueueCardListRenderCardProps {
  return {
    row,
    labels,
    draftResponse: draftResponses[row.id] ?? "",
    canManage,
    canDelete,
    onDraftChange: text => {
      onDraftChange(row.id, text);
    },
    onAnswer: options => {
      onAnswer(row.id, options);
    },
    onDelete: () => {
      onDelete(row.id);
    },
  };
}
