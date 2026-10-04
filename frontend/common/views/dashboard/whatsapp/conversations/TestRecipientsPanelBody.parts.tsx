"use client";

import { AddOutlined, PersonAddAlt1Outlined } from "@mui/icons-material";
import { Alert, Skeleton, Stack, Typography } from "@mui/material";
import { PrimaryPageAction } from "@/frontend/common/components/ui/button/ActionButtons";
import type { TestRecipientsPanelProps } from "@/frontend/common/views/dashboard/whatsapp/conversations/TestRecipientsPanel";
import { TestRecipientRow } from "@/frontend/common/views/dashboard/whatsapp/conversations/TestRecipientsRow.parts";

type TestRecipientsPanelActionProps = Pick<
  TestRecipientsPanelProps,
  "labels" | "canManage" | "limitReached" | "onOpenAdd"
>;

function TestRecipientsLoadingSkeletons() {
  return (
    <Stack spacing={1} aria-busy>
      <Skeleton variant="rounded" height={56} />
      <Skeleton variant="rounded" height={56} />
    </Stack>
  );
}

function TestRecipientsEmptyState({
  labels,
  canManage,
  limitReached,
  onOpenAdd,
}: Readonly<TestRecipientsPanelActionProps>) {
  return (
    <Stack spacing={1.25} sx={{ py: 5, alignItems: "center", textAlign: "center" }}>
      <PersonAddAlt1Outlined sx={{ fontSize: 36, color: theme => theme.palette.text.secondary }} />
      <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
        {labels.recipientsEmptyTitle}
      </Typography>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
        {labels.recipientsEmptyDescription}
      </Typography>
      {canManage && (
        <PrimaryPageAction size="small" startIcon={<AddOutlined />} onClick={onOpenAdd} disabled={limitReached}>
          {labels.recipientAdd}
        </PrimaryPageAction>
      )}
    </Stack>
  );
}

type TestRecipientsPanelBodyProps = Pick<
  TestRecipientsPanelProps,
  | "labels"
  | "canManage"
  | "rows"
  | "loading"
  | "limitReached"
  | "notice"
  | "verifyingRecipientId"
  | "onOpenAdd"
  | "onAskRemove"
  | "onVerify"
>;

export function TestRecipientsPanelBody({
  labels,
  canManage,
  rows,
  loading,
  limitReached,
  notice,
  verifyingRecipientId,
  onOpenAdd,
  onAskRemove,
  onVerify,
}: Readonly<TestRecipientsPanelBodyProps>) {
  if (loading) {
    return <TestRecipientsLoadingSkeletons />;
  }
  return (
    <>
      {notice !== null && notice !== "" && (
        <Alert severity="error" component="div" sx={{ mb: 1.5 }}>
          {notice}
        </Alert>
      )}
      {rows.length === 0 ? (
        <TestRecipientsEmptyState
          labels={labels}
          canManage={canManage}
          limitReached={limitReached}
          onOpenAdd={onOpenAdd}
        />
      ) : (
        rows.map(row => (
          <TestRecipientRow
            key={row.id}
            row={row}
            labels={labels}
            canManage={canManage}
            verifying={verifyingRecipientId === row.id}
            onAskRemove={onAskRemove}
            onVerify={onVerify}
          />
        ))
      )}
    </>
  );
}
