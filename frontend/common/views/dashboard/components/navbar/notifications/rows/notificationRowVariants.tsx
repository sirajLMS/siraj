"use client";

import {
  CancelOutlined,
  CheckCircleOutlined,
  ContentCopyOutlined,
  EventBusyOutlined,
  EventOutlined,
  ExitToAppOutlined,
  FactCheckOutlined,
  ForumOutlined,
  LightbulbOutlined,
  PaymentOutlined,
  PersonOffOutlined,
  PersonOutlined,
  PlayArrowOutlined,
  PlayCircleOutlined,
  RateReviewOutlined,
  ReceiptLongOutlined,
  ReceiptOutlined,
  ReportProblemOutlined,
  RestartAltOutlined,
  ScheduleOutlined,
  SwapHorizOutlined,
  ThumbUpAltOutlined,
  UpdateOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { NotificationDrawerAlert } from "@/frontend/common/views/dashboard/components/navbar/notifications/types/notificationDrawer.types";
import type { NotificationMetadata } from "@/shared/types/notification-alerts.types";

export interface EventVariantConfig {
  readonly icon: ReactNode;
  readonly iconColor: (theme: Theme) => string;
  readonly accentColor: (theme: Theme) => string;
}

const infoAccent = (theme: Theme) => theme.palette.info.main;
const warningAccent = (theme: Theme) => theme.palette.warning.main;
const errorAccent = (theme: Theme) => theme.palette.error.main;
const successAccent = (theme: Theme) => theme.palette.success.main;
const primaryAccent = (theme: Theme) => theme.palette.primary.main;

const EVENT_VARIANT_CONFIG: Record<NotificationEventType, EventVariantConfig> = {
  [NotificationEventType.ClassScheduled]: {
    icon: <EventOutlined fontSize="small" />,
    iconColor: primaryAccent,
    accentColor: primaryAccent,
  },
  [NotificationEventType.ClassActivated]: {
    icon: <PlayCircleOutlined fontSize="small" />,
    iconColor: infoAccent,
    accentColor: infoAccent,
  },
  [NotificationEventType.ClassStarted]: {
    icon: <PlayArrowOutlined fontSize="small" />,
    iconColor: successAccent,
    accentColor: successAccent,
  },
  [NotificationEventType.ClassCompleted]: {
    icon: <CheckCircleOutlined fontSize="small" />,
    iconColor: successAccent,
    accentColor: successAccent,
  },
  [NotificationEventType.ClassCancelled]: {
    icon: <CancelOutlined fontSize="small" />,
    iconColor: errorAccent,
    accentColor: errorAccent,
  },
  [NotificationEventType.ClassRescheduled]: {
    icon: <UpdateOutlined fontSize="small" />,
    iconColor: warningAccent,
    accentColor: warningAccent,
  },
  [NotificationEventType.ClassReset]: {
    icon: <RestartAltOutlined fontSize="small" />,
    iconColor: warningAccent,
    accentColor: warningAccent,
  },
  [NotificationEventType.ClassReminder]: {
    icon: <ScheduleOutlined fontSize="small" />,
    iconColor: infoAccent,
    accentColor: infoAccent,
  },
  [NotificationEventType.ClassLeaveRequested]: {
    icon: <ExitToAppOutlined fontSize="small" />,
    iconColor: warningAccent,
    accentColor: warningAccent,
  },
  [NotificationEventType.ClassMarkedAbsent]: {
    icon: <PersonOffOutlined fontSize="small" />,
    iconColor: errorAccent,
    accentColor: errorAccent,
  },
  [NotificationEventType.ClassMarkedMissed]: {
    icon: <EventBusyOutlined fontSize="small" />,
    iconColor: errorAccent,
    accentColor: errorAccent,
  },
  [NotificationEventType.InvoiceGenerated]: {
    icon: <ReceiptLongOutlined fontSize="small" />,
    iconColor: infoAccent,
    accentColor: infoAccent,
  },
  [NotificationEventType.InvoiceStatusChanged]: {
    icon: <ReceiptOutlined fontSize="small" />,
    iconColor: warningAccent,
    accentColor: warningAccent,
  },
  [NotificationEventType.NewComplaint]: {
    icon: <ReportProblemOutlined fontSize="small" />,
    iconColor: warningAccent,
    accentColor: warningAccent,
  },
  [NotificationEventType.ComplaintResponse]: {
    icon: <ForumOutlined fontSize="small" />,
    iconColor: infoAccent,
    accentColor: infoAccent,
  },
  [NotificationEventType.NewSuggestion]: {
    icon: <LightbulbOutlined fontSize="small" />,
    iconColor: infoAccent,
    accentColor: infoAccent,
  },
  [NotificationEventType.SuggestionAcknowledged]: {
    icon: <ThumbUpAltOutlined fontSize="small" />,
    iconColor: successAccent,
    accentColor: successAccent,
  },
  [NotificationEventType.SuggestionDuplicateMarked]: {
    icon: <ContentCopyOutlined fontSize="small" />,
    iconColor: warningAccent,
    accentColor: warningAccent,
  },
  [NotificationEventType.PaymentMethodChanged]: {
    icon: <PaymentOutlined fontSize="small" />,
    iconColor: infoAccent,
    accentColor: infoAccent,
  },
  [NotificationEventType.StudentStatusChanged]: {
    icon: <PersonOutlined fontSize="small" />,
    iconColor: infoAccent,
    accentColor: infoAccent,
  },
  [NotificationEventType.StudentQuotaOverridden]: {
    icon: <WarningAmberOutlined fontSize="small" />,
    iconColor: warningAccent,
    accentColor: warningAccent,
  },
  [NotificationEventType.StudentTeacherReassigned]: {
    icon: <SwapHorizOutlined fontSize="small" />,
    iconColor: infoAccent,
    accentColor: infoAccent,
  },
  [NotificationEventType.LessonReportSubmitted]: {
    icon: <RateReviewOutlined fontSize="small" />,
    iconColor: warningAccent,
    accentColor: warningAccent,
  },
  [NotificationEventType.LessonReportReviewed]: {
    icon: <FactCheckOutlined fontSize="small" />,
    iconColor: successAccent,
    accentColor: successAccent,
  },
  [NotificationEventType.QuotaExpiringSoon]: {
    icon: <ScheduleOutlined fontSize="small" />,
    iconColor: warningAccent,
    accentColor: warningAccent,
  },
  [NotificationEventType.QuotaExpired]: {
    icon: <CancelOutlined fontSize="small" />,
    iconColor: errorAccent,
    accentColor: errorAccent,
  },
  [NotificationEventType.QuotaLowBalance]: {
    icon: <WarningAmberOutlined fontSize="small" />,
    iconColor: warningAccent,
    accentColor: warningAccent,
  },
  [NotificationEventType.OnDemandInstancePendingCredit]: {
    icon: <WarningAmberOutlined fontSize="small" />,
    iconColor: warningAccent,
    accentColor: warningAccent,
  },
  [NotificationEventType.OnDemandInstanceReminderT3]: {
    icon: <ScheduleOutlined fontSize="small" />,
    iconColor: infoAccent,
    accentColor: infoAccent,
  },
  [NotificationEventType.OnDemandInstanceReminderT1]: {
    icon: <ScheduleOutlined fontSize="small" />,
    iconColor: warningAccent,
    accentColor: warningAccent,
  },
  [NotificationEventType.OnDemandTeacherDailyDigest]: {
    icon: <FactCheckOutlined fontSize="small" />,
    iconColor: infoAccent,
    accentColor: infoAccent,
  },
  [NotificationEventType.PasswordResetByAdmin]: {
    icon: <ReportProblemOutlined fontSize="small" />,
    iconColor: warningAccent,
    accentColor: warningAccent,
  },
  [NotificationEventType.UserStatusChanged]: {
    icon: <PersonOutlined fontSize="small" />,
    iconColor: infoAccent,
    accentColor: infoAccent,
  },
  [NotificationEventType.AccountingPaymentRecorded]: {
    icon: <PaymentOutlined fontSize="small" />,
    iconColor: successAccent,
    accentColor: successAccent,
  },
  [NotificationEventType.AccountingLowHours]: {
    icon: <WarningAmberOutlined fontSize="small" />,
    iconColor: warningAccent,
    accentColor: warningAccent,
  },
};

const COMPLAINT_BUCKET_VARIANT: EventVariantConfig = {
  icon: <ReportProblemOutlined fontSize="small" />,
  iconColor: warningAccent,
  accentColor: warningAccent,
};

export function resolveEventVariant(alert: NotificationDrawerAlert): EventVariantConfig {
  if (alert.type === "complaint" || alert.eventType == null) {
    return COMPLAINT_BUCKET_VARIANT;
  }

  return EVENT_VARIANT_CONFIG[alert.eventType] ?? COMPLAINT_BUCKET_VARIANT;
}

export function isInvoiceMetadata(
  metadata: NotificationMetadata | null | undefined
): metadata is NotificationMetadata & { readonly entityKind: "invoice" } {
  return metadata?.entityKind === "invoice";
}

export function isClassMetadata(
  metadata: NotificationMetadata | null | undefined
): metadata is NotificationMetadata & { readonly entityKind: "class" } {
  return metadata?.entityKind === "class";
}
