"use client";

import { useParams } from "next/navigation";
import type { ClassInstanceDetail } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { formatScheduleTimeOnly } from "@/frontend/common/views/dashboard/admin/home/utils/formatScheduleTime";
import { useClassActionHandlers } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassActionHandlers";
import { useClassDetailsContainerState } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsContainerState";
import { useClassDetailsPermissions } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsPermissions";
import { useClassDetailsData } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsQuery";
import { useClassMutations } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassMutations";
import { useEventLogDownload } from "@/frontend/common/views/dashboard/classes/details/hooks/useEventLogDownload";
import { formatClassDetailDate } from "@/frontend/common/views/dashboard/classes/details/types";
import { useRouter } from "@/shared/i18n/routing";
import { type ClassDetailsLabels, useAppTranslation } from "@/shared/locale";

const noopAsync = () => Promise.resolve();

const noopSessionActionProps = {
  onStart: noopAsync,
  onAbsent: noopAsync,
  onLeave: noopAsync,
  onReset: noopAsync,
  isStarting: false,
  isMarkingAbsent: false,
  isProcessingLeave: false,
  isResetting: false,
  error: null,
};

type Translations = ClassDetailsLabels;
type Handlers = ReturnType<typeof useClassActionHandlers>;
type FeedbackState = { readonly message: string; readonly severity: "success" | "error" } | null;

type CommonViewModelFields = {
  readonly canOverride: boolean;
  readonly isParentView: boolean;
  readonly isWarningDismissed: boolean;
  readonly setIsWarningDismissed: (value: boolean) => void;
  readonly handlers: Handlers;
  readonly sessionActionProps: {
    readonly onStart: () => Promise<void>;
    readonly onAbsent: () => Promise<void>;
    readonly onLeave: (reason: string) => Promise<void>;
    readonly onReset: () => Promise<void>;
    readonly isStarting: boolean;
    readonly isMarkingAbsent: boolean;
    readonly isProcessingLeave: boolean;
    readonly isResetting: boolean;
    readonly error: null;
  };
  readonly feedbackState: FeedbackState;
  readonly deleteDialogOpen: boolean;
  readonly setDeleteDialogOpen: (value: boolean) => void;
  readonly t: Translations;
  readonly formattedScheduledDate: string;
  readonly formattedStartTime: string;
  readonly formattedEndTime: string;
};

type EarlyReturnStatus = "loading" | "invalidId" | "error";

type EarlyReturnSharedFields = {
  readonly isWarningDismissed: boolean;
  readonly setIsWarningDismissed: (value: boolean) => void;
  readonly handlers: Handlers;
  readonly feedbackState: FeedbackState;
  readonly deleteDialogOpen: boolean;
  readonly setDeleteDialogOpen: (value: boolean) => void;
  readonly t: Translations;
};

function buildEarlyReturnViewModel(status: EarlyReturnStatus, shared: EarlyReturnSharedFields): ClassDetailsViewModel {
  return {
    status,
    instance: null,
    canOverride: false,
    isParentView: false,
    isWarningDismissed: shared.isWarningDismissed,
    setIsWarningDismissed: shared.setIsWarningDismissed,
    handlers: shared.handlers,
    sessionActionProps: noopSessionActionProps,
    feedbackState: shared.feedbackState,
    deleteDialogOpen: shared.deleteDialogOpen,
    setDeleteDialogOpen: shared.setDeleteDialogOpen,
    t: shared.t,
    formattedScheduledDate: "",
    formattedStartTime: "",
    formattedEndTime: "",
  };
}

type MutationsShape = {
  startSession: () => Promise<void>;
  markAbsent: () => Promise<void>;
  processLeave: (reason: string) => Promise<void>;
  resetSession: () => Promise<void>;
  isStarting: boolean;
  isMarkingAbsent: boolean;
  isProcessingLeave: boolean;
  isResetting: boolean;
};

function buildSessionActionProps(mutations: MutationsShape): CommonViewModelFields["sessionActionProps"] {
  return {
    onStart: () => mutations.startSession(),
    onAbsent: () => mutations.markAbsent(),
    onLeave: (reason: string) => mutations.processLeave(reason),
    onReset: () => mutations.resetSession(),
    isStarting: mutations.isStarting,
    isMarkingAbsent: mutations.isMarkingAbsent,
    isProcessingLeave: mutations.isProcessingLeave,
    isResetting: mutations.isResetting,
    error: null,
  };
}

type ReadyInputs = {
  readonly instance: ClassInstanceDetail;
  readonly canOverride: boolean;
  readonly isParentView: boolean;
  readonly isWarningDismissed: boolean;
  readonly setIsWarningDismissed: (value: boolean) => void;
  readonly handlers: Handlers;
  readonly sessionActionProps: CommonViewModelFields["sessionActionProps"];
  readonly feedbackState: FeedbackState;
  readonly deleteDialogOpen: boolean;
  readonly setDeleteDialogOpen: (value: boolean) => void;
  readonly t: Translations;
  readonly formattedScheduledDate: string;
  readonly formattedStartTime: string;
  readonly formattedEndTime: string;
};

function buildReadyViewModel(inputs: ReadyInputs): ClassDetailsViewModel {
  return {
    status: "ready",
    instance: inputs.instance,
    canOverride: inputs.canOverride,
    isParentView: inputs.isParentView,
    isWarningDismissed: inputs.isWarningDismissed,
    setIsWarningDismissed: inputs.setIsWarningDismissed,
    handlers: inputs.handlers,
    sessionActionProps: inputs.sessionActionProps,
    feedbackState: inputs.feedbackState,
    deleteDialogOpen: inputs.deleteDialogOpen,
    setDeleteDialogOpen: inputs.setDeleteDialogOpen,
    t: inputs.t,
    formattedScheduledDate: inputs.formattedScheduledDate,
    formattedStartTime: inputs.formattedStartTime,
    formattedEndTime: inputs.formattedEndTime,
  };
}

export interface ClassDetailsViewModel {
  readonly status: "loading" | "invalidId" | "error" | "ready";
  readonly instance: ClassInstanceDetail | null;
  readonly canOverride: boolean;
  readonly isParentView: boolean;
  readonly isWarningDismissed: boolean;
  readonly setIsWarningDismissed: (value: boolean) => void;
  readonly handlers: ReturnType<typeof useClassActionHandlers>;
  readonly sessionActionProps: {
    readonly onStart: () => Promise<void>;
    readonly onAbsent: () => Promise<void>;
    readonly onLeave: (reason: string) => Promise<void>;
    readonly onReset: () => Promise<void>;
    readonly isStarting: boolean;
    readonly isMarkingAbsent: boolean;
    readonly isProcessingLeave: boolean;
    readonly isResetting: boolean;
    readonly error: null;
  };
  readonly feedbackState: { readonly message: string; readonly severity: "success" | "error" } | null;
  readonly deleteDialogOpen: boolean;
  readonly setDeleteDialogOpen: (value: boolean) => void;
  readonly t: ClassDetailsLabels;
  readonly formattedScheduledDate: string;
  readonly formattedStartTime: string;
  readonly formattedEndTime: string;
}

export function useClassDetailsViewModel(): ClassDetailsViewModel {
  const router = useRouter();
  const locale = useAppLocale();
  const t = useAppTranslation().dashboardTranslations.classDetails;

  const params = useParams();
  const rawId = params?.id;
  const id = typeof rawId === "string" ? rawId : "";
  const hasPermission = useUserStore(state => state.hasPermission);

  const {
    isWarningDismissed,
    setIsWarningDismissed,
    feedbackState,
    setFeedbackState,
    shouldLoadEvents,
    setShouldLoadEvents,
    deleteDialogOpen,
    setDeleteDialogOpen,
  } = useClassDetailsContainerState();

  const { data, loading, error } = useClassDetailsData(id);
  useEventLogDownload(id, shouldLoadEvents, setShouldLoadEvents, setFeedbackState, t);

  const mutations = useClassMutations({
    id,
    onError: message => setFeedbackState({ message, severity: "error" }),
  });

  const handlers = useClassActionHandlers(id, mutations, router, setFeedbackState, t);
  const { canOverride, isParentView } = useClassDetailsPermissions(hasPermission);

  const earlyReturnShared = {
    isWarningDismissed,
    setIsWarningDismissed,
    handlers,
    feedbackState,
    deleteDialogOpen,
    setDeleteDialogOpen,
    t,
  };

  if (loading) {
    return buildEarlyReturnViewModel("loading", earlyReturnShared);
  }

  if (!id) {
    return buildEarlyReturnViewModel("invalidId", earlyReturnShared);
  }

  if (error || !data?.classInstance) {
    return buildEarlyReturnViewModel("error", earlyReturnShared);
  }

  const instance = data.classInstance as ClassInstanceDetail;
  const formattedScheduledDate = formatClassDetailDate(instance.scheduledDate, locale);
  const formattedStartTime = formatScheduleTimeOnly(instance.startTime, locale);
  const formattedEndTime = formatScheduleTimeOnly(instance.endTime, locale);

  return buildReadyViewModel({
    instance,
    canOverride,
    isParentView,
    isWarningDismissed,
    setIsWarningDismissed,
    handlers,
    sessionActionProps: buildSessionActionProps(mutations),
    feedbackState,
    deleteDialogOpen,
    setDeleteDialogOpen,
    t,
    formattedScheduledDate,
    formattedStartTime,
    formattedEndTime,
  });
}
