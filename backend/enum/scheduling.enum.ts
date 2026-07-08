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
