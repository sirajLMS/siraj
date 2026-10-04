"use client";

import { useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useMemo } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { ErrorState } from "@/frontend/common/components/ui/state";
import { searchTeacherAvailabilityQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { useTeacherAvailabilityStore } from "@/frontend/common/stores/teacherAvailabilityStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  buildGraphQLInput,
  computeInsights,
  transformToWeeklyAvailability,
} from "@/frontend/common/views/dashboard/teachers/availability/TeacherAvailabilityContainer.helpers";
import type {
  AvailabilityEntry,
  AvailabilitySearchFormData,
} from "@/frontend/common/views/dashboard/teachers/availability/types";
import {
  type TeacherAvailabilityViewModel,
  type UseTeacherAvailabilityViewModelProps,
  useTeacherAvailabilityCoordinatorLabels,
  useTeacherAvailabilityViewModel,
} from "@/frontend/common/views/dashboard/teachers/availability/useTeacherAvailabilityViewModel";
import { Translation } from "@/shared/locale";

const lazyViews = createLazyView<TeacherAvailabilityViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/availability/teacherAvailabilityView.mobile").then(m => ({
      default: m.TeacherAvailabilityMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/availability/teacherAvailabilityView.desktop").then(m => ({
      default: m.TeacherAvailabilityDesktopView,
    }))
);

export function TeacherAvailabilityContainer({ teacherId }: Readonly<{ teacherId: string }>) {
  const { shell: availabilityLabels, common: commonLabels } = useTeacherAvailabilityCoordinatorLabels();
  const notifications = useNotifications();
  useDocumentTitle(null, Translation.Dashboard.TeacherAvailability, "pageTitle");

  const searchInput = useTeacherAvailabilityStore(state => state.filters);
  const hasSearched = useTeacherAvailabilityStore(state => state.hasSearched);
  const setSearchFilters = useTeacherAvailabilityStore(state => state.setSearchFilters);
  const setHasSearched = useTeacherAvailabilityStore(state => state.setHasSearched);

  const graphqlInput = hasSearched
    ? buildGraphQLInput(searchInput)
    : buildGraphQLInput({ fromTime: null, toTime: null, gender: null });

  const { data, loading, error, refetch } = useQuery(searchTeacherAvailabilityQueryDocument, {
    variables: { input: graphqlInput },
    skip: !hasSearched || !graphqlInput.fromTime || !graphqlInput.toTime,
    fetchPolicy: "cache-and-network",
  });

  const availability = useMemo(
    () => transformToWeeklyAvailability(data?.searchTeacherAvailability),
    [data?.searchTeacherAvailability]
  );

  const insights = useMemo(() => computeInsights(data?.searchTeacherAvailability), [data?.searchTeacherAvailability]);

  const defaultFilters = useMemo<AvailabilitySearchFormData>(
    () => ({
      fromTime: searchInput.fromTime,
      toTime: searchInput.toTime,
      gender: searchInput.gender,
    }),
    [searchInput]
  );

  const handleSearch = useCallback(
    (formData: AvailabilitySearchFormData) => {
      setSearchFilters(formData);
      if (!formData.fromTime || !formData.toTime) {
        notifications.show(availabilityLabels.errors.missingTimeRange, { severity: "warning", autoHideDuration: 4000 });
        return;
      }
      setHasSearched(true);
      const input = buildGraphQLInput(formData);
      void refetch({ input });
    },
    [refetch, notifications, availabilityLabels, setSearchFilters, setHasSearched]
  );

  const handleBlockClick = useCallback(
    (entry: AvailabilityEntry) => {
      notifications.show(availabilityLabels.teacherSlotSelected(entry.teacherName, teacherId), {
        severity: "info",
        autoHideDuration: 4000,
      });
    },
    [notifications, availabilityLabels, teacherId]
  );

  const handleExportPdf = useCallback(() => {
    notifications.show(availabilityLabels.exportPdfComingSoon, { severity: "info", autoHideDuration: 4000 });
  }, [notifications, availabilityLabels]);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const props: UseTeacherAvailabilityViewModelProps = {
    availability,
    insights,
    defaultFilters,
    loading,
    onExportPdf: handleExportPdf,
    onSearch: handleSearch,
    onBlockClick: handleBlockClick,
  };

  const viewModel = useTeacherAvailabilityViewModel(props);

  if (error) {
    logger.error("Error loading teacher availability:", { error });
    return <ErrorState message={commonLabels.loadFailed} onRetry={handleRetry} />;
  }

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
