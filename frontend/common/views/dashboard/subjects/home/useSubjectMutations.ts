import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import type {
  ClassCategoryCreateInput,
  ClassCategoryUpdateInput,
  ClassSubjectCreateInput,
  ClassSubjectUpdateInput,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  classCategoriesQueryDocument,
  createClassCategoryMutationDocument,
  deleteClassCategoryMutationDocument,
  updateClassCategoryMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/classes/class-category.documents";
import {
  createClassSubjectMutationDocument,
  deleteClassSubjectMutationDocument,
  updateClassSubjectMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/classes/class-subject.documents";
import { useSubjectManagementStore } from "@/frontend/common/stores/subjectManagementStore";
import { logger } from "@/frontend/common/utils/logger";
import { useAppTranslation } from "@/shared/locale";
import { getErrorMessage } from "@/shared/utils/error";

interface UseSubjectMutationsOptions {
  refetchSubjects: () => Promise<unknown>;
  activeCategoryId: string | null;
  onCategoryReset: () => void;
}

export function useSubjectMutations(opts: UseSubjectMutationsOptions) {
  const t = useAppTranslation().dashboardTranslations.subjects;
  const notifications = useNotifications();
  const closeCreateDialog = useSubjectManagementStore(state => state.closeCreateDialog);
  const closeEditDialog = useSubjectManagementStore(state => state.closeEditDialog);
  const closeDeleteDialog = useSubjectManagementStore(state => state.closeDeleteDialog);
  const pendingDeleteId = useSubjectManagementStore(state => state.pendingDeleteId);

  const showSuccess = (msg: string) => notifications.show(msg, { severity: "success", autoHideDuration: 3000 });
  const showError = (msg: string) => notifications.show(msg, { severity: "error", autoHideDuration: 4000 });

  const [createSubjectMut, { loading: isCreatingSubject }] = useMutation(createClassSubjectMutationDocument);
  const [updateSubjectMut, { loading: isUpdatingSubject }] = useMutation(updateClassSubjectMutationDocument);
  const [deleteSubjectMut, { loading: isDeletingSubject }] = useMutation(deleteClassSubjectMutationDocument);
  const [createCategoryMut, { loading: isCreatingCategory }] = useMutation(createClassCategoryMutationDocument, {
    refetchQueries: [classCategoriesQueryDocument],
  });
  const [updateCategoryMut, { loading: isUpdatingCategory }] = useMutation(updateClassCategoryMutationDocument, {
    refetchQueries: [classCategoriesQueryDocument],
  });
  const [deleteCategoryMut, { loading: isDeletingCategory }] = useMutation(deleteClassCategoryMutationDocument, {
    refetchQueries: [classCategoriesQueryDocument],
  });

  const runMutation = async <V>(
    mutationFn: (opts: { variables: V }) => Promise<unknown>,
    variables: V,
    successMsg: string,
    errorMsg: string,
    actions: { close?: () => void; afterSuccess?: () => Promise<unknown> }
  ) => {
    try {
      await mutationFn({ variables });
      showSuccess(successMsg);
      actions.close?.();
      await actions.afterSuccess?.();
    } catch (err) {
      logger.error(errorMsg, err);
      showError(getErrorMessage(err));
    }
  };

  const handleCreateSubject = async (input: ClassSubjectCreateInput) => {
    await runMutation(createSubjectMut, { input }, t.subjectCreated, "Failed to create subject", {
      close: closeCreateDialog,
      afterSuccess: opts.refetchSubjects,
    });
  };

  const handleUpdateSubject = async (id: string, input: ClassSubjectUpdateInput) => {
    await runMutation(updateSubjectMut, { id, input }, t.subjectUpdated, "Failed to update subject", {
      close: closeEditDialog,
      afterSuccess: opts.refetchSubjects,
    });
  };

  const handleDeleteSubject = async () => {
    if (!pendingDeleteId) return;
    await runMutation(deleteSubjectMut, { id: pendingDeleteId }, t.subjectDeleted, "Failed to delete subject", {
      close: closeDeleteDialog,
      afterSuccess: opts.refetchSubjects,
    });
  };

  const handleCreateCategory = async (input: ClassCategoryCreateInput) => {
    await runMutation(createCategoryMut, { input }, t.categoryCreated, "Failed to create category", {
      close: closeCreateDialog,
    });
  };

  const handleUpdateCategory = async (id: string, input: ClassCategoryUpdateInput) => {
    await runMutation(updateCategoryMut, { id, input }, t.categoryUpdated, "Failed to update category", {
      close: closeEditDialog,
    });
  };

  const handleDeleteCategory = async () => {
    if (!pendingDeleteId) return;
    await runMutation(deleteCategoryMut, { id: pendingDeleteId }, t.categoryDeleted, "Failed to delete category", {
      close: closeDeleteDialog,
      afterSuccess: async () => {
        if (opts.activeCategoryId === pendingDeleteId) {
          opts.onCategoryReset();
        }
        await opts.refetchSubjects();
      },
    });
  };

  return {
    handleCreateSubject,
    handleUpdateSubject,
    handleDeleteSubject,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    isCreatingSubject,
    isUpdatingSubject,
    isDeletingSubject,
    isCreatingCategory,
    isUpdatingCategory,
    isDeletingCategory,
  };
}
