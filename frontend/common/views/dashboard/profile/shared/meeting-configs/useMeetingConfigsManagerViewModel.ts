"use client";

import { CombinedGraphQLErrors } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MeetingConfigListItem } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigList";
import { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import {
  connectMeetingProviderOAuthMutationDocument,
  createUserMeetingConfigMutationDocument,
  deleteUserMeetingConfigMutationDocument,
  disconnectMeetingProviderOAuthMutationDocument,
  generateMeetingUrlMutationDocument,
  meetingProvidersQueryDocument,
  myConnectedMeetingProvidersQueryDocument,
  setDefaultMeetingConfigMutationDocument,
  updateUserMeetingConfigMutationDocument,
  userMeetingConfigsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { teacherWeeklyScheduleGridQueryDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/weekly-schedule.documents";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { logger } from "@/frontend/common/utils/logger";
import type { ConnectionState } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ConnectProviderAccount";
import type { LinkedClassInstance } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/LinkedClassInstancesList";
import type {
  ExpiryState,
  ReauthProvider,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner.types";
import { useMeetingConfigProfileLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigProfileLabels";

/** Error code emitted by the backend when a provider token is expired or revoked. */
const PROVIDER_REAUTH_REQUIRED_CODE = "PROVIDER_REAUTH_REQUIRED";

/** 7-day proactive token expiry window (REQ-14 AC3). */
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export type GenerationStatus = "idle" | "generating" | "success" | "error";

export type GeneratePreviewArgs = {
  readonly providerId: string;
  readonly topic: string;
  readonly startDateTime?: string;
  readonly durationMinutes?: number;
};

/** Returns the ISO date string for the Monday of the current week. */
function currentWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = (day === 0 ? -6 : 1 - day) * 24 * 60 * 60 * 1000;
  const monday = new Date(now.getTime() - diff);
  return monday.toISOString().split("T")[0] ?? "";
}

function configLabel(config: UserMeetingConfigFieldsFragment, locale: string): string {
  if (config.label?.trim()) return config.label.trim();
  if (config.provider?.name) return resolveLocalizedString(config.provider.name, locale);
  return config.provider?.slug ?? config.id ?? "";
}

export type UseMeetingConfigsManagerViewModelProps = {
  readonly targetUserId: string;
};

/** Returns a new bookings-instances map with all configs for the given
 *  provider slug removed. Used as a state updater for `setBookingsInstances`. */
function clearProviderBookingsInstances(
  configs: readonly UserMeetingConfigFieldsFragment[],
  providerSlug: string,
  prev: ReadonlyMap<string, readonly LinkedClassInstance[]>
): Map<string, readonly LinkedClassInstance[]> {
  const next = new Map(prev);
  for (const config of configs) {
    if (config.provider?.slug === providerSlug && config.id) {
      next.delete(config.id);
    }
  }
  return next;
}

/** Returns `null` if the currently expanded config belongs to the given
 *  provider slug (so we collapse it), otherwise returns the previous value
 *  unchanged. Used as a state updater for `setExpandedBookingsId`. */
function collapseProviderExpandedId(
  configById: ReadonlyMap<string, UserMeetingConfigFieldsFragment>,
  providerSlug: string,
  prev: string | null
): string | null {
  if (prev == null) return null;
  const config = configById.get(prev);
  return config?.provider?.slug === providerSlug ? null : prev;
}

function isUserMeetingConfig(config: MeetingConfigListItem): config is UserMeetingConfigFieldsFragment {
  return "userId" in config;
}

function isMeetingIntegrationProviderSlug(value: string): value is MeetingIntegrationProviderSlug {
  return (Object.values(MeetingIntegrationProviderSlug) as readonly string[]).includes(value);
}

export function useMeetingConfigsManagerViewModel(props: Readonly<UseMeetingConfigsManagerViewModelProps>) {
  const { targetUserId } = props;
  const labels = useMeetingConfigProfileLabels();
  const t = labels.manager;
  const locale = useAppLocale();

  const { data, loading, error, refetch } = useQuery(userMeetingConfigsQueryDocument, {
    variables: { userId: targetUserId },
  });

  const { data: providersData } = useQuery(meetingProvidersQueryDocument, {
    variables: { activeOnly: true },
  });

  const { data: connectedProvidersData, refetch: connectedProvidersQueryRefetch } = useQuery(
    myConnectedMeetingProvidersQueryDocument,
    { fetchPolicy: "network-only" }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<UserMeetingConfigFieldsFragment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const configs = useMemo(() => data?.userMeetingConfigs ?? [], [data?.userMeetingConfigs]);

  const configById = useMemo(() => {
    const map = new Map<string, UserMeetingConfigFieldsFragment>();
    for (const config of configs) {
      if (config.id) map.set(config.id, config);
    }
    return map;
  }, [configs]);

  const [deleteConfig, { loading: deleting }] = useMutation(deleteUserMeetingConfigMutationDocument);
  const [setDefault, { loading: settingDefault }] = useMutation(setDefaultMeetingConfigMutationDocument);
  const [updateUserMeetingConfig] = useMutation(updateUserMeetingConfigMutationDocument);
  const [connectMeetingProviderOAuth] = useMutation(connectMeetingProviderOAuthMutationDocument);
  const [disconnectMeetingProviderOAuth, { loading: disconnecting }] = useMutation(
    disconnectMeetingProviderOAuthMutationDocument
  );
  const [createUserMeetingConfig] = useMutation(createUserMeetingConfigMutationDocument);

  const deleteLabel = useMemo(() => {
    if (!deleteId) return "";
    const config = configById.get(deleteId);
    return config ? configLabel(config, locale) : "";
  }, [configById, deleteId, locale]);

  const handleSaved = async () => {
    setShowSuccess(true);
    await refetch();
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteConfig({ variables: { id: deleteId } });
      setDeleteId(null);
      await refetch();
    } catch {
      setErrorMessage(t.deleteError);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault({ variables: { id } });
      await refetch();
    } catch {
      setErrorMessage(t.saveError);
    }
  };

  const openCreateForm = () => {
    setEditConfig(null);
    setFormOpen(true);
  };

  const openEditForm = (config: MeetingConfigListItem) => {
    if (!isUserMeetingConfig(config)) return;
    setEditConfig(config);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditConfig(null);
  };

  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle");
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [reauthProviderSlugs, setReauthProviderSlugs] = useState<Set<string>>(() => new Set());
  const [reauthExpiryStates, setReauthExpiryStates] = useState<Map<string, ExpiryState>>(() => new Map());
  const [generating, setGenerating] = useState(false);
  const [connectingSlugs, setConnectingSlugs] = useState<Set<string>>(() => new Set());

  // Proactive token-expiry detection (REQ-14 AC3): check each config's
  // oauthTokenExpiresAt and add providers whose tokens expire within 7 days
  // to the reauthProviderSlugs set. This complements the reactive detection
  // that fires after a mutation failure. Only adds slugs — never removes
  // reactively-detected slugs.
  useEffect(() => {
    const now = Date.now();
    const expiringSlugs = new Set<string>();
    const expiryStates = new Map<string, ExpiryState>();
    for (const config of configs) {
      const expiresAtRaw = config.oauthTokenExpiresAt;
      if (!expiresAtRaw) continue;
      const expiresAt = new Date(expiresAtRaw).getTime();
      if (Number.isNaN(expiresAt)) continue;
      const slug = config.provider?.slug;
      if (!slug) continue;
      const msUntilExpiry = expiresAt - now;
      if (msUntilExpiry <= SEVEN_DAYS_MS) {
        expiringSlugs.add(slug);
        // Distinguish expired vs expiring soon at the individual slug level.
        const state: ExpiryState = msUntilExpiry <= 0 ? "expired" : "expiring_soon";
        expiryStates.set(slug, state);
      }
    }
    if (expiringSlugs.size === 0) return;
    setReauthExpiryStates(prev => {
      let changed = false;
      const next = new Map(prev);
      for (const [s, state] of expiryStates) {
        if (next.get(s) !== state) {
          next.set(s, state);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setReauthProviderSlugs(prev => {
      let changed = false;
      const next = new Set(prev);
      for (const s of expiringSlugs) {
        if (!next.has(s)) {
          next.add(s);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [configs]);

  const [generateMeetingUrl] = useMutation(generateMeetingUrlMutationDocument);

  const generatePreview = async (args: GeneratePreviewArgs): Promise<string | null> => {
    setGenerationStatus("generating");
    setGenerationError(null);
    try {
      const result = await generateMeetingUrl({
        variables: {
          input: {
            providerId: args.providerId,
            topic: args.topic,
            startDateTime: args.startDateTime ?? null,
            durationMinutes: args.durationMinutes ?? null,
          },
        },
      });
      const joinUrl = result.data?.generateMeetingUrl?.joinUrl ?? null;
      if (joinUrl) {
        setLastGeneratedUrl(joinUrl);
        setGenerationStatus("success");
        const slug = configs.find(c => c.provider?.id === args.providerId)?.provider?.slug;
        if (slug)
          setReauthProviderSlugs(prev => {
            const next = new Set(prev);
            next.delete(slug);
            return next;
          });
        return joinUrl;
      }
      setGenerationStatus("error");
      setGenerationError(t.saveError);
      return null;
    } catch (caughtError) {
      setGenerationStatus("error");
      if (CombinedGraphQLErrors.is(caughtError)) {
        const reauthError = caughtError.errors.find(e => e.extensions?.code === PROVIDER_REAUTH_REQUIRED_CODE);
        if (reauthError) {
          const slug = configs.find(c => c.provider?.id === args.providerId)?.provider?.slug;
          if (slug) {
            setReauthProviderSlugs(prev => new Set(prev).add(slug));
          }
        }
      }
      setGenerationError(t.saveError);
      return null;
    }
  };

  const resetGeneration = () => {
    setGenerationStatus("idle");
    setLastGeneratedUrl(null);
    setGenerationError(null);
  };

  const regenerateConfig = async (configId: string): Promise<void> => {
    const config = configById.get(configId);
    if (!config) return;
    const providerId = config.provider?.id;
    if (!providerId) return;

    setGenerating(true);
    setErrorMessage(null);
    try {
      // Use forceRegenerate to trigger URL regeneration via the UPDATE mutation.
      // No need to call the generateMeetingUrl preview
      // mutation — the UPDATE mutation itself triggers generation when forceRegenerate is true.
      await updateUserMeetingConfig({
        variables: {
          id: configId,
          input: {
            details: {
              meetingUrl: config.details?.meetingUrl ?? null,
              tenantId: config.details?.tenantId ?? null,
              username: config.details?.username ?? null,
            },
            isDefault: config.isDefault ?? null,
            label: config.label ?? null,
            password: null,
            providerId: config.provider?.id ?? null,
            forceRegenerate: true,
          },
        },
      });
      await refetch();
    } catch (caughtError) {
      if (CombinedGraphQLErrors.is(caughtError)) {
        const reauthError = caughtError.errors.find(e => e.extensions?.code === PROVIDER_REAUTH_REQUIRED_CODE);
        if (reauthError) {
          const slug = config.provider?.slug;
          if (slug) {
            setReauthProviderSlugs(prev => new Set(prev).add(slug));
          }
        }
      }
      logger.error("regenerateConfig failed", caughtError);
      setErrorMessage(t.saveError);
    } finally {
      setGenerating(false);
    }
  };

  const requiresReconnect = useMemo(() => {
    const result: { providerSlug: string; providerName: string }[] = [];
    for (const c of configs) {
      const slug = c.provider?.slug;
      if (slug != null && reauthProviderSlugs.has(slug)) {
        result.push({
          providerSlug: slug,
          providerName: c.provider?.name ? resolveLocalizedString(c.provider.name, locale) : slug,
        });
      }
    }
    return result;
  }, [configs, reauthProviderSlugs, locale]);

  const reauthProviders = useMemo<readonly ReauthProvider[]>(() => {
    const result: ReauthProvider[] = [];
    for (const c of configs) {
      const slug = c.provider?.slug;
      if (slug != null && reauthProviderSlugs.has(slug)) {
        result.push({
          slug,
          name: c.provider?.name ? resolveLocalizedString(c.provider.name, locale) : slug,
          expiryState: reauthExpiryStates.get(slug),
        });
      }
    }
    return result;
  }, [configs, reauthProviderSlugs, reauthExpiryStates, locale]);

  // Map of provider slug → connected email, derived from OAuth token rows.
  const connectedProviderMap = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const token of connectedProvidersData?.myConnectedMeetingProviders ?? []) {
      const slug = token?.providerSlug;
      if (slug != null) {
        map.set(slug, token?.email ?? null);
      }
    }
    return map;
  }, [connectedProvidersData?.myConnectedMeetingProviders]);

  // Derive the list of auto-generation providers and their connection state
  // for the ConnectProviderAccount component. Only providers that support
  // auto-generation and are NOT manual meeting-URL providers are included —
  // manual providers don't need OAuth and are managed via the config form.
  const connectProviderAccountItems = useMemo<
    readonly {
      readonly providerSlug: string;
      readonly providerName: string;
      readonly connectionState: ConnectionState;
      readonly connectedEmail?: string;
    }[]
  >(() => {
    const allProviders = providersData?.meetingProviders ?? [];
    const result: {
      providerSlug: string;
      providerName: string;
      connectionState: ConnectionState;
      connectedEmail?: string;
    }[] = [];

    for (const provider of allProviders) {
      const supportsAutoGen = provider.fieldSchema?.supportsAutoGeneration === true;
      const providerKind = provider.providerKind ?? "manual";
      if (!supportsAutoGen) continue;
      if (providerKind === "manual") continue;

      const slug = provider.slug ?? "";
      if (!slug) continue;

      const providerName = provider.name ? resolveLocalizedString(provider.name, locale) : slug;

      // Derive connected state from OAuth token existence, not config existence.
      const hasToken = connectedProviderMap.has(slug);
      const connectedEmail = connectedProviderMap.get(slug) ?? undefined;

      let connectionState: ConnectionState;
      if (connectingSlugs.has(slug)) {
        connectionState = "connecting";
      } else if (reauthProviderSlugs.has(slug)) {
        connectionState = "reauthNeeded";
      } else if (hasToken) {
        connectionState = "connected";
      } else {
        connectionState = "disconnected";
      }

      result.push({
        providerSlug: slug,
        providerName,
        connectionState,
        connectedEmail,
      });
    }
    return result;
  }, [providersData?.meetingProviders, connectedProviderMap, reauthProviderSlugs, connectingSlugs, locale]);
  const [bookingsInstances, setBookingsInstances] = useState<Map<string, readonly LinkedClassInstance[]>>(
    () => new Map()
  );
  const [expandedBookingsId, setExpandedBookingsId] = useState<string | null>(null);

  // Fetch the teacher's weekly schedule only when a bookings list is expanded.
  // The stateful useQuery pattern (no useLazyQuery) is the project convention.
  const weeklyScheduleQuery = useQuery(teacherWeeklyScheduleGridQueryDocument, {
    variables: { teacherId: targetUserId, weekDate: currentWeekStart() },
    skip: expandedBookingsId === null || bookingsInstances.has(expandedBookingsId),
    fetchPolicy: "network-only",
  });

  // When the query returns data, filter class instances whose effective meeting
  // uses the expanded config and cache them.
  useEffect(() => {
    if (expandedBookingsId == null) return;
    if (weeklyScheduleQuery.loading) return;
    if (weeklyScheduleQuery.data == null) return;

    const grid = weeklyScheduleQuery.data.teacherWeeklyScheduleGrid;
    if (grid == null) return;

    const instances: LinkedClassInstance[] = [];
    for (const cls of grid.classes ?? []) {
      const effectiveConfigId = cls.effectiveMeeting?.configId;
      if (effectiveConfigId !== expandedBookingsId) continue;
      instances.push({
        id: cls.id ?? "",
        title: cls.studentName ?? "",
        startTime: cls.startTime ?? null,
        meetingJoinUrl: cls.meetingJoinUrl ?? cls.effectiveMeeting?.joinUrl ?? null,
      });
    }

    setBookingsInstances(prev => {
      const next = new Map(prev);
      next.set(expandedBookingsId, instances);
      return next;
    });
  }, [expandedBookingsId, weeklyScheduleQuery.data, weeklyScheduleQuery.loading]);

  const handleViewBookings = (meetingConfigId: string) => {
    // Toggle: if already expanded for this config, collapse.
    if (expandedBookingsId === meetingConfigId) {
      setExpandedBookingsId(null);
      return;
    }
    setExpandedBookingsId(meetingConfigId);
  };

  const handleReconnect = async (providerSlug: string) => {
    if (!isMeetingIntegrationProviderSlug(providerSlug)) return;
    setConnectingSlugs(prev => new Set(prev).add(providerSlug));
    try {
      const result = await connectMeetingProviderOAuth({
        variables: {
          input: {
            providerSlug,
            returnPath: globalThis.window?.location?.pathname ?? "/",
          },
        },
      });
      const authorizeUrl = result.data?.connectMeetingProviderOAuth?.authorizeUrl;
      if (authorizeUrl) {
        // Clear local state before redirecting away.
        setReauthProviderSlugs(prev => {
          const next = new Set(prev);
          next.delete(providerSlug);
          return next;
        });
        if (globalThis.window) {
          globalThis.window.location.href = authorizeUrl;
        }
        return;
      }
      // No authorizeUrl returned — clear local state as fallback.
      setConnectingSlugs(prev => {
        const next = new Set(prev);
        next.delete(providerSlug);
        return next;
      });
      setErrorMessage(t.saveError);
    } catch (caughtError) {
      setConnectingSlugs(prev => {
        const next = new Set(prev);
        next.delete(providerSlug);
        return next;
      });
      logger.error("handleReconnect OAuth failed", caughtError);
      setErrorMessage(t.saveError);
    }
    // Clear cached instances for configs using this provider.
    setBookingsInstances(prev => clearProviderBookingsInstances(configs, providerSlug, prev));
    // Collapse any expanded view for configs using this provider.
    setExpandedBookingsId(prev => collapseProviderExpandedId(configById, providerSlug, prev));
  };

  const disconnectProvider = async (providerSlug: string) => {
    if (!isMeetingIntegrationProviderSlug(providerSlug)) return;
    setErrorMessage(null);
    try {
      await disconnectMeetingProviderOAuth({
        variables: {
          input: {
            providerSlug,
          },
        },
      });
      setReauthProviderSlugs(prev => {
        const next = new Set(prev);
        next.delete(providerSlug);
        return next;
      });
      // Refetch both meeting configs and connected provider tokens.
      await Promise.all([refetch(), connectedProvidersQueryRefetch()]);
    } catch (caughtError) {
      logger.error("disconnectProvider OAuth failed", caughtError);
      setErrorMessage(t.saveError);
    }
    // Clear cached instances for configs using this provider.
    setBookingsInstances(prev => clearProviderBookingsInstances(configs, providerSlug, prev));
    // Collapse any expanded view for configs using this provider.
    setExpandedBookingsId(prev => collapseProviderExpandedId(configById, providerSlug, prev));
  };

  const submitAutoConfig = useCallback(
    async (providerId: string, _providerSlug: MeetingIntegrationProviderSlug, label: string | null) => {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const result = await createUserMeetingConfig({
          variables: {
            input: {
              userId: targetUserId,
              providerId,
              label,
              isDefault: false,
              password: null,
              details: { meetingUrl: null, tenantId: null, username: null },
            },
          },
        });
        if (result.error) {
          setSubmitError(result.error.message);
        } else {
          await refetch();
        }
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Failed to create config");
      } finally {
        setIsSubmitting(false);
      }
    },
    [createUserMeetingConfig, refetch, targetUserId]
  );

  return {
    labels,
    t,
    configs,
    loading,
    error,
    refetch,
    formOpen,
    editConfig,
    deleteId,
    showSuccess,
    errorMessage,
    deleting,
    settingDefault,
    deleteLabel,
    setDeleteId,
    setShowSuccess,
    setErrorMessage,
    handleSaved,
    handleConfirmDelete,
    handleSetDefault,
    openCreateForm,
    openEditForm,
    closeForm,
    generationStatus,
    lastGeneratedUrl,
    generationError,
    generatePreview,
    resetGeneration,
    regenerateConfig,
    generating,
    requiresReconnect,
    reauthProviders,
    onReconnect: handleReconnect,
    disconnectProvider,
    disconnecting,
    connectProvider: handleReconnect,
    connectProviderAccountItems,
    expandedBookingsId,
    bookingsInstances,
    bookingsLoading: weeklyScheduleQuery.loading,
    handleViewBookings,
    submitAutoConfig,
    isSubmitting,
    submitError,
  };
}

export type MeetingConfigsManagerViewModel = ReturnType<typeof useMeetingConfigsManagerViewModel>;
