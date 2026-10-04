"use client";

import type { ClassSessionActionButtonSharedOptions } from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/classSessionActionButtonShared.helpers";
import { LeaveClassActionButtonPart } from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/classSessionActionButtonShared.leave.parts";
import {
  ContactAdminActionButtonPart,
  ViewClassAuditActionButtonPart,
} from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/classSessionActionButtonShared.parts";
import type { ClassSessionAction } from "@/frontend/common/views/dashboard/schedule/alerts/types";

export type { ClassSessionActionButtonSharedOptions };

export interface ClassSessionActionButtonSharedProps {
  readonly action: ClassSessionAction;
  readonly classId: string;
  readonly labels: {
    readonly joinSession: string;
    readonly leaveClass: string;
    readonly leaveDisabledReason: string;
    readonly viewClassAudit: string;
    readonly contactAdmin: string;
  };
  readonly onLeave: (id: string) => void;
  readonly onViewClassAudit: (id: string) => void;
  readonly fullWidth?: boolean;
  readonly options: ClassSessionActionButtonSharedOptions;
}

export function ClassSessionActionButtonShared({
  action,
  classId,
  labels,
  onLeave,
  onViewClassAudit,
  fullWidth = false,
  options,
}: Readonly<ClassSessionActionButtonSharedProps>) {
  if (action === "join_session") {
    return null;
  }

  if (action === "contact_admin") {
    return (
      <ContactAdminActionButtonPart
        classId={classId}
        label={labels.contactAdmin}
        fullWidth={fullWidth}
        options={options}
      />
    );
  }

  if (action === "view_class_audit") {
    return (
      <ViewClassAuditActionButtonPart
        classId={classId}
        label={labels.viewClassAudit}
        fullWidth={fullWidth}
        options={options}
        onViewClassAudit={onViewClassAudit}
      />
    );
  }

  return (
    <LeaveClassActionButtonPart
      classId={classId}
      label={labels.leaveClass}
      fullWidth={fullWidth}
      options={options}
      disabled={action === "leave_disabled"}
      disabledReason={labels.leaveDisabledReason}
      onLeave={onLeave}
    />
  );
}
