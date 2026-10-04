import type {
  ClassCategoryCreateInput,
  ClassCategoryUpdateInput,
  ClassSubjectCreateInput,
  ClassSubjectUpdateInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import type { SubjectsLabels } from "@/shared/locale";
import { getErrorMessage } from "@/shared/utils/error";

type SubjectMutationLabels = Pick<SubjectsLabels, "subjectCreated" | "subjectUpdated" | "subjectDeleted">;
type CategoryMutationLabels = Pick<SubjectsLabels, "categoryCreated" | "categoryUpdated" | "categoryDeleted">;

interface MutationRunActions {
  close?: () => void;
  afterSuccess?: () => Promise<unknown>;
}

export type SubjectMutationRunner = <V>(
  mutationFn: (opts: { variables: V }) => Promise<unknown>,
  variables: V,
  successMsg: string,
  errorMsg: string,
  actions: MutationRunActions
) => Promise<void>;

export function createMutationRunner(
  showSuccess: (msg: string) => void,
  showError: (msg: string) => void
): SubjectMutationRunner {
  return async (mutationFn, variables, successMsg, errorMsg, actions) => {
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
}

interface SubjectMutationTargets {
  create: (opts: { variables: { input: ClassSubjectCreateInput } }) => Promise<unknown>;
  update: (opts: { variables: { id: string; input: ClassSubjectUpdateInput } }) => Promise<unknown>;
  delete: (opts: { variables: { id: string } }) => Promise<unknown>;
}

interface CategoryMutationTargets {
  create: (opts: { variables: { input: ClassCategoryCreateInput } }) => Promise<unknown>;
  update: (opts: { variables: { id: string; input: ClassCategoryUpdateInput } }) => Promise<unknown>;
  delete: (opts: { variables: { id: string } }) => Promise<unknown>;
}

export function createSubjectMutationHandlers(params: {
  readonly runMutation: SubjectMutationRunner;
  readonly labels: SubjectMutationLabels;
  readonly mutations: SubjectMutationTargets;
  readonly closeCreateDialog: () => void;
  readonly closeEditDialog: () => void;
  readonly closeDeleteDialog: () => void;
  readonly pendingDeleteId: string | null;
  readonly refetchSubjects: () => Promise<unknown>;
}) {
  const {
    runMutation,
    labels,
    mutations,
    closeCreateDialog,
    closeEditDialog,
    closeDeleteDialog,
    pendingDeleteId,
    refetchSubjects,
  } = params;
  const handleCreateSubject = async (input: ClassSubjectCreateInput) => {
    await runMutation(mutations.create, { input }, labels.subjectCreated, "Failed to create subject", {
      close: closeCreateDialog,
      afterSuccess: refetchSubjects,
    });
  };
  const handleUpdateSubject = async (id: string, input: ClassSubjectUpdateInput) => {
    await runMutation(mutations.update, { id, input }, labels.subjectUpdated, "Failed to update subject", {
      close: closeEditDialog,
      afterSuccess: refetchSubjects,
    });
  };
  const handleDeleteSubject = async () => {
    if (!pendingDeleteId) return;
    await runMutation(mutations.delete, { id: pendingDeleteId }, labels.subjectDeleted, "Failed to delete subject", {
      close: closeDeleteDialog,
      afterSuccess: refetchSubjects,
    });
  };
  return { handleCreateSubject, handleUpdateSubject, handleDeleteSubject };
}

export function createCategoryMutationHandlers(params: {
  readonly runMutation: SubjectMutationRunner;
  readonly labels: CategoryMutationLabels;
  readonly mutations: CategoryMutationTargets;
  readonly closeCreateDialog: () => void;
  readonly closeEditDialog: () => void;
  readonly closeDeleteDialog: () => void;
  readonly pendingDeleteId: string | null;
  readonly activeCategoryId: string | null;
  readonly onCategoryReset: () => void;
  readonly refetchSubjects: () => Promise<unknown>;
}) {
  const {
    runMutation,
    labels,
    mutations,
    closeCreateDialog,
    closeEditDialog,
    closeDeleteDialog,
    pendingDeleteId,
    activeCategoryId,
    onCategoryReset,
    refetchSubjects,
  } = params;
  const handleCreateCategory = async (input: ClassCategoryCreateInput) => {
    await runMutation(mutations.create, { input }, labels.categoryCreated, "Failed to create category", {
      close: closeCreateDialog,
    });
  };
  const handleUpdateCategory = async (id: string, input: ClassCategoryUpdateInput) => {
    await runMutation(mutations.update, { id, input }, labels.categoryUpdated, "Failed to update category", {
      close: closeEditDialog,
    });
  };
  const handleDeleteCategory = async () => {
    if (!pendingDeleteId) return;
    await runMutation(mutations.delete, { id: pendingDeleteId }, labels.categoryDeleted, "Failed to delete category", {
      close: closeDeleteDialog,
      afterSuccess: async () => {
        if (activeCategoryId === pendingDeleteId) {
          onCategoryReset();
        }
        await refetchSubjects();
      },
    });
  };
  return { handleCreateCategory, handleUpdateCategory, handleDeleteCategory };
}
