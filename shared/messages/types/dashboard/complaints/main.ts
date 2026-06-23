export interface ComplaintValidationLabels {
  readonly studentRequired: string;
  readonly emailRequired: string;
  readonly emailInvalid: string;
  readonly detailsRequired: string;
}

export interface ComplaintsParentLabels {
  readonly pageTitle: string;
  readonly formTitle: string;
  readonly student: string;
  readonly contactEmail: string;
  readonly contactEmailPlaceholder: string;
  readonly complaintDetails: string;
  readonly complaintDetailsPlaceholder: string;
  readonly submit: string;
  readonly successMessage: string;
  readonly policyTitle: string;
  readonly policyBody: string;
  readonly recordTitle: string;
  readonly totalRecords: string;
  readonly loadOlder: string;
  readonly waitingMessage: string;
  readonly adminResponse: string;
  readonly regarding: string;
  readonly validation: ComplaintValidationLabels;
  readonly statusLabels: Record<"pending" | "resolved", string>;
  readonly categoryLabels: Record<"REGARDING_TEACHER" | "REGARDING_SYSTEM" | "OTHER", string>;
}

export interface ComplaintsAdminLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly metrics: {
    readonly unanswered: string;
    readonly answered: string;
    readonly avgResolution: string;
    readonly efficiencyNote: string;
  };
  readonly tabs: {
    readonly unanswered: string;
    readonly answered: string;
  };
  readonly searchPlaceholder: string;
  readonly queue: {
    readonly received: string;
    readonly yourResponse: string;
    readonly responsePlaceholder: string;
    readonly answer: string;
    readonly answerAndEmail: string;
    readonly adminResponse: string;
    readonly noEntries: string;
  };
  readonly priorityLabels: Record<"urgent" | "general", string>;
  readonly categoryLabels: Record<"REGARDING_TEACHER" | "REGARDING_SYSTEM" | "OTHER", string>;
}

export interface ComplaintsLabels {
  readonly parent: ComplaintsParentLabels;
  readonly admin: ComplaintsAdminLabels;
}
