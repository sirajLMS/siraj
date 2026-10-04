"use client";

import type { ComponentType, ReactElement, ReactNode } from "react";
import type { StudentQuotaContentSharedProps } from "@/frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaShared.content.types";
import { loadingContent } from "@/frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaShared.helpers";
import { QuotaFormCardShared } from "@/frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaShared.parts";
import type { StudentQuotaTierConfig } from "@/frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaShared.types";
import type { StudentQuotaViewModel } from "@/frontend/common/views/dashboard/students/quota/useStudentQuotaViewModel";

function LoadingContent(): ReactElement {
  return loadingContent;
}

function StudentQuotaContent({
  t,
  tc,
  studentData,
  embedded,
  readOnly,
  isSaving,
  isSaved,
  canEditIdentity,
  canEditQuota,
  canViewQuota,
  canViewTeacher,
  methods,
  onSubmit,
  onCancel,
  tier,
}: Readonly<StudentQuotaContentSharedProps>): ReactElement | null {
  if (!studentData) {
    return embedded ? loadingContent : null;
  }

  return (
    <QuotaFormCardShared
      t={t}
      tc={tc}
      methods={methods}
      onSubmit={onSubmit}
      studentData={studentData}
      isSaving={isSaving}
      isSaved={isSaved}
      readOnly={readOnly}
      embedded={embedded}
      onCancel={onCancel}
      canEditIdentity={canEditIdentity}
      canEditQuota={canEditQuota}
      canViewQuota={canViewQuota}
      canViewTeacher={canViewTeacher}
      tier={tier}
    />
  );
}

export interface StudentQuotaViewProps {
  readonly props: Readonly<StudentQuotaViewModel>;
  readonly tier: StudentQuotaTierConfig;
  readonly PageContainer: ComponentType<{ readonly children: ReactNode }>;
}

export function StudentQuotaView({ props, tier, PageContainer }: Readonly<StudentQuotaViewProps>): ReactElement {
  const { studentData, embedded } = props;
  if (!studentData && !embedded) {
    return (
      <PageContainer>
        <LoadingContent />
      </PageContainer>
    );
  }

  const content = (
    <StudentQuotaContent
      t={props.t}
      tc={props.tc}
      studentData={studentData}
      embedded={embedded}
      readOnly={props.readOnly}
      isSaving={props.isSaving}
      isSaved={props.isSaved}
      canEditIdentity={props.canEditIdentity}
      canEditQuota={props.canEditQuota}
      canViewQuota={props.canViewQuota}
      canViewTeacher={props.canViewTeacher}
      methods={props.methods}
      onSubmit={props.onSubmit}
      onCancel={props.onCancel}
      tier={tier}
    />
  );

  if (embedded) {
    return content ?? <LoadingContent />;
  }

  return <PageContainer>{content}</PageContainer>;
}
