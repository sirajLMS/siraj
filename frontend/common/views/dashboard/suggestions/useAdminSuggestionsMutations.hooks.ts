"use client";

import { useMutation } from "@apollo/client/react";
import {
  deleteSuggestionMutationDocument,
  markSuggestionDuplicateMutationDocument,
  markSuggestionReviewedMutationDocument,
  respondToSuggestionMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/suggestions/suggestion.documents";
import type { SuggestionsAdminLabels } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";

type SuggestionNotificationLabels = SuggestionsAdminLabels["notifications"];

export interface AdminSuggestionsMutationDeps {
  readonly notifySuccess: (msg: string) => void;
  readonly notifyError: (msg: string) => void;
  readonly notificationLabels: SuggestionNotificationLabels;
  readonly closeRespondDialog: () => void;
  readonly closeDuplicateDialog: () => void;
  readonly closeDeleteDialog: () => void;
  readonly setIsResponding: (value: boolean) => void;
  readonly setIsMarkingDuplicate: (value: boolean) => void;
  readonly setIsDeleting: (value: boolean) => void;
  readonly refetch: () => Promise<unknown>;
}

export function useAdminSuggestionsMutations(deps: AdminSuggestionsMutationDeps) {
  const {
    notifySuccess,
    notifyError,
    notificationLabels,
    closeRespondDialog,
    closeDuplicateDialog,
    closeDeleteDialog,
    setIsResponding,
    setIsMarkingDuplicate,
    setIsDeleting,
    refetch,
  } = deps;

  const [markReviewed] = useMutation(markSuggestionReviewedMutationDocument, {
    onCompleted: () => {
      notifySuccess(notificationLabels.markReviewedSuccess);
      void refetch();
    },
    onError: () => notifyError(notificationLabels.markReviewedError),
  });

  const [respondToSuggestion] = useMutation(respondToSuggestionMutationDocument, {
    onCompleted: () => {
      closeRespondDialog();
      setIsResponding(false);
      notifySuccess(notificationLabels.respondSuccess);
      void refetch();
    },
    onError: () => {
      setIsResponding(false);
      notifyError(notificationLabels.respondError);
    },
  });

  const [markDuplicate] = useMutation(markSuggestionDuplicateMutationDocument, {
    onCompleted: () => {
      closeDuplicateDialog();
      setIsMarkingDuplicate(false);
      notifySuccess(notificationLabels.markDuplicateSuccess);
      void refetch();
    },
    onError: () => {
      setIsMarkingDuplicate(false);
      notifyError(notificationLabels.markDuplicateError);
    },
  });

  const [deleteSuggestion] = useMutation(deleteSuggestionMutationDocument, {
    onCompleted: () => {
      closeDeleteDialog();
      setIsDeleting(false);
      notifySuccess(notificationLabels.deleteSuccess);
      void refetch();
    },
    onError: () => {
      setIsDeleting(false);
      notifyError(notificationLabels.deleteError);
    },
  });

  return { markReviewed, respondToSuggestion, markDuplicate, deleteSuggestion };
}
