"use client";

import { Box, Typography } from "@mui/material";
import { AppDataGridLoadingOverlay, SectionPanel } from "@/frontend/common/components/ui";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { AssociatedStudentsSectionVariantProps } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import type { UseAssociatedStudentsSectionViewModelProps } from "@/frontend/common/views/dashboard/profile/parent/useAssociatedStudentsSectionViewModel";
import { useAssociatedStudentsSectionViewModel } from "@/frontend/common/views/dashboard/profile/parent/useAssociatedStudentsSectionViewModel";

type AssociatedStudentsSectionProps = UseAssociatedStudentsSectionViewModelProps;

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

export function AssociatedStudentsSection(props: Readonly<AssociatedStudentsSectionProps>) {
  const viewModel = useAssociatedStudentsSectionViewModel(props);
  const { labels, rows, loading, emptyMessage, hasRows, showLoadingFallback } = viewModel;

  if (showLoadingFallback) {
    return (
      <SectionPanel title={labels.parent.sections.students}>
        <StudentsLoadingState />
      </SectionPanel>
    );
  }

  if (!hasRows) {
    return (
      <SectionPanel title={labels.parent.sections.students}>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {emptyMessage}
        </Typography>
      </SectionPanel>
    );
  }

  const variantProps: AssociatedStudentsSectionVariantProps = {
    labels,
    rows,
    loading,
    emptyMessage,
  };

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={variantProps} />;
}
