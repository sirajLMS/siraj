import type { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import type { useSubjectFormState } from "@/frontend/common/views/dashboard/subjects/home/hooks/useSubjectFormState";
import type {
  CategoryItem,
  CreateSubjectDialogProps,
  DeleteSubjectDialogProps,
  EditSubjectDialogProps,
  SubjectFormStateProps,
  SubjectItem,
  SubjectsDialogLabels,
} from "@/frontend/common/views/dashboard/subjects/home/types";
import type { useSubjectMutations } from "@/frontend/common/views/dashboard/subjects/home/useSubjectMutations";
import type { SubjectsLabels } from "@/shared/locale";

type SubjectFormState = ReturnType<typeof useSubjectFormState>;
type SubjectMutations = ReturnType<typeof useSubjectMutations>;

export interface SubjectManagementStoreForDialogs {
  readonly createSubjectDialogOpen: boolean;
  readonly editSubjectDialogOpen: boolean;
  readonly isDeleteDialogOpen: boolean;
  readonly dialogTarget: "subject" | "category" | null;
  readonly closeCreateDialog: () => void;
  readonly closeEditDialog: () => void;
  readonly closeDeleteDialog: () => void;
}

export interface BuildSubjectManagementDialogsParams {
  readonly store: SubjectManagementStoreForDialogs;
  readonly mutations: SubjectMutations;
  readonly categories: readonly CategoryItem[];
  readonly selectedSubject: SubjectItem | null;
  readonly pendingDeleteSubject: SubjectItem | null;
  readonly onUploadAvatar: ReturnType<typeof useAvatarUpload>["onUploadAvatar"];
  readonly createSubjectForm: SubjectFormState;
  readonly editSubjectForm: SubjectFormState;
  readonly labels: SubjectsDialogLabels;
  readonly shellLabels: SubjectsLabels;
}

export interface SubjectManagementDialogsResult {
  readonly createSubjectDialog: CreateSubjectDialogProps;
  readonly editSubjectDialog: EditSubjectDialogProps;
  readonly deleteSubjectDialog: DeleteSubjectDialogProps;
}

function toSubjectDialogFormBindings(form: SubjectFormState): SubjectFormStateProps {
  return {
    control: form.control,
    errors: form.errors,
    handleSubmit: form.handleSubmit,
    values: form.values,
    reset: form.reset,
  };
}

export function buildSubjectManagementDialogs(
  params: BuildSubjectManagementDialogsParams
): SubjectManagementDialogsResult {
  const {
    store,
    mutations,
    categories,
    selectedSubject,
    pendingDeleteSubject,
    onUploadAvatar,
    createSubjectForm,
    editSubjectForm,
    labels,
    shellLabels,
  } = params;

  return {
    createSubjectDialog: {
      open: store.createSubjectDialogOpen,
      onClose: store.closeCreateDialog,
      onSubmit: mutations.handleCreateSubject,
      categories,
      isLoading: mutations.isCreatingSubject,
      onUploadAvatar,
      form: toSubjectDialogFormBindings(createSubjectForm),
      labels,
    },
    editSubjectDialog: {
      open: store.editSubjectDialogOpen,
      onClose: store.closeEditDialog,
      onSubmit: mutations.handleUpdateSubject,
      subject: selectedSubject,
      categories,
      isLoading: mutations.isUpdatingSubject,
      onUploadAvatar,
      form: toSubjectDialogFormBindings(editSubjectForm),
      labels,
    },
    deleteSubjectDialog: {
      labels: {
        deleteSubject: shellLabels.deleteSubject,
        deleteSubjectConfirm: shellLabels.deleteSubjectConfirm,
        cancel: shellLabels.cancel,
      },
      open: store.isDeleteDialogOpen && store.dialogTarget === "subject",
      onClose: store.closeDeleteDialog,
      onConfirm: mutations.handleDeleteSubject,
      subjectName: pendingDeleteSubject?.name ?? "",
      isLoading: mutations.isDeletingSubject,
    },
  };
}
