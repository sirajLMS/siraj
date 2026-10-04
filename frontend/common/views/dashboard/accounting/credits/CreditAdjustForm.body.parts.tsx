"use client";

import { Box, Stack } from "@mui/material";
import {
  CreditAdjustDetailsSection,
  CreditAdjustFormFooter,
} from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.details.parts";
import { CreditAdjustStudentSection } from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.student.parts";
import type { CreditAdjustFormBodyProps } from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.types";

export function CreditAdjustFormBody({ state, actions, errors, draft, labels }: Readonly<CreditAdjustFormBodyProps>) {
  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        pt: 3,
        // Extra bottom room on phones so the form clears the fixed bottom
        // navigation instead of clipping its last fields behind it.
        pb: { xs: 6, md: 3 },
      }}
    >
      <Stack sx={{ gap: 3 }}>
        <CreditAdjustStudentSection
          displayedStudent={state.displayedStudent}
          onStudentChange={actions.onStudentChange}
          studentError={errors.student}
          submitting={state.submitting}
          studentSummary={state.studentSummary}
          balancePreview={state.balancePreview}
          balanceLabel={labels.t.form.balance}
          previewBalance={labels.t.preview.balance}
        />
        <CreditAdjustDetailsSection
          adjustmentTypeTitle={labels.t.adjustmentType.title}
          isCarryover={state.isCarryover}
          carryoverErrors={state.carryoverErrors}
          draft={draft}
          hoursError={errors.hours}
          notesError={errors.notes}
          submitting={state.submitting}
          summaryText={state.summaryText}
          onHoursChange={actions.onHoursChange}
          onNotesChange={actions.onNotesChange}
          onInternalNotesChange={actions.onInternalNotesChange}
          labels={labels}
        />
        <CreditAdjustFormFooter
          submitError={state.submitError}
          submitting={state.submitting}
          onCancel={actions.onCancel}
          onSubmit={actions.onSubmit}
          labels={labels}
        />
      </Stack>
    </Box>
  );
}
