"use client";

import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  deactivateParentMutationDocument,
  profileByUserIdQueryDocument,
  reactivateParentMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { getGraphQLErrorMessage } from "@/frontend/common/utils/errorUtils";
import type { ParentAccountActionsLabels } from "@/frontend/common/views/dashboard/profile/core/types/profilePageClient.types";
import { Translation, useAppTranslation } from "@/shared/locale";

export type ParentAccountActionsProps = {
  readonly parentId: string;
  readonly targetUserId: string;
  readonly accountStatus: AccountStatus | null | undefined;
};

export interface ParentAccountActionsViewModel {
  readonly labels: ParentAccountActionsLabels;
  readonly dialogMode: "deactivate" | "reactivate" | null;
  readonly successMessage: string | null;
  readonly mutationError: string | null;
  readonly isActivated: boolean;
  readonly isLoading: boolean;
  readonly openDeactivateDialog: () => void;
  readonly openReactivateDialog: () => void;
  readonly closeDialog: () => void;
  readonly handleConfirm: () => void;
  readonly clearSuccessMessage: () => void;
  readonly clearMutationError: () => void;
}

export function useParentAccountActionsViewModel(
  props: Readonly<ParentAccountActionsProps>
): ParentAccountActionsViewModel {
  const { parentId, targetUserId, accountStatus } = props;
  const labels = useAppTranslation(Translation.Profile.Parent).actions;

  const [dialogMode, setDialogMode] = useState<"deactivate" | "reactivate" | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const refetchProfile = [{ query: profileByUserIdQueryDocument, variables: { userId: targetUserId } }];

  const [deactivateParent, { loading: deactivating }] = useMutation(deactivateParentMutationDocument, {
    refetchQueries: refetchProfile,
    onCompleted: () => {
      setDialogMode(null);
      setMutationError(null);
      setSuccessMessage(labels.deactivateSuccess);
    },
    onError: error => {
      setMutationError(getGraphQLErrorMessage(error, labels.deactivateAccount));
    },
  });

  const [reactivateParent, { loading: reactivating }] = useMutation(reactivateParentMutationDocument, {
    refetchQueries: refetchProfile,
    onCompleted: () => {
      setDialogMode(null);
      setMutationError(null);
      setSuccessMessage(labels.reactivateSuccess);
    },
    onError: error => {
      setMutationError(getGraphQLErrorMessage(error, labels.reactivateAccount));
    },
  });

  const isActivated = accountStatus !== AccountStatus.Deactivated;
  const isLoading = deactivating || reactivating;

  const handleConfirm = () => {
    setMutationError(null);
    if (dialogMode === "deactivate") {
      void deactivateParent({ variables: { parentId } });
      return;
    }
    if (dialogMode === "reactivate") {
      void reactivateParent({ variables: { parentId } });
    }
  };

  const closeDialog = () => {
    if (!isLoading) {
      setDialogMode(null);
      setMutationError(null);
    }
  };

  return {
    labels,
    dialogMode,
    successMessage,
    mutationError,
    isActivated,
    isLoading,
    openDeactivateDialog: () => setDialogMode("deactivate"),
    openReactivateDialog: () => setDialogMode("reactivate"),
    closeDialog,
    handleConfirm,
    clearSuccessMessage: () => setSuccessMessage(null),
    clearMutationError: () => setMutationError(null),
  };
}
