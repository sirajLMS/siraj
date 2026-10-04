"use client";

import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import {
  requestSessionCancelMutationDocument,
  requestSessionDelayMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  SessionActionsActionButtons,
  SessionActionsLockedButtons,
} from "@/frontend/common/views/dashboard/scheduling/session-actions/SessionActions.buttons.parts";
import { SessionActionsCancelDialog } from "@/frontend/common/views/dashboard/scheduling/session-actions/SessionActions.cancelDialog.parts";
import { SessionActionsDelayDialog } from "@/frontend/common/views/dashboard/scheduling/session-actions/SessionActions.delayDialog.parts";
import { useAppTranslation } from "@/shared/locale/client/use-app-translation";
import { Translation } from "@/shared/locale/namespaces/translation";

interface SessionActionsProps {
  /** The class instance ID for this session. */
  readonly classInstanceId: string;
  /** Whether the session is within the time-lock window (disables actions). */
  readonly locked: boolean;
  /** Compact mode for mobile (icon-only buttons). */
  readonly compact?: boolean;
}

type DialogMode = "delay" | "cancel" | null;

export function SessionActions({ classInstanceId, locked, compact = false }: Readonly<SessionActionsProps>) {
  const labels = useAppTranslation(Translation.Dashboard.SelfServiceReschedule);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [error, setError] = useState<string | null>(null);

  const [submitDelay, { loading: delayLoading }] = useMutation(requestSessionDelayMutationDocument);
  const [submitCancel, { loading: cancelLoading }] = useMutation(requestSessionCancelMutationDocument);

  const executeMutation = async (mutate: () => Promise<unknown>) => {
    setError(null);
    try {
      await mutate();
      setDialogMode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleSubmitDelay = (proposedStartAt: string, reason: string) => {
    void executeMutation(() =>
      submitDelay({
        variables: { input: { classInstanceId, proposedStartAt, reason: reason || null } },
      })
    );
  };

  const handleSubmitCancel = (reason: string) => {
    void executeMutation(() =>
      submitCancel({
        variables: { input: { classInstanceId, reason: reason || null } },
      })
    );
  };

  const handleClose = () => {
    setDialogMode(null);
    setError(null);
  };

  if (locked) {
    return <SessionActionsLockedButtons compact={compact} labels={labels} />;
  }

  return (
    <>
      <SessionActionsActionButtons
        compact={compact}
        labels={labels}
        onOpenDelay={() => setDialogMode("delay")}
        onOpenCancel={() => setDialogMode("cancel")}
      />
      <SessionActionsDelayDialog
        open={dialogMode === "delay"}
        onClose={handleClose}
        onSubmit={handleSubmitDelay}
        submitting={delayLoading}
        error={error}
        labels={labels}
      />
      <SessionActionsCancelDialog
        open={dialogMode === "cancel"}
        onClose={handleClose}
        onSubmit={handleSubmitCancel}
        submitting={cancelLoading}
        error={error}
        labels={labels}
      />
    </>
  );
}
