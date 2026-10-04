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

export interface EventVariantConfig {
  readonly icon: ReactNode;
  readonly iconColor: (theme: Theme) => string;
  readonly accentColor: (theme: Theme) => string;
}

type AccentResolver = (theme: Theme) => string;

const infoAccent: AccentResolver = theme => theme.palette.info.main;
const warningAccent: AccentResolver = theme => theme.palette.warning.main;
const errorAccent: AccentResolver = theme => theme.palette.error.main;
const successAccent: AccentResolver = theme => theme.palette.success.main;
const primaryAccent: AccentResolver = theme => theme.palette.primary.main;

function variant(icon: ReactNode, accentColor: AccentResolver): EventVariantConfig {
  return { icon, iconColor: accentColor, accentColor };
}

const small = { fontSize: "small" } as const;

export const EVENT_VARIANT_CONFIG: Record<NotificationEventType, EventVariantConfig> = {
  [NotificationEventType.ClassScheduled]: variant(<EventOutlined {...small} />, primaryAccent),
  [NotificationEventType.ClassActivated]: variant(<PlayCircleOutlined {...small} />, infoAccent),
  [NotificationEventType.ClassStarted]: variant(<PlayArrowOutlined {...small} />, successAccent),
  [NotificationEventType.ClassCompleted]: variant(<CheckCircleOutlined {...small} />, successAccent),
  [NotificationEventType.ClassCancelled]: variant(<CancelOutlined {...small} />, errorAccent),
  [NotificationEventType.ClassRescheduled]: variant(<UpdateOutlined {...small} />, warningAccent),
  [NotificationEventType.ClassReset]: variant(<RestartAltOutlined {...small} />, warningAccent),
  [NotificationEventType.ClassReminder]: variant(<ScheduleOutlined {...small} />, infoAccent),
  [NotificationEventType.ClassLeaveRequested]: variant(<ExitToAppOutlined {...small} />, warningAccent),
  [NotificationEventType.ClassMarkedAbsent]: variant(<PersonOffOutlined {...small} />, errorAccent),
  [NotificationEventType.ClassMarkedMissed]: variant(<EventBusyOutlined {...small} />, errorAccent),
  [NotificationEventType.InvoiceGenerated]: variant(<ReceiptLongOutlined {...small} />, infoAccent),
  [NotificationEventType.InvoiceStatusChanged]: variant(<ReceiptOutlined {...small} />, warningAccent),
  [NotificationEventType.NewComplaint]: variant(<ReportProblemOutlined {...small} />, warningAccent),
  [NotificationEventType.ComplaintResponse]: variant(<ForumOutlined {...small} />, infoAccent),
  [NotificationEventType.NewSuggestion]: variant(<LightbulbOutlined {...small} />, infoAccent),
  [NotificationEventType.SuggestionAcknowledged]: variant(<ThumbUpAltOutlined {...small} />, successAccent),
  [NotificationEventType.SuggestionDuplicateMarked]: variant(<ContentCopyOutlined {...small} />, warningAccent),
  [NotificationEventType.PaymentMethodChanged]: variant(<PaymentOutlined {...small} />, infoAccent),
  [NotificationEventType.StudentStatusChanged]: variant(<PersonOutlined {...small} />, infoAccent),
  [NotificationEventType.StudentQuotaOverridden]: variant(<WarningAmberOutlined {...small} />, warningAccent),
  [NotificationEventType.StudentTeacherReassigned]: variant(<SwapHorizOutlined {...small} />, infoAccent),
  [NotificationEventType.LessonReportSubmitted]: variant(<RateReviewOutlined {...small} />, warningAccent),
  [NotificationEventType.LessonReportReviewed]: variant(<FactCheckOutlined {...small} />, successAccent),
  [NotificationEventType.QuotaExpiringSoon]: variant(<ScheduleOutlined {...small} />, warningAccent),
  [NotificationEventType.QuotaExpired]: variant(<CancelOutlined {...small} />, errorAccent),
  [NotificationEventType.QuotaLowBalance]: variant(<WarningAmberOutlined {...small} />, warningAccent),
  [NotificationEventType.OnDemandInstancePendingCredit]: variant(<WarningAmberOutlined {...small} />, warningAccent),
  [NotificationEventType.OnDemandInstanceReminderT3]: variant(<ScheduleOutlined {...small} />, infoAccent),
  [NotificationEventType.OnDemandInstanceReminderT1]: variant(<ScheduleOutlined {...small} />, warningAccent),
  [NotificationEventType.OnDemandTeacherDailyDigest]: variant(<FactCheckOutlined {...small} />, infoAccent),
  [NotificationEventType.PasswordResetByAdmin]: variant(<ReportProblemOutlined {...small} />, warningAccent),
  [NotificationEventType.UserStatusChanged]: variant(<PersonOutlined {...small} />, infoAccent),
  [NotificationEventType.AccountingPaymentRecorded]: variant(<PaymentOutlined {...small} />, successAccent),
  [NotificationEventType.AccountingLowHours]: variant(<WarningAmberOutlined {...small} />, warningAccent),
};

export const COMPLAINT_BUCKET_VARIANT: EventVariantConfig = variant(
  <ReportProblemOutlined {...small} />,
  warningAccent
);
