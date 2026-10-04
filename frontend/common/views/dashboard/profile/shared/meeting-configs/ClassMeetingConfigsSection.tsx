"use client";

import { useCallback, useMemo, useState } from "react";
import { SectionPanel } from "@/frontend/common/components/ui";
import {
  AppPermission,
  type ClassMeetingConfigFieldsFragment,
  type EffectiveMeetingFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useUserStore } from "@/frontend/common/stores/userStore";
import {
  ClassMeetingConfigDialogs,
  ErrorSection,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection.dialogs";
import {
  configLabel,
  isClassMeetingConfig,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection.helpers";
import {
  useMeetingConfigMutations,
  useMeetingConfigRetry,
  useScopeQueries,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection.hooks";
import { ConfigsContent } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection.parts";
import { useMeetingConfigProfileLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigProfileLabels";

export type ClassMeetingConfigsSectionProps = {
  readonly classInstanceId?: string;
  readonly recurringScheduleId?: string;
  readonly canManage?: boolean;
  readonly effectiveMeeting?: EffectiveMeetingFieldsFragment | null;
};

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

  const { loading, error, refetch, configs, statusMap } = useScopeQueries(scopeId, isClassScope);

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

  const { retryingId, handleRetry } = useMeetingConfigRetry(refetch, setErrorMessage, tManager);

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

  const busy = loading || deleting || settingDefault || retryingId != null;

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
        enhancements={labels.enhancements}
        statusMap={statusMap}
        handleAdd={handleAdd}
        handleEdit={handleEdit}
        handleSetDefault={handleSetDefault}
        onDelete={id => setDeleteId(id)}
        onRetry={handleRetry}
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
