"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { Button, Stack, Typography } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { ErrorState, SectionPanel } from "@/frontend/common/components/ui";
import { MeetingConfigList } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigList";
import { FormErrorSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  classMeetingConfigsQueryDocument,
  createClassMeetingConfigMutationDocument,
  deleteClassMeetingConfigMutationDocument,
  recurringMeetingConfigsQueryDocument,
  setDefaultClassMeetingConfigMutationDocument,
  updateClassMeetingConfigMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import type {
  ClassMeetingConfigFieldsFragment,
  EffectiveMeetingFieldsFragment,
} from "@/frontend/common/graphql/types/meeting-class-config.operations";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { ClassMeetingConfigFormDialog } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigFormDialog";
import { ClassMeetingContextBanner } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingContextBanner";
import { MeetingConfigDeleteDialog } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigDeleteDialog";
import { useMeetingConfigProfileLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigProfileLabels";
import type {
  MeetingConfigClassScopeLabels,
  MeetingConfigDisplayLabels,
  MeetingConfigManagerLabels,
} from "@/shared/locale/types/ui";

export type ClassMeetingConfigsSectionProps = {
  readonly classInstanceId?: string;
  readonly recurringScheduleId?: string;
  readonly canManage?: boolean;
  readonly effectiveMeeting?: EffectiveMeetingFieldsFragment | null;
};

function isClassMeetingConfig(config: unknown): config is ClassMeetingConfigFieldsFragment {
  if (typeof config !== "object" || config === null) return false;
  return "classInstanceId" in config;
}

function configLabel(config: ClassMeetingConfigFieldsFragment, locale: string): string {
  if (config.label?.trim()) return config.label.trim();
  if (config.provider?.name) return resolveLocalizedString(config.provider.name, locale);
  return config.provider?.slug ?? config.id ?? "";
}

function ConfigsContent({
  t,
  tManager,
  tDisplay,
  resolvedCanManage,
  configs,
  busy,
  effectiveMeeting,
  handleAdd,
  handleEdit,
  handleSetDefault,
  onDelete,
}: {
  readonly t: MeetingConfigClassScopeLabels;
  readonly tManager: MeetingConfigManagerLabels;
  readonly tDisplay: MeetingConfigDisplayLabels;
  readonly resolvedCanManage: boolean;
  readonly configs: readonly ClassMeetingConfigFieldsFragment[];
  readonly busy: boolean;
  readonly effectiveMeeting?: EffectiveMeetingFieldsFragment | null;
  readonly handleAdd: () => void;
  readonly handleEdit: (config: unknown) => void;
  readonly handleSetDefault: (id: string) => Promise<void>;
  readonly onDelete: (id: string) => void;
}) {
  return (
    <Stack spacing={2}>
      <ClassMeetingContextBanner
        effectiveMeeting={effectiveMeeting}
        hasScopeConfigs={configs.length > 0}
        labels={{ classScope: t, display: tDisplay }}
      />

      {resolvedCanManage ? (
        <Stack sx={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={handleAdd}>
            {tManager.add}
          </Button>
        </Stack>
      ) : null}

      <MeetingConfigList
        configs={configs}
        loading={busy}
        title={tManager.listTitle}
        emptyMessage={t.noConfigs}
        onEditAction={resolvedCanManage ? handleEdit : undefined}
        onDeleteAction={resolvedCanManage ? onDelete : undefined}
        onSetDefaultAction={resolvedCanManage ? handleSetDefault : undefined}
      />

      {!resolvedCanManage && configs.length === 0 ? (
        <Typography sx={theme => ({ typography: "bodySm", color: theme.palette.text.secondary })}>
          {t.noConfigs}
        </Typography>
      ) : null}
    </Stack>
  );
}

function ErrorSection({
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

function useScopeQueries(scopeId: string, isClassScope: boolean) {
  const {
    data: classData,
    loading: classLoading,
    error: classError,
    refetch: refetchClass,
  } = useQuery(classMeetingConfigsQueryDocument, {
    variables: { classInstanceId: scopeId },
    skip: !isClassScope || !scopeId,
  });

  const {
    data: recurringData,
    loading: recurringLoading,
    error: recurringError,
    refetch: refetchRecurring,
  } = useQuery(recurringMeetingConfigsQueryDocument, {
    variables: { recurringScheduleId: scopeId },
    skip: isClassScope || !scopeId,
  });

  const loading = classLoading || recurringLoading;
  const error = classError ?? recurringError;
  const refetch = isClassScope ? refetchClass : refetchRecurring;
  const configs = useMemo(
    () => (isClassScope ? classData?.classMeetingConfigs : recurringData?.recurringMeetingConfigs) ?? [],
    [isClassScope, classData?.classMeetingConfigs, recurringData?.recurringMeetingConfigs]
  );

  return { loading, error, refetch, configs };
}

function useMeetingConfigMutations(
  deleteId: string | null,
  refetch: () => Promise<unknown>,
  setDeleteId: (id: string | null) => void,
  setErrorMessage: (msg: string | null) => void,
  tManager: MeetingConfigManagerLabels
) {
  const [deleteConfig, { loading: deleting }] = useMutation(deleteClassMeetingConfigMutationDocument);
  const [setDefault, { loading: settingDefault }] = useMutation(setDefaultClassMeetingConfigMutationDocument);

  const handleSetDefault = useCallback(
    async (id: string) => {
      try {
        await setDefault({ variables: { id } });
        await refetch();
      } catch {
        setErrorMessage(tManager.saveError);
      }
    },
    [setDefault, refetch, tManager, setErrorMessage]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteConfig({ variables: { id: deleteId } });
      setDeleteId(null);
      await refetch();
    } catch {
      setErrorMessage(tManager.deleteError);
    }
  }, [deleteId, deleteConfig, refetch, tManager, setDeleteId, setErrorMessage]);

  return { deleting, settingDefault, handleSetDefault, handleDelete };
}

function ClassMeetingConfigDialogs({
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

export function ClassMeetingConfigsSection({
  classInstanceId,
  recurringScheduleId,
  canManage,
  effectiveMeeting,
}: ClassMeetingConfigsSectionProps) {
  const labels = useMeetingConfigProfileLabels();
  const t = labels.classScope;
  const tManager = labels.manager;
  const locale = useAppLocale();
  const { hasPermission } = useUserStore();
  const resolvedCanManage = canManage ?? hasPermission(AppPermission.MeetingConfigsManageClass);

  const isClassScope = Boolean(classInstanceId);
  const scopeId = classInstanceId ?? recurringScheduleId ?? "";

  const { loading, error, refetch, configs } = useScopeQueries(scopeId, isClassScope);

  const [formOpen, setFormOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<ClassMeetingConfigFieldsFragment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { deleting, settingDefault, handleSetDefault, handleDelete } = useMeetingConfigMutations(
    deleteId,
    refetch,
    setDeleteId,
    setErrorMessage,
    tManager
  );

  const deleteLabel = useMemo(() => {
    if (!deleteId) return "";
    const config = configs.find(c => c.id === deleteId);
    return config ? configLabel(config, locale) : "";
  }, [configs, deleteId, locale]);

  const handleEdit = useCallback((config: unknown) => {
    if (isClassMeetingConfig(config)) {
      setEditConfig(config);
    }
    setFormOpen(true);
  }, []);

  const handleAdd = useCallback(() => {
    setEditConfig(null);
    setFormOpen(true);
  }, []);

  if (!scopeId) return null;

  if (error && configs.length === 0) {
    return (
      <ErrorSection
        title={t.sectionTitle}
        subtitle={t.sectionSubtitle}
        errorMessage={tManager.loadError}
        retryLabel={tManager.retry}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const busy = loading || deleting || settingDefault;

  return (
    <SectionPanel id="meeting-configs" title={t.sectionTitle} subTitle={t.sectionSubtitle}>
      <ConfigsContent
        t={t}
        tManager={tManager}
        tDisplay={labels.display}
        resolvedCanManage={resolvedCanManage}
        configs={configs}
        busy={busy}
        effectiveMeeting={effectiveMeeting}
        handleAdd={handleAdd}
        handleEdit={handleEdit}
        handleSetDefault={handleSetDefault}
        onDelete={id => setDeleteId(id)}
      />

      <ClassMeetingConfigDialogs
        resolvedCanManage={resolvedCanManage}
        formOpen={formOpen}
        editConfig={editConfig}
        deleteId={deleteId}
        deleteLabel={deleteLabel}
        deleting={deleting}
        showSuccess={showSuccess}
        errorMessage={errorMessage}
        classInstanceId={classInstanceId}
        recurringScheduleId={recurringScheduleId}
        configsCount={configs.length}
        tManager={tManager}
        setFormOpen={setFormOpen}
        setEditConfig={setEditConfig}
        setDeleteId={setDeleteId}
        setShowSuccess={setShowSuccess}
        setErrorMessage={setErrorMessage}
        refetch={refetch}
        handleDelete={handleDelete}
      />
    </SectionPanel>
  );
}
