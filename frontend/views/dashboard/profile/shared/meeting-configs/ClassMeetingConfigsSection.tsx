"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { Button, Stack, Typography } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ErrorState, FormSuccessSnackbar, SectionPanel } from "@/frontend/components/ui";
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
import type { ClassMeetingConfigFieldsFragment } from "@/frontend/graphql/types/meeting-class-config.operations";
import { resolveLocalizedString } from "@/frontend/lib/localized-string";
import { useUserStore } from "@/frontend/stores/userStore";
import { ClassMeetingConfigFormDialog } from "@/frontend/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigFormDialog";
import { MeetingConfigDeleteDialog } from "@/frontend/views/dashboard/profile/shared/meeting-configs/MeetingConfigDeleteDialog";

export type ClassMeetingConfigsSectionProps = {
  readonly classInstanceId?: string;
  readonly recurringScheduleId?: string;
  readonly canManage?: boolean;
};

function configLabel(config: ClassMeetingConfigFieldsFragment, locale: string): string {
  if (config.label?.trim()) return config.label.trim();
  if (config.provider?.name) return resolveLocalizedString(config.provider.name, locale);
  return config.provider?.slug ?? config.id ?? "";
}

export function ClassMeetingConfigsSection({
  classInstanceId,
  recurringScheduleId,
  canManage,
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
  const configs = (isClassScope ? classData?.classMeetingConfigs : recurringData?.recurringMeetingConfigs) ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<ClassMeetingConfigFieldsFragment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [deleteConfig, { loading: deleting }] = useMutation(deleteClassMeetingConfigMutationDocument);
  const [setDefault, { loading: settingDefault }] = useMutation(setDefaultClassMeetingConfigMutationDocument);

  const deleteLabel = useMemo(() => {
    if (!deleteId) return "";
    const config = configs.find(c => c.id === deleteId);
    return config ? configLabel(config as ClassMeetingConfigFieldsFragment, locale) : "";
  }, [configs, deleteId, locale]);

  if (!scopeId) return null;

  if (error && configs.length === 0) {
    return (
      <SectionPanel title={t("sectionTitle")} subTitle={t("sectionSubtitle")}>
        <ErrorState
          embedded
          message={tManager("loadError")}
          retryLabel={tManager("retry")}
          onRetry={() => {
            void refetch();
          }}
        />
      </SectionPanel>
    );
  }

  const busy = loading || deleting || settingDefault;

  return (
    <SectionPanel title={t("sectionTitle")} subTitle={t("sectionSubtitle")}>
      <Stack spacing={2}>
        {resolvedCanManage ? (
          <Stack sx={{ flexDirection: "row", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              onClick={() => {
                setEditConfig(null);
                setFormOpen(true);
              }}
            >
              {tManager("add")}
            </Button>
          </Stack>
        ) : null}

        <MeetingConfigList
          configs={configs}
          loading={busy}
          title={tManager("listTitle")}
          emptyMessage={t("noConfigs")}
          onEditAction={
            resolvedCanManage
              ? config => {
                  setEditConfig(config as ClassMeetingConfigFieldsFragment);
                  setFormOpen(true);
                }
              : undefined
          }
          onDeleteAction={resolvedCanManage ? id => setDeleteId(id) : undefined}
          onSetDefaultAction={
            resolvedCanManage
              ? async id => {
                  await setDefault({ variables: { id } });
                  await refetch();
                }
              : undefined
          }
        />

        {!resolvedCanManage && configs.length === 0 ? (
          <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{t("noConfigs")}</Typography>
        ) : null}
      </Stack>

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
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteConfig({ variables: { id: deleteId } });
          setDeleteId(null);
          await refetch();
        }}
      />

      <FormSuccessSnackbar open={showSuccess} message={tManager("saved")} onClose={() => setShowSuccess(false)} />
    </SectionPanel>
  );
}
