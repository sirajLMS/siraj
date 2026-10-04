import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
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
import {
  createCategoryMutationHandlers,
  createMutationRunner,
  createSubjectMutationHandlers,
} from "@/frontend/common/views/dashboard/subjects/home/useSubjectMutations.helpers";
import { Translation, useAppTranslation } from "@/shared/locale";

interface UseSubjectMutationsOptions {
  refetchSubjects: () => Promise<unknown>;
  activeCategoryId: string | null;
  onCategoryReset: () => void;
}

export function useSubjectMutations(opts: UseSubjectMutationsOptions) {
  const t = useAppTranslation(Translation.Dashboard.Subjects);
  const notifications = useNotifications();
  const closeCreateDialog = useSubjectManagementStore(state => state.closeCreateDialog);
  const closeEditDialog = useSubjectManagementStore(state => state.closeEditDialog);
  const closeDeleteDialog = useSubjectManagementStore(state => state.closeDeleteDialog);
  const pendingDeleteId = useSubjectManagementStore(state => state.pendingDeleteId);

  const showSuccess = (msg: string) => notifications.show(msg, { severity: "success", autoHideDuration: 3000 });
  const showError = (msg: string) => notifications.show(msg, { severity: "error", autoHideDuration: 4000 });
  const runMutation = createMutationRunner(showSuccess, showError);

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

  const subjectHandlers = createSubjectMutationHandlers({
    runMutation,
    labels: t,
    mutations: { create: createSubjectMut, update: updateSubjectMut, delete: deleteSubjectMut },
    closeCreateDialog,
    closeEditDialog,
    closeDeleteDialog,
    pendingDeleteId,
    refetchSubjects: opts.refetchSubjects,
  });
  const categoryHandlers = createCategoryMutationHandlers({
    runMutation,
    labels: t,
    mutations: { create: createCategoryMut, update: updateCategoryMut, delete: deleteCategoryMut },
    closeCreateDialog,
    closeEditDialog,
    closeDeleteDialog,
    pendingDeleteId,
    activeCategoryId: opts.activeCategoryId,
    onCategoryReset: opts.onCategoryReset,
    refetchSubjects: opts.refetchSubjects,
  });

  return {
    ...subjectHandlers,
    ...categoryHandlers,
    isCreatingSubject,
    isUpdatingSubject,
    isDeletingSubject,
    isCreatingCategory,
    isUpdatingCategory,
    isDeletingCategory,
  };
}
