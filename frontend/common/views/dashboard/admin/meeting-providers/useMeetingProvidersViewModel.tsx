"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { AppPermission, type MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  deleteMeetingProviderMutationDocument,
  meetingProvidersQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  MeetingProvidersNotificationState,
  MeetingProvidersViewLabels,
  MeetingProvidersViewProps,
} from "@/frontend/common/views/dashboard/admin/meeting-providers/types";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

function useNotificationState(): MeetingProvidersNotificationState {
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const showError = useCallback((message: string) => {
    setErrorMsg(message);
    setErrorOpen(true);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMsg(message);
    setSuccessOpen(true);
  }, []);

  const closeError = useCallback(() => setErrorOpen(false), []);
  const closeSuccess = useCallback(() => setSuccessOpen(false), []);

  return { errorOpen, errorMsg, successOpen, successMsg, showError, showSuccess, closeError, closeSuccess };
}

export type MeetingProvidersViewModel = MeetingProvidersViewProps & {
  readonly canManageCatalog: boolean;
};

export type UseMeetingProvidersViewModelProps = Record<string, never>;

export function useMeetingProvidersViewModel(
  _props: Readonly<UseMeetingProvidersViewModelProps>
): MeetingProvidersViewModel {
  const router = useRouter();
  const t = useAppTranslation(Translation.Dashboard.MeetingProviders);
  const locale = useAppLocale();

  const [deleteProvider, setDeleteProvider] = useState<MeetingProviderFieldsFragment | null>(null);
  const notifications = useNotificationState();
  const toolpadNotifications = useNotifications();

  const hasPermission = useUserStore(state => state.hasPermission);
  const canManageCatalog = hasPermission(AppPermission.MeetingProvidersManageCatalog);

  const { data, loading, refetch } = useQuery(meetingProvidersQueryDocument, {
    variables: { activeOnly: false },
  });

  const [deleteMeetingProvider, { loading: deleting }] = useMutation(deleteMeetingProviderMutationDocument, {
    onError: error => {
      logger.error("Delete meeting provider failed:", { error });
      notifications.showError(t.operationFailed);
    },
  });

  const rows = useMemo(() => data?.meetingProviders ?? [], [data?.meetingProviders]);

  const columnLabels = useMemo<MeetingProvidersViewLabels>(
    () => ({
      logo: t.columns.logo,
      slug: t.columns.slug,
      name: t.columns.name,
      description: t.columns.description,
      instructions: t.columns.instructions,
      urlAllowlist: t.columns.urlAllowlist,
      urlExample: t.columns.urlExample,
      capabilities: t.columns.capabilities,
      active: t.active,
      inactive: t.inactive,
      actions: t.columns.actions,
      edit: t.edit,
      delete: t.delete,
      pageTitle: t.pageTitle,
      pageSubtitle: t.pageSubtitle,
      emptyCatalogTitle: t.emptyCatalogTitle,
      emptyCatalogBody: t.emptyCatalogBody,
      addProvider: t.addProvider,
      createSuccess: t.createSuccess,
      updateSuccess: t.updateSuccess,
      deleteSuccess: t.deleteSuccess,
      deleteTitle: t.deleteTitle,
      deleteConfirm: t.deleteConfirm,
      cancel: t.cancel,
      operationFailed: t.operationFailed,
      supportsUsername: t.fields.supportsUsername,
      supportsPassword: t.fields.supportsPassword,
      supportsTenantId: t.fields.supportsTenantId,
    }),
    [t]
  );

  const handleEditRow = useCallback(
    (row: MeetingProviderFieldsFragment) => {
      if (row.id) {
        router.push(`/meeting-providers/edit?id=${row.id}`);
      }
    },
    [router]
  );

  const handleCreateOpen = useCallback(() => {
    router.push("/meeting-providers/create");
  }, [router]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteProvider?.id) return;
    try {
      await deleteMeetingProvider({ variables: { id: deleteProvider.id } });
      setDeleteProvider(null);
      await refetch();
      notifications.showSuccess(t.deleteSuccess);
      toolpadNotifications.show(t.deleteSuccess, { severity: "success", autoHideDuration: 3000 });
    } catch {
      notifications.showError(t.operationFailed);
      toolpadNotifications.show(t.operationFailed, { severity: "error", autoHideDuration: 4000 });
    }
  }, [deleteProvider, deleteMeetingProvider, refetch, notifications, toolpadNotifications, t]);

  return {
    t: columnLabels,
    locale,
    rows,
    loading,
    createOpen: false,
    editProvider: null,
    deleteProvider,
    deleting,
    notifications,
    onCreateOpen: handleCreateOpen,
    onCreateClose: () => {},
    onCreateSaved: () => {},
    onEditRow: handleEditRow,
    onEditClose: () => {},
    onEditSaved: () => {},
    onDeleteRow: setDeleteProvider,
    onDeleteClose: () => setDeleteProvider(null),
    onDeleteConfirm: handleDeleteConfirm,
    canManageCatalog,
  };
}
