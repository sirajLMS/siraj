"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { Button, Stack, Typography } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { ErrorState, FormErrorSnackbar, FormSuccessSnackbar, SectionPanel } from "@/frontend/components/ui";
import { MeetingConfigList } from "@/frontend/components/ui/display/meetingConfig/MeetingConfigList";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  classMeetingConfigsQueryDocument,
  createClassMeetingConfigMutationDocument,
  deleteClassMeetingConfigMutationDocument,
  recurringMeetingConfigsQueryDocument,
  setDefaultClassMeetingConfigMutationDocument,
  updateClassMeetingConfigMutationDocument,
} from "@/frontend/graphql/sharedDocuments/meeting/meeting.documents";
import type {
  ClassMeetingConfigFieldsFragment,
  EffectiveMeetingFieldsFragment,
} from "@/frontend/graphql/types/meeting-class-config.operations";
import { resolveLocalizedString } from "@/frontend/lib/localized-string";
import { useUserStore } from "@/frontend/stores/userStore";
import { ClassMeetingConfigFormDialog } from "@/frontend/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigFormDialog";
import { ClassMeetingContextBanner } from "@/frontend/views/dashboard/profile/shared/meeting-configs/ClassMeetingContextBanner";
import { MeetingConfigDeleteDialog } from "@/frontend/views/dashboard/profile/shared/meeting-configs/MeetingConfigDeleteDialog";

export type ClassMeetingConfigsSectionProps = {
  readonly classInstanceId?: string;
  readonly recurringScheduleId?: string;
  readonly canManage?: boolean;
  readonly effectiveMeeting?: EffectiveMeetingFieldsFragment | null;
};

function configLabel(config: ClassMeetingConfigFieldsFragment, locale: string): string {
  if (config.label?.trim()) return config.label.trim();
  if (config.provider?.name) return resolveLocalizedString(config.provider.name, locale);
  return config.provider?.slug ?? config.id ?? "";
}

function ConfigsContent({
  t,
  tManager,
  resolvedCanManage,
  configs,
  busy,
  effectiveMeeting,
  handleAdd,
  handleEdit,
  handleSetDefault,
  onDelete,
}: {
  readonly t: ReturnType<typeof useTranslations>;
  readonly tManager: ReturnType<typeof useTranslations>;
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
      <ClassMeetingContextBanner effectiveMeeting={effectiveMeeting} hasScopeConfigs={configs.length > 0} />

      {resolvedCanManage ? (
        <Stack sx={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={handleAdd}>
            {tManager("add")}
          </Button>
        </Stack>
      ) : null}

      <MeetingConfigList
        configs={configs}
        loading={busy}
        title={tManager("listTitle")}
        emptyMessage={t("noConfigs")}
        onEditAction={resolvedCanManage ? handleEdit : undefined}
        onDeleteAction={resolvedCanManage ? onDelete : undefined}
        onSetDefaultAction={resolvedCanManage ? handleSetDefault : undefined}
      />

      {!resolvedCanManage && configs.length === 0 ? (
        <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{t("noConfigs")}</Typography>
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

export function ClassMeetingConfigsSection({
  classInstanceId,
  recurringScheduleId,
  canManage,
  effectiveMeeting,
}: ClassMeetingConfigsSectionProps) {
  const t = useTranslations("ui.meetingConfig.classScope");
  const tManager = useTranslations("ui.meetingConfig.manager");
  const locale = useLocale();
  const { hasPermission } = useUserStore();
  const resolvedCanManage = canManage ?? hasPermission(AppPermission.MeetingConfigsManageClass);

  const isClassScope = Boolean(classInstanceId);
  const scopeId = classInstanceId ?? recurringScheduleId ?? "";

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

  const [formOpen, setFormOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<ClassMeetingConfigFieldsFragment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [deleteConfig, { loading: deleting }] = useMutation(deleteClassMeetingConfigMutationDocument);
  const [setDefault, { loading: settingDefault }] = useMutation(setDefaultClassMeetingConfigMutationDocument);

  const deleteLabel = useMemo(() => {
    if (!deleteId) return "";
    const config = configs.find(c => c.id === deleteId);
    return config ? configLabel(config as ClassMeetingConfigFieldsFragment, locale) : "";
  }, [configs, deleteId, locale]);

  const handleSetDefault = useCallback(
    async (id: string) => {
      try {
        await setDefault({ variables: { id } });
        await refetch();
      } catch {
        setErrorMessage(tManager("saveError"));
      }
    },
    [setDefault, refetch, tManager]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteConfig({ variables: { id: deleteId } });
      setDeleteId(null);
      await refetch();
    } catch {
      setErrorMessage(tManager("deleteError"));
    }
  }, [deleteId, deleteConfig, refetch, tManager]);

  const handleEdit = useCallback((config: unknown) => {
    setEditConfig(config as ClassMeetingConfigFieldsFragment);
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
        title={t("sectionTitle")}
        subtitle={t("sectionSubtitle")}
        errorMessage={tManager("loadError")}
        retryLabel={tManager("retry")}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const busy = loading || deleting || settingDefault;

  return (
    <SectionPanel id="meeting-configs" title={t("sectionTitle")} subTitle={t("sectionSubtitle")}>
      <ConfigsContent
        t={t}
        tManager={tManager}
        resolvedCanManage={resolvedCanManage}
        configs={configs}
        busy={busy}
        effectiveMeeting={effectiveMeeting}
        handleAdd={handleAdd}
        handleEdit={handleEdit}
        handleSetDefault={handleSetDefault}
        onDelete={id => setDeleteId(id)}
      />

      {resolvedCanManage ? (
        <ClassMeetingConfigFormDialog
          open={formOpen}
          classInstanceId={classInstanceId}
          recurringScheduleId={recurringScheduleId}
          editConfig={editConfig}
          existingCount={configs.length}
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
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />

      <FormSuccessSnackbar open={showSuccess} message={tManager("saved")} onClose={() => setShowSuccess(false)} />
      <FormErrorSnackbar
        open={errorMessage != null}
        message={errorMessage ?? ""}
        onClose={() => setErrorMessage(null)}
      />
    </SectionPanel>
  );
}
