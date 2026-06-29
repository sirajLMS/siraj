import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useTranslations } from "next-intl";
import type {
  ClassCategoryCreateInput,
  ClassCategoryUpdateInput,
  ClassSubjectCreateInput,
  ClassSubjectUpdateInput,
} from "@/frontend/graphql/generated/gql/graphql-types";
import {
  createClassCategoryMutationDocument,
  deleteClassCategoryMutationDocument,
  updateClassCategoryMutationDocument,
} from "@/frontend/graphql/sharedDocuments/class-category.documents";
import {
  createClassSubjectMutationDocument,
  deleteClassSubjectMutationDocument,
  updateClassSubjectMutationDocument,
} from "@/frontend/graphql/sharedDocuments/class-subject.documents";
import { useSubjectManagementStore } from "@/frontend/stores/subjectManagementStore";
import { logger } from "@/frontend/utils/logger";
import { getErrorMessage } from "@/shared/utils/error";

interface UseSubjectMutationsOptions {
  refetchSubjects: () => Promise<unknown>;
  activeCategoryId: string | null;
  onCategoryReset: () => void;
}

export function useSubjectMutations(opts: UseSubjectMutationsOptions) {
  const t = useTranslations("dashboard.subjects");
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
  const [createCategoryMut, { loading: isCreatingCategory }] = useMutation(createClassCategoryMutationDocument);
  const [updateCategoryMut, { loading: isUpdatingCategory }] = useMutation(updateClassCategoryMutationDocument);
  const [deleteCategoryMut, { loading: isDeletingCategory }] = useMutation(deleteClassCategoryMutationDocument);

  const handleCreateSubject = async (input: ClassSubjectCreateInput) => {
    try {
      await createSubjectMut({ variables: { input } });
      showSuccess(t("subjectCreated"));
      closeCreateDialog();
      await opts.refetchSubjects();
    } catch (err) {
      logger.error("Failed to create subject", err);
      showError(getErrorMessage(err));
    }
  };

  const handleUpdateSubject = async (id: string, input: ClassSubjectUpdateInput) => {
    try {
      await updateSubjectMut({ variables: { id, input } });
      showSuccess(t("subjectUpdated"));
      closeEditDialog();
      await opts.refetchSubjects();
    } catch (err) {
      logger.error("Failed to update subject", err);
      showError(getErrorMessage(err));
    }
  };

  const handleDeleteSubject = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteSubjectMut({ variables: { id: pendingDeleteId } });
      showSuccess(t("subjectDeleted"));
      closeDeleteDialog();
      await opts.refetchSubjects();
    } catch (err) {
      logger.error("Failed to delete subject", err);
      showError(getErrorMessage(err));
    }
  };

  const handleCreateCategory = async (input: ClassCategoryCreateInput) => {
    try {
      await createCategoryMut({ variables: { input } });
      showSuccess(t("categoryCreated"));
      closeCreateDialog();
    } catch (err) {
      logger.error("Failed to create category", err);
      showError(getErrorMessage(err));
    }
  };

  const handleUpdateCategory = async (id: string, input: ClassCategoryUpdateInput) => {
    try {
      await updateCategoryMut({ variables: { id, input } });
      showSuccess(t("categoryUpdated"));
      closeEditDialog();
    } catch (err) {
      logger.error("Failed to update category", err);
      showError(getErrorMessage(err));
    }
  };

  const handleDeleteCategory = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteCategoryMut({ variables: { id: pendingDeleteId } });
      showSuccess(t("categoryDeleted"));
      closeDeleteDialog();
      if (opts.activeCategoryId === pendingDeleteId) {
        opts.onCategoryReset();
      }
      await opts.refetchSubjects();
    } catch (err) {
      logger.error("Failed to delete category", err);
      showError(getErrorMessage(err));
    }
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
