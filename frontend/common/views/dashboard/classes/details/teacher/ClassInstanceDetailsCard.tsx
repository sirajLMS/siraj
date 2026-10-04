"use client";

import { BaseCard } from "@/frontend/common/components/ui";
import { SESSION_BADGE_STATUS } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard.constants";
import { ClassInstanceDetailsFields } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard.fields";
import { resolveRateSourceLabel } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard.helpers";
import { ClassInstanceDetailsHeader } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard.parts";
import { ClassInstanceRateSection } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard.rateSection";
import type { ClassInstanceDetailsCardProps } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard.types";

export function ClassInstanceDetailsCard({
  studentId,
  studentName,
  courseModule,
  subjectId,
  subjectName,
  subjectAvatarUrl,
  startTime,
  endTime,
  durationMinutes,
  status,
  rateAmount,
  rateCurrency,
  rateSource,
  isRateOverridden,
  hideStudentField = false,
  hideRateSection = false,
  labels,
}: ClassInstanceDetailsCardProps) {
  const statusKey = SESSION_BADGE_STATUS[status];
  const statusLabel = labels.statusLabels[status];
  const displaySubjectName = subjectName || courseModule;
  const rateSourceLabel = resolveRateSourceLabel(isRateOverridden, rateSource, labels);

  return (
    <BaseCard edgeToEdge>
      <ClassInstanceDetailsHeader title={labels.classInstanceDetails} />
      <ClassInstanceDetailsFields
        studentId={studentId}
        studentName={studentName}
        subjectId={subjectId}
        displaySubjectName={displaySubjectName}
        subjectAvatarUrl={subjectAvatarUrl}
        startTime={startTime}
        endTime={endTime}
        durationMinutes={durationMinutes}
        statusKey={statusKey}
        statusLabel={statusLabel}
        hideStudentField={hideStudentField}
        labels={labels}
      />
      {hideRateSection || rateAmount == null ? null : (
        <ClassInstanceRateSection
          rateAmount={rateAmount}
          rateCurrency={rateCurrency}
          rateSourceLabel={rateSourceLabel}
          labels={labels}
        />
      )}
    </BaseCard>
  );
}
