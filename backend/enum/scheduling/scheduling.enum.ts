export enum LeaveRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  RESCHEDULED = "RESCHEDULED",
  CANCELLED = "CANCELLED",
}

export enum LeaveRequesterType {
  TEACHER = "TEACHER",
  PARENT = "PARENT",
  ADMIN = "ADMIN",
}

export enum VacationRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum RescheduleDateLabel {
  NEW_DATE = "new_date",
  LEAVE_REQUEST = "leave_request",
}

export enum SchedulingMode {
  NUMBER_OF_CLASSES = "NUMBER_OF_CLASSES",
  ON_DEMAND = "ON_DEMAND",
  QUOTA = "QUOTA",
}

export enum OnDemandNoCreditsOutcome {
  AUTO_CANCEL = "AUTO_CANCEL",
  AUTO_ABSENT_NO_CREDITS = "AUTO_ABSENT_NO_CREDITS",
  REMIND_ONLY = "REMIND_ONLY",
}

export enum OnDemandStatus {
  PENDING_CREDIT = "PENDING_CREDIT",
  AVAILABLE = "AVAILABLE",
  NO_CREDITS_CANCELLED = "NO_CREDITS_CANCELLED",
  NO_CREDITS_ABSENT = "NO_CREDITS_ABSENT",
  CANCELLED = "CANCELLED",
}
