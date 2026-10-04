"use client";

import { useApolloClient } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { getGraphQLErrorMessage } from "@/frontend/common/utils/errorUtils";

interface BulkDeleteConfirmArgs {
  /** Dialog open flag; reopening resets the single-run guard. */
  readonly open: boolean;
  /** Rows targeted by the batch; their non-null ids are extracted here. */
  readonly rows: readonly { readonly id: string | null }[];
  /** Runs the batch mutation for the given ids; rejects on domain errors. */
  readonly run: (ids: string[]) => Promise<unknown>;
  /** Root list field evicted from the Apollo cache after the write. */
  readonly evictFieldName: string;
  /** Success toast copy, built from the deleted count. */
  readonly successMessage: (count: number) => string;
  readonly operationFailedLabel: string;
  /** Runs after a successful delete so the host can reset its selection state. */
  readonly onDone: () => void;
  readonly onClose: () => void;
}

interface BulkDeleteConfirm {
  /** Non-null ids of the targeted rows; the confirm dialog titles use the count. */
  readonly ids: string[];
  /** Runs the whole batch once per dialog open. */
  readonly confirm: () => void;
}

/**
 * Multi-row delete-confirmation runner: guards against double submits, applies
 * the batch mutation in one call, and rejects the whole run when any row is
 * already settled — the localized failure message is toasted and nothing is
 * deleted. On success the list-page field is evicted from the Apollo cache
 * (aggregates depend on every row), then the success toast fires.
 */
export function useBulkDeleteConfirm(args: Readonly<BulkDeleteConfirmArgs>): BulkDeleteConfirm {
  const { open, rows, run, evictFieldName, successMessage, operationFailedLabel, onDone, onClose } = args;
  const client = useApolloClient();
  const notifications = useNotifications();

  const ids = useMemo(() => rows.map(row => row.id).filter((id): id is string => id !== null), [rows]);

  const startedRef = useRef(false);
  useEffect(() => {
    if (open) startedRef.current = false;
  }, [open]);

  const confirm = useCallback(() => {
    const runOnce = async (): Promise<void> => {
      if (startedRef.current || ids.length === 0) return;
      startedRef.current = true;
      try {
        await run(ids);
      } catch (error: unknown) {
        startedRef.current = false;
        notifications.show(getGraphQLErrorMessage(error, operationFailedLabel), { severity: "error" });
        return;
      }
      client.cache.evict({ fieldName: evictFieldName });
      client.cache.gc();
      notifications.show(successMessage(ids.length), { severity: "success" });
      onDone();
      onClose();
    };
    void runOnce();
  }, [ids, run, evictFieldName, client, notifications, successMessage, operationFailedLabel, onDone, onClose]);

  return { ids, confirm };
}
