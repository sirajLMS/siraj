"use client";

import { useTranslations } from "next-intl";
import { useParentComplaintsStore } from "@/frontend/stores/mockParentComplaintsStore";
import { useUserStore } from "@/frontend/stores/mockUserStore";
import { ParentComplaintsView } from "./ParentComplaintsView";
import { buildComplaintsLabels } from "./utils/buildComplaintsLabels";

export function ParentComplaintsContainer() {
  const t = useTranslations("dashboard.complaints");
  const permissions = useUserStore(state => state.permissions);

  const studentOptions = useParentComplaintsStore(state => state.studentOptions);
  const records = useParentComplaintsStore(state => state.records);
  const hasOlderRecords = useParentComplaintsStore(state => state.hasOlderRecords);
  const isSubmitting = useParentComplaintsStore(state => state.isSubmitting);
  const showSuccess = useParentComplaintsStore(state => state.showSuccess);
  const setSubmitting = useParentComplaintsStore(state => state.setSubmitting);
  const resetSuccess = useParentComplaintsStore(state => state.resetSuccess);
  const submitComplaint = useParentComplaintsStore(state => state.submitComplaint);
  const loadOlderRecords = useParentComplaintsStore(state => state.loadOlderRecords);

  const canSubmit = permissions.includes("complaints-submit");

  if (!canSubmit) {
    return null;
  }

  const labels = buildComplaintsLabels(t);

  const handleSubmit = (data: Parameters<typeof submitComplaint>[0]) => {
    setSubmitting(true);
    resetSuccess();
    submitComplaint(data);
    setSubmitting(false);
  };

  return (
    <ParentComplaintsView
      labels={labels.parent}
      studentOptions={studentOptions}
      records={records}
      hasOlderRecords={hasOlderRecords}
      isSubmitting={isSubmitting}
      showSuccess={showSuccess}
      canSubmit={canSubmit}
      onSubmit={handleSubmit}
      onDismissSuccess={resetSuccess}
      onLoadOlderRecords={loadOlderRecords}
    />
  );
}
