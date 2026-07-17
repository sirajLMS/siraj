"use client";

import { Box, Typography } from "@mui/material";
import { AppDataGridLoadingOverlay, SectionPanel } from "@/frontend/common/components/ui";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type {
  AssociatedStudents,
  AssociatedStudentsSectionVariantProps,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { useAppTranslation } from "@/shared/locale";

type AssociatedStudentsSectionProps = {
  readonly associatedStudents: AssociatedStudents;
  readonly loading?: boolean;
};

function StudentsLoadingState() {
  return (
    <Box sx={{ minHeight: 220, position: "relative" }}>
      <AppDataGridLoadingOverlay />
    </Box>
  );
}

const lazyViews = createLazyView<AssociatedStudentsSectionVariantProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/profile/parent/sections/associatedStudentsSection.mobile").then(m => ({
      default: m.AssociatedStudentsSectionMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/profile/parent/sections/associatedStudentsSection.desktop").then(m => ({
      default: m.AssociatedStudentsSectionDesktopView,
    }))
);

export function AssociatedStudentsSection({ associatedStudents, loading = false }: AssociatedStudentsSectionProps) {
  const t = useAppTranslation().profileTranslations.parent;
  const rows = associatedStudents?.rows ?? [];

  if (loading && !associatedStudents) {
    return (
      <SectionPanel title={t.sections.students}>
        <StudentsLoadingState />
      </SectionPanel>
    );
  }

  if (rows.length === 0) {
    return (
      <SectionPanel title={t.sections.students}>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {t.students.empty}
        </Typography>
      </SectionPanel>
    );
  }

  const variantProps: AssociatedStudentsSectionVariantProps = {
    rows,
    loading,
    emptyMessage: t.students.empty,
  };

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={variantProps} />;
}
