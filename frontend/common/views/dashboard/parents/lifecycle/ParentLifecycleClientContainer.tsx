"use client";

import { useMutation } from "@apollo/client/react";
import { changeParentLifecycleStatusMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import { ParentLifecycleContainer } from "@/frontend/common/views/dashboard/parents/lifecycle/ParentLifecycleContainer";
import type { ParentLifecyclePageData } from "@/frontend/common/views/dashboard/parents/lifecycle/types";

export interface ParentLifecycleClientContainerProps {
  readonly parent: ParentLifecyclePageData;
}

/**
 * Wires the lifecycle mutation into {@link ParentLifecycleContainer}.
 *
 * The server-rendered page passes the parent data; this client container owns
 * the Apollo `useMutation` hook, forwarding `isUpdating` and a real
 * `onUpdateLifecycle` handler down to the container/view-model.
 */
export function ParentLifecycleClientContainer({ parent }: Readonly<ParentLifecycleClientContainerProps>) {
  const [runMutation, { loading: isUpdating }] = useMutation(changeParentLifecycleStatusMutationDocument);

  const onUpdateLifecycle = async (
    status: ParentLifecyclePageData["lifecycleStatus"],
    _reason: string
  ): Promise<void> => {
    try {
      await runMutation({
        variables: {
          parentId: parent.id,
          newStatus: status,
        },
      });
    } catch (error) {
      logger.error("Failed to update parent lifecycle status", { error });
      throw error;
    }
  };

  return <ParentLifecycleContainer parent={parent} isUpdating={isUpdating} onUpdateLifecycle={onUpdateLifecycle} />;
}
