"use client";

import { NetworkStatus } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Box, Typography } from "@mui/material";
import { useEffect, useMemo } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PageContainer, PageHeader } from "@/frontend/common/components/ui";
import { AppPermission, type AvailabilitySearchInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { searchTeacherAvailabilityQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useSearchScheduleStore } from "@/frontend/common/stores/searchScheduleStore";
import { SearchScheduleForm } from "@/frontend/common/views/dashboard/search-schedule/SearchScheduleForm";
import { SearchSchedulePaginationFooter } from "@/frontend/common/views/dashboard/search-schedule/SearchSchedulePaginationFooter";
import { SearchScheduleView } from "@/frontend/common/views/dashboard/search-schedule/SearchScheduleView";
import { useAppTranslation } from "@/shared/locale/client";

export function SearchScheduleContainer() {
  const t = useAppTranslation().dashboardTranslations.coreSearchSchedule;

  const draft = useSearchScheduleStore(state => state.draft);
  const setDraft = useSearchScheduleStore(state => state.setDraft);
  const activeInput = useSearchScheduleStore(state => state.activeInput);
  const commitSearch = useSearchScheduleStore(state => state.commitSearch);
  const setPage = useSearchScheduleStore(state => state.setPage);
  const hasSearched = useSearchScheduleStore(state => state.hasSearched);
  const hasHydrated = useSearchScheduleStore(state => state._hasHydrated);

  useEffect(() => {
    if (!hasHydrated || hasSearched) {
      return;
    }

    commitSearch();
  }, [commitSearch, hasHydrated, hasSearched]);

  const { data, loading, error, networkStatus, previousData } = useQuery(searchTeacherAvailabilityQueryDocument, {
    variables: activeInput ? { input: activeInput } : { input: {} as AvailabilitySearchInput },
    skip: activeInput === null,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
  });

  const displayData = data ?? previousData;
  const isInitialLoading = loading && !displayData;
  const isRefetching =
    loading &&
    !!displayData &&
    (networkStatus === NetworkStatus.refetch || networkStatus === NetworkStatus.setVariables);

  const activeFromDate = useMemo(
    () => activeInput?.fromDate ?? draft.fromDate,
    [activeInput?.fromDate, draft.fromDate]
  );
  const activeToDate = useMemo(() => activeInput?.toDate ?? draft.toDate, [activeInput?.toDate, draft.toDate]);

  const searchResult = displayData?.searchTeacherAvailability;
  const pageInfo = searchResult?.pageInfo;
  const teacherCount = searchResult?.teachers?.length ?? 0;
  const showPaginationFooter = Boolean(pageInfo && (pageInfo.total ?? 0) > 0);

  return (
    <RequirePermission permissions={[AppPermission.ScheduleSearchAvailability]}>
      <PageContainer
        sx={theme => ({
          display: "flex",
          flexDirection: "column",
          gap: { xs: 1, md: theme.layout.sectionGap },
          minHeight: {
            xs: `calc(100dvh - ${theme.layout.navbarHeight} - ${theme.layout.bottomNavHeight} - ${theme.spacing(4)})`,
            md: `calc(100dvh - ${theme.layout.navbarHeight} - ${theme.layout.pageMargin} * 2)`,
          },
        })}
      >
        <Box sx={{ px: { xs: 2, md: 0 } }}>
          <PageHeader title={t.pageTitle} titleVariant="headlineLg" />
        </Box>
        <Box
          sx={{
            mt: { xs: 0, md: 2 },
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: { xs: 1, md: 2 },
            minHeight: 0,
          }}
        >
          <SearchScheduleForm
            draft={draft}
            isSearching={isRefetching || isInitialLoading}
            onDraftChange={setDraft}
            onSearch={commitSearch}
          />

          {error ? <Typography color="error">{t.errorLoading}</Typography> : null}

          {(hasSearched || searchResult) && (
            <Box sx={{ display: "flex", flexDirection: "column", flex: 1, gap: 2, minHeight: 0 }}>
              <SearchScheduleView
                result={searchResult}
                fromDate={activeFromDate}
                toDate={activeToDate}
                isInitialLoading={isInitialLoading}
              />
            </Box>
          )}

          {showPaginationFooter && pageInfo ? (
            <SearchSchedulePaginationFooter pageInfo={pageInfo} teacherCount={teacherCount} onPageChange={setPage} />
          ) : null}
        </Box>
      </PageContainer>
    </RequirePermission>
  );
}
