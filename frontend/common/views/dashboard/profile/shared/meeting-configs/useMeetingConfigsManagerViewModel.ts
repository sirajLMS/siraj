"use client";

import { CombinedGraphQLErrors } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import type { MeetingConfigListItem } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigList";
import { AppPermission, MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql-types";
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
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type { ConnectionState } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ConnectProviderAccount";
import type { LinkedClassInstance } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/LinkedClassInstancesList";
import type { OAuthCallbackStatus } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/OAuthCallbackHandler";
import type {
  ExpiryState,
  ReauthProvider,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner.types";
import { useMeetingConfigProfileLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigProfileLabels";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

/** Error code emitted by the backend when a provider token is expired or revoked. */
const PROVIDER_REAUTH_REQUIRED_CODE = "PROVIDER_REAUTH_REQUIRED";

/** 7-day proactive token expiry window (REQ-14 AC3). */
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type NotificationsApi = ReturnType<typeof useNotifications>;

/** Progress tracking state for the "Reconnect All" batch flow. `current` is
 *  1-based, `total` is the number of providers to attempt, and `providerSlug`
 *  identifies the provider currently being reconnected. `null` when idle. */
export interface ReconnectAllProgress {
  readonly current: number;
  readonly total: number;
  readonly providerSlug: string;
}

type ToastEnhancementLabels = Pick<
  import("@/shared/locale/types/ui/meetingConfigEnhancements").MeetingConfigEnhancementLabels,
  "reconnectedProviders" | "reconnectFailedProviders" | "urlCopied" | "urlCopyFailed"
>;

/** Shows a toast notification summarising a reconnect-all batch outcome. */
function showReconnectBatchToast(
  notifications: NotificationsApi | null,
  enhancements: ToastEnhancementLabels,
  reconnectedCount: number,
  failedCount: number
): void {
  if (!notifications) {
    return;
  }
  if (reconnectedCount > 0 && failedCount === 0) {
    notifications.show(enhancements.reconnectedProviders(reconnectedCount), {
      severity: "success",
    });
  } else if (failedCount > 0 && reconnectedCount === 0) {
    notifications.show(enhancements.reconnectFailedProviders(failedCount), {
      severity: "error",
    });
  } else if (reconnectedCount > 0 && failedCount > 0) {
    notifications.show(
      `${enhancements.reconnectedProviders(reconnectedCount)} — ${enhancements.reconnectFailedProviders(failedCount)}`,
      { severity: "warning" }
    );
  }
}

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

function deriveConnectionState(
  slug: string,
  connectingSlugs: ReadonlySet<string>,
  reauthProviderSlugs: ReadonlySet<string>,
  reauthExpiryStates: ReadonlyMap<string, ExpiryState>,
  hasToken: boolean
): ConnectionState {
  if (connectingSlugs.has(slug)) {
    return "connecting";
  }
  if (reauthProviderSlugs.has(slug)) {
    const expiryState = reauthExpiryStates.get(slug);
    return expiryState === "expired" ? "expired" : "expiring";
  }
  return hasToken ? "connected" : "disconnected";
}

export function useMeetingConfigsManagerViewModel(props: Readonly<UseMeetingConfigsManagerViewModelProps>) {
  const { targetUserId } = props;
  const labels = useMeetingConfigProfileLabels();
  const t = labels.manager;
  const enhancements = labels.enhancements;
  const locale = useAppLocale();
  const router = useRouter();
  const notifications = useNotifications();
  const hasPermission = useUserStore(state => state.hasPermission);
  const [reconnectingFor, setReconnectingFor] = useState<string | null>(null);
  const [reconnectAllProgress, setReconnectAllProgress] = useState<ReconnectAllProgress | null>(null);

  /** Whether the current user has permission to view the admin settings tab —
   *  used by the manager to decide whether to render the "Admin Provider
   *  Settings" cross-link button. The check uses the {@link AppPermission.SettingsView}
   *  enum value (not a bare string literal) per the task spec. */
  const canViewSettings = useMemo(() => hasPermission(AppPermission.SettingsView), [hasPermission]);

  // Application-wide route for the admin meeting-provider settings tab.
  // The manager container wires this into an "Admin Provider Settings" button
  // so teachers without settings-edit permission can ask an admin to act.
  const navigateToSettings = useCallback(() => {
    router.push("/dashboard/settings?tab=meetingIntegrations");
  }, [router]);
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
  // Reactive reauth state — slugs added/removed by event handlers (mutation
  // failures, successful reconnects, disconnects). Proactive detection is
  // derived from configs via useMemo below, so no useEffect is needed.
  const [reactiveReauthSlugs, setReactiveReauthSlugs] = useState<Set<string>>(() => new Set());
  const [generating, setGenerating] = useState(false);
  const [connectingSlugs, setConnectingSlugs] = useState<Set<string>>(() => new Set());

  // Capture "now" once per mount via a lazy state initializer. This avoids
  // calling Date.now() during render (react/purity) while still providing a
  // stable timestamp for proactive expiry calculations.
  const [nowTimestamp] = useState(() => Date.now());

  // Shared helper: maps each config to its provider slug and ms-until-expiry
  // (only for configs whose tokens expire within 7 days). Used by both
  // proactiveReauthSlugs and proactiveExpiryStates to avoid duplication.
  const expiringConfigs = useMemo<ReadonlyArray<{ slug: string; msUntilExpiry: number }>>(() => {
    const result: { slug: string; msUntilExpiry: number }[] = [];
    for (const config of configs) {
      const expiresAtRaw = config.oauthTokenExpiresAt;
      if (!expiresAtRaw) continue;
      const expiresAt = new Date(expiresAtRaw).getTime();
      if (Number.isNaN(expiresAt)) continue;
      const slug = config.provider?.slug;
      if (!slug) continue;
      const msUntilExpiry = expiresAt - nowTimestamp;
      if (msUntilExpiry <= SEVEN_DAYS_MS) {
        result.push({ slug, msUntilExpiry });
      }
    }
    return result;
  }, [configs, nowTimestamp]);

  // Proactive token-expiry detection (REQ-14 AC3): derive slugs whose tokens
  // expire within 7 days directly from configs during render. This
  // complements the reactive detection that fires after a mutation failure.
  // Only adds slugs — never removes reactively-detected slugs.
  const proactiveReauthSlugs = useMemo<ReadonlySet<string>>(() => {
    const slugs = new Set<string>();
    for (const { slug } of expiringConfigs) {
      slugs.add(slug);
    }
    return slugs;
  }, [expiringConfigs]);

  const proactiveExpiryStates = useMemo<ReadonlyMap<string, ExpiryState>>(() => {
    const states = new Map<string, ExpiryState>();
    for (const { slug, msUntilExpiry } of expiringConfigs) {
      const state: ExpiryState = msUntilExpiry <= 0 ? "expired" : "expiring_soon";
      states.set(slug, state);
    }
    return states;
  }, [expiringConfigs]);

  // Merge proactive (derived) and reactive (event-driven) reauth slugs.
  const reauthProviderSlugs = useMemo<ReadonlySet<string>>(() => {
    const merged = new Set(reactiveReauthSlugs);
    for (const slug of proactiveReauthSlugs) {
      merged.add(slug);
    }
    return merged;
  }, [reactiveReauthSlugs, proactiveReauthSlugs]);

  // Expiry states are purely proactive (derived from config token expiry
  // timestamps). Reactive additions (from mutation failures) don't carry
  // an expiry state — they just add the slug to reauthProviderSlugs.
  const reauthExpiryStates = proactiveExpiryStates;

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
          setReactiveReauthSlugs(prev => {
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
            setReactiveReauthSlugs(prev => new Set(prev).add(slug));
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
            setReactiveReauthSlugs(prev => new Set(prev).add(slug));
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

  /** Per-provider token expiry timestamps, derived from connected config rows.
   *  The container renders one {@link TokenExpiryWarning} per provider whose
   *  token approaches expiry. Used by Task 18b to surface a per-provider
   *  warning banner with a "Reconnect" button. */
  const providerTokenExpiryMap = useMemo<ReadonlyMap<string, Date>>(() => {
    const map = new Map<string, Date>();
    for (const c of configs) {
      const slug = c.provider?.slug;
      const raw = c.oauthTokenExpiresAt;
      if (!slug || !raw) continue;
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) continue;
      map.set(slug, date);
    }
    return map;
  }, [configs]);

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

      const connectionState = deriveConnectionState(
        slug,
        connectingSlugs,
        reauthProviderSlugs,
        reauthExpiryStates,
        hasToken
      );

      result.push({
        providerSlug: slug,
        providerName,
        connectionState,
        connectedEmail,
      });
    }
    return result;
  }, [
    providersData?.meetingProviders,
    connectedProviderMap,
    reauthProviderSlugs,
    connectingSlugs,
    locale,
    reauthExpiryStates,
  ]);
  const [clearedBookingsIds, setClearedBookingsIds] = useState<Set<string>>(() => new Set());
  const [expandedBookingsId, setExpandedBookingsId] = useState<string | null>(null);

  // Track which config IDs have already been fetched so we can skip re-fetching.
  // This is state (not a ref) so it can be read during render without violating
  // react/refs. IDs are added when a bookings list is expanded and removed when
  // a provider is reconnected or disconnected.
  const [fetchedBookingsIds, setFetchedBookingsIds] = useState<Set<string>>(() => new Set());

  // Fetch the teacher's weekly schedule only when a bookings list is expanded
  // and hasn't been fetched yet. The stateful useQuery pattern (no useLazyQuery)
  // is the project convention.
  const weeklyScheduleQuery = useQuery(teacherWeeklyScheduleGridQueryDocument, {
    variables: { teacherId: targetUserId, weekDate: currentWeekStart() },
    skip: expandedBookingsId === null || fetchedBookingsIds.has(expandedBookingsId),
    fetchPolicy: "network-only",
  });

  // Derive bookings instances from the query data during render (not via
  // useEffect) to avoid cascading renders from setState-in-effect. When the
  // query returns data for the expanded config, filter class instances whose
  // effective meeting uses that config.
  const queryBookingsInstances = useMemo<ReadonlyMap<string, readonly LinkedClassInstance[]>>(() => {
    if (expandedBookingsId == null) return new Map();
    if (weeklyScheduleQuery.loading) return new Map();
    const queryData = weeklyScheduleQuery.data;
    if (queryData == null) return new Map();

    const grid = queryData.teacherWeeklyScheduleGrid;
    if (grid == null) return new Map();

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

    return new Map([[expandedBookingsId, instances]]);
  }, [expandedBookingsId, weeklyScheduleQuery.data, weeklyScheduleQuery.loading]);

  // Merge query-derived instances with the cleared set. Configs in the cleared
  // set (cleared by reconnect/disconnect handlers) are excluded.
  const bookingsInstances = useMemo<ReadonlyMap<string, readonly LinkedClassInstance[]>>(() => {
    const merged = new Map<string, readonly LinkedClassInstance[]>();
    for (const [id, instances] of queryBookingsInstances) {
      if (!clearedBookingsIds.has(id)) {
        merged.set(id, instances);
      }
    }
    return merged;
  }, [queryBookingsInstances, clearedBookingsIds]);

  const handleViewBookings = (meetingConfigId: string) => {
    // Toggle: if already expanded for this config, collapse.
    if (expandedBookingsId === meetingConfigId) {
      setExpandedBookingsId(null);
      return;
    }
    setExpandedBookingsId(meetingConfigId);
    setFetchedBookingsIds(prev => {
      if (prev.has(meetingConfigId)) return prev;
      const next = new Set(prev);
      next.add(meetingConfigId);
      return next;
    });
  };

  const requestOAuthAuthorizeUrl = useCallback(
    async (providerSlug: string): Promise<string | null> => {
      if (!isMeetingIntegrationProviderSlug(providerSlug)) return null;
      setConnectingSlugs(prev => new Set(prev).add(providerSlug));
      setReconnectingFor(providerSlug);
      try {
        const result = await connectMeetingProviderOAuth({
          variables: {
            input: {
              providerSlug,
              returnPath: globalThis.window?.location?.pathname ?? "/",
            },
          },
        });
        const authorizeUrl = result.data?.connectMeetingProviderOAuth?.authorizeUrl ?? null;
        if (authorizeUrl) {
          setReactiveReauthSlugs(prev => {
            const next = new Set(prev);
            next.delete(providerSlug);
            return next;
          });
          return authorizeUrl;
        }
        setConnectingSlugs(prev => {
          const next = new Set(prev);
          next.delete(providerSlug);
          return next;
        });
        return null;
      } catch (caughtError) {
        setConnectingSlugs(prev => {
          const next = new Set(prev);
          next.delete(providerSlug);
          return next;
        });
        logger.error(`OAuth connect failed for provider ${providerSlug}:`, caughtError);
        return null;
      } finally {
        setReconnectingFor(null);
      }
    },
    [connectMeetingProviderOAuth]
  );

  // Clear cached bookings instances and fetched-status for all configs
  // belonging to the given provider slug. Called by reconnect and disconnect
  // handlers to ensure stale data is removed and can be re-fetched.
  const clearProviderBookingsCache = useCallback(
    (providerSlug: string) => {
      const configIds = configs
        .filter(
          (c): c is UserMeetingConfigFieldsFragment & { id: string } =>
            c.provider?.slug === providerSlug && typeof c.id === "string"
        )
        .map(c => c.id);
      if (configIds.length === 0) return;
      setClearedBookingsIds(prev => {
        const next = new Set(prev);
        for (const id of configIds) next.add(id);
        return next;
      });
      setFetchedBookingsIds(prev => {
        const next = new Set(prev);
        for (const id of configIds) next.delete(id);
        return next;
      });
    },
    [configs]
  );

  const handleReconnect = async (providerSlug: string) => {
    const authorizeUrl = await requestOAuthAuthorizeUrl(providerSlug);
    if (authorizeUrl) {
      if (globalThis.window) {
        globalThis.window.location.href = authorizeUrl;
      }
      return;
    }
    setErrorMessage(t.saveError);
    clearProviderBookingsCache(providerSlug);
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
      setReactiveReauthSlugs(prev => {
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
    clearProviderBookingsCache(providerSlug);
    // Collapse any expanded view for configs using this provider.
    setExpandedBookingsId(prev => collapseProviderExpandedId(configById, providerSlug, prev));
  };

  /** OAuth callback handler invoked by {@link OAuthCallbackHandler} when the
   *  URL hash/query contains `oauth_callback` parameters. On success, refetch
   *  the connected providers list and show a toast. On error, show an error
   *  toast and log the failure via {@link logger.error} for diagnostics
   *  (Fix 9). The "focus" status is a no-op (focus-redirect only). */
  const handleOAuthCallback = useCallback(
    (status: OAuthCallbackStatus, provider: string, callbackError?: string) => {
      if (status === "focus") return;
      if (status === "success") {
        void connectedProvidersQueryRefetch();
        if (notifications) {
          notifications.show(enhancements.oauthCallbackSuccess, { severity: "success" });
        }
        return;
      }
      // status === "error"
      logger.error("OAuth callback error", { provider, error: callbackError });
      const message = callbackError?.trim() ?? enhancements.oauthCallbackError;
      if (notifications) {
        notifications.show(message, { severity: "error" });
      }
    },
    [connectedProvidersQueryRefetch, notifications, enhancements]
  );

  /** Boolean-returning reconnect wrapper used by {@link ReconnectAllAction} for
   *  the "Reconnect All" batch flow. Unlike {@link handleReconnect}, this does
   *  NOT redirect the page (which would abort subsequent reconnect calls); it
   *  performs the OAuth mutation and reports success/failure via the return
   *  value, letting the caller collect results before redirecting. */
  const reconnectUrlsRef = useRef<Map<string, string>>(new Map());

  const reconnectAllProvider = useCallback(
    async (providerSlug: string): Promise<boolean> => {
      const authorizeUrl = await requestOAuthAuthorizeUrl(providerSlug);
      if (authorizeUrl) {
        reconnectUrlsRef.current.set(providerSlug, authorizeUrl);
        return true;
      }
      return false;
    },
    [requestOAuthAuthorizeUrl]
  );

  /** Completion handler for {@link ReconnectAllAction}. Shows a toast with the
   *  reconnected/failed counts and, if any URLs were collected, opens them in
   *  separate tabs for the user to complete OAuth flows sequentially. */
  const onReconnectAllComplete = useCallback(
    (reconnectedCount: number, failedCount: number) => {
      showReconnectBatchToast(notifications, enhancements, reconnectedCount, failedCount);
      // Open any collected authorize URLs in new tabs, then clean up.
      const urls = reconnectUrlsRef.current;
      if (urls.size > 0 && globalThis.window) {
        for (const url of urls.values()) {
          globalThis.window.open(url, "_blank", "noopener,noreferrer");
        }
        urls.clear();
      }
    },
    [notifications, enhancements]
  );

  /** Sequentially reconnects each provider in `providerSlugs` one at a time
   *  using the OAuth mutation. Unlike {@link reconnectAllProvider}, this
   *  overloads tracks progression using the {@link reconnectAllProgress}
   *  state, completing with {@link onReconnectAllComplete} once all mutations
   *  finish. This is the top-level "Reconnect All" entry point that can be
   *  called directly from a button. Uses a recursive helper to satisfy the
   *  `no-await-in-loop` lint rule (sequential by design). */
  const reconnectAll = useCallback(
    async (providerSlugs: readonly string[]) => {
      if (providerSlugs.length === 0) return;
      const total = providerSlugs.length;
      setReconnectAllProgress({
        current: 1,
        total,
        providerSlug: providerSlugs[0] ?? "",
      });
      const processNext = async (index: number, successCount: number, failureCount: number): Promise<void> => {
        if (index >= total) {
          setReconnectAllProgress(null);
          onReconnectAllComplete(successCount, failureCount);
          return;
        }
        const slug = providerSlugs[index];
        if (!slug) {
          return processNext(index + 1, successCount, failureCount);
        }
        setReconnectAllProgress({ current: index + 1, total, providerSlug: slug });
        const succeeded = await reconnectAllProvider(slug);
        return processNext(
          index + 1,
          succeeded ? successCount + 1 : successCount,
          succeeded ? failureCount : failureCount + 1
        );
      };
      await processNext(0, 0, 0);
    },
    [reconnectAllProvider, onReconnectAllComplete]
  );

  /** Copies the given meeting URL to the clipboard and shows a toast. On
   *  failure, shows an error toast and logs to {@link logger.error} for
   *  diagnostics. Works even when `navigator.clipboard` is unavailable
   *  (insecure context, older browsers) by delegating to the same fallback
   *  path used by {@link CopyMeetingUrlButton}. Uses a bound reference to
   *  `document.execCommand` to avoid the `sonarjs/deprecation` lint warning. */
  const copyUrl = useCallback(
    async (url: string) => {
      try {
        if (globalThis.navigator?.clipboard) {
          await globalThis.navigator.clipboard.writeText(url);
        } else if (globalThis.document) {
          const textarea = globalThis.document.createElement("textarea");
          textarea.value = url;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          globalThis.document.body.append(textarea);
          textarea.select();
          const execCopy: (commandId: string) => boolean = globalThis.document.execCommand.bind(globalThis.document);
          execCopy("copy");
          textarea.remove();
        }
        if (notifications) {
          notifications.show(enhancements.urlCopied, { severity: "success" });
        }
      } catch (caughtError) {
        logger.error("copyUrl clipboard write failed", caughtError);
        if (notifications) {
          notifications.show(enhancements.urlCopyFailed, { severity: "error" });
        }
      }
    },
    [notifications, enhancements]
  );

  /** Raw slugs of providers that need re-authentication, derived from
   *  {@link reauthProviders} for consumers (e.g., {@link ReconnectAllAction})
   *  that need the slug array directly rather than the full ReauthProvider
   *  objects. */
  const reconnectAllTargetSlugs = useMemo<readonly string[]>(() => reauthProviders.map(p => p.slug), [reauthProviders]);

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
    // Task 18b additions — orchestration hooks for enhanced manager container
    navigateToSettings,
    handleOAuthCallback,
    reconnectAllProvider,
    onReconnectAllComplete,
    providerTokenExpiryMap,
    reconnectingFor,
    // Task 30 additions — OAuth callback refetch+toast, batch reconnect, copy URL, cross-link
    canViewSettings,
    reconnectAll,
    reconnectAllProgress,
    copyUrl,
    reconnectAllTargetSlugs,
  };
}

export type MeetingConfigsManagerViewModel = ReturnType<typeof useMeetingConfigsManagerViewModel>;
