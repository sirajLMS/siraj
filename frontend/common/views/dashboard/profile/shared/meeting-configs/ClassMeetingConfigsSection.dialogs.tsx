"use client";

import { ErrorState, SectionPanel } from "@/frontend/common/components/ui";
import { FormErrorSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import type { ClassMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  createClassMeetingConfigMutationDocument,
  updateClassMeetingConfigMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { ClassMeetingConfigFormDialog } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigFormDialog";
import { MeetingConfigDeleteDialog } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigDeleteDialog";
import type { MeetingConfigManagerLabels } from "@/shared/locale/types/ui";

export function ErrorSection({
  title,
  subtitle,
  errorMessage,
  retryLabel,
  onRetry,
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly errorMessage: string;
  readonly retryLabel: string;
  readonly onRetry: () => void;
}) {
  return (
    <SectionPanel title={title} subTitle={subtitle}>
      <ErrorState embedded message={errorMessage} retryLabel={retryLabel} onRetry={onRetry} />
    </SectionPanel>
  );
}

export function ClassMeetingConfigDialogs({
  resolvedCanManage,
  formOpen,
  editConfig,
  deleteId,
  deleteLabel,
  deleting,
  showSuccess,
  errorMessage,
  classInstanceId,
  recurringScheduleId,
  configsCount,
  tManager,
  setFormOpen,
  setEditConfig,
  setDeleteId,
  setShowSuccess,
  setErrorMessage,
  refetch,
  handleDelete,
}: {
  readonly resolvedCanManage: boolean;
  readonly formOpen: boolean;
  readonly editConfig: ClassMeetingConfigFieldsFragment | null;
  readonly deleteId: string | null;
  readonly deleteLabel: string;
  readonly deleting: boolean;
  readonly showSuccess: boolean;
  readonly errorMessage: string | null;
  readonly classInstanceId?: string;
  readonly recurringScheduleId?: string;
  readonly configsCount: number;
  readonly tManager: MeetingConfigManagerLabels;
  readonly setFormOpen: (open: boolean) => void;
  readonly setEditConfig: (config: ClassMeetingConfigFieldsFragment | null) => void;
  readonly setDeleteId: (id: string | null) => void;
  readonly setShowSuccess: (show: boolean) => void;
  readonly setErrorMessage: (msg: string | null) => void;
  readonly refetch: () => Promise<unknown>;
  readonly handleDelete: () => Promise<void>;
}) {
  return (
    <>
      {resolvedCanManage ? (
        <ClassMeetingConfigFormDialog
          open={formOpen}
          classInstanceId={classInstanceId}
          recurringScheduleId={recurringScheduleId}
          editConfig={editConfig}
          existingCount={configsCount}
          labels={tManager}
          createMutation={createClassMeetingConfigMutationDocument}
          updateMutation={updateClassMeetingConfigMutationDocument}
          onClose={() => {
            setFormOpen(false);
            setEditConfig(null);
          }}
          onSaved={async () => {
            setShowSuccess(true);
            await refetch();
          }}
        />
      ) : null}

      <MeetingConfigDeleteDialog
        open={deleteId != null}
        configLabel={deleteLabel}
        isLoading={deleting}
        labels={tManager}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />

      <FormSuccessSnackbar open={showSuccess} message={tManager.saved} onClose={() => setShowSuccess(false)} />
      <FormErrorSnackbar
        open={errorMessage != null}
        message={errorMessage ?? ""}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}
