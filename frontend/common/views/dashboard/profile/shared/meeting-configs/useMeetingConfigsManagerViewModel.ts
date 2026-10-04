"use client";

import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useMeetingConfigProfileLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigProfileLabels";
import { useMeetingConfigsManagerActions } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerActions";
import { useMeetingConfigsManagerBookings } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerBookings";
import { useMeetingConfigsManagerConnectAccounts } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerConnectAccounts";
import {
  useMeetingConfigsManagerDialogs,
  useMeetingConfigsManagerSubmit,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerDialogs";
import {
  useMeetingConfigsManagerPreview,
  useMeetingConfigsManagerRegenerate,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerGeneration";
import { useMeetingConfigsManagerQueries } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerQueries";
import { useMeetingConfigsManagerReauth } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerReauth";

export type UseMeetingConfigsManagerViewModelProps = {
  readonly targetUserId: string;
};

/** View model for the meeting-configs manager: wires the query, reauth,
 *  dialog, generation, connect-account, bookings, and OAuth action sub-hooks
 *  into the flat state/handler surface consumed by the manager component. */
export function useMeetingConfigsManagerViewModel(props: Readonly<UseMeetingConfigsManagerViewModelProps>) {
  const { targetUserId } = props;
  const labels = useMeetingConfigProfileLabels();
  const t = labels.manager;
  const enhancements = labels.enhancements;
  const locale = useAppLocale();
  const router = useRouter();
  const notifications = useNotifications();
  const hasPermission = useUserStore(state => state.hasPermission);

  /** Whether the current user may view the admin settings tab — gates the
   *  "Admin Provider Settings" cross-link button. */
  const canViewSettings = useMemo(() => hasPermission(AppPermission.SettingsView), [hasPermission]);

  const navigateToSettings = useCallback(() => {
    router.push("/dashboard/settings?tab=meetingIntegrations");
  }, [router]);

  const queries = useMeetingConfigsManagerQueries(targetUserId);
  const { configs, refetch } = queries.view;
  const { configById, connectedProvidersQueryRefetch } = queries;

  const reauth = useMeetingConfigsManagerReauth({ configs, locale });
  const dialogs = useMeetingConfigsManagerDialogs({ configById, refetch, locale, managerLabels: t });
  const submit = useMeetingConfigsManagerSubmit({ refetch, targetUserId });
  const preview = useMeetingConfigsManagerPreview({
    configs,
    saveErrorLabel: t.saveError,
    addReactiveSlug: reauth.addReactiveSlug,
    removeReactiveSlug: reauth.removeReactiveSlug,
  });
  const regenerate = useMeetingConfigsManagerRegenerate({
    configById,
    refetch,
    saveErrorLabel: t.saveError,
    addReactiveSlug: reauth.addReactiveSlug,
    setErrorMessage: dialogs.setErrorMessage,
  });
  const connectAccounts = useMeetingConfigsManagerConnectAccounts({
    providersData: queries.providersData,
    connectedProvidersData: queries.connectedProvidersData,
    reauthProviderSlugs: reauth.reauthProviderSlugs,
    reauthExpiryStates: reauth.reauthExpiryStates,
    locale,
  });
  const bookings = useMeetingConfigsManagerBookings({ configs, configById, targetUserId });
  const actions = useMeetingConfigsManagerActions({
    refetch,
    connectedProvidersQueryRefetch,
    saveErrorLabel: t.saveError,
    notifications,
    enhancements,
    reauth,
    dialogs,
    connectAccounts,
    bookings,
  });

  return {
    labels,
    t,
    ...queries.view,
    ...dialogs.view,
    ...submit.view,
    ...preview.view,
    ...regenerate.view,
    ...reauth.view,
    ...connectAccounts.view,
    ...bookings.view,
    ...actions.view,
    navigateToSettings,
    canViewSettings,
  };
}
