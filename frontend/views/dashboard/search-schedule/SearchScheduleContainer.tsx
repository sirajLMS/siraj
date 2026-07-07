"use client";

import { NetworkStatus } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { AppPermission, type AvailabilitySearchInput } from "@/frontend/graphql/generated/gql/graphql-types";
import { searchTeacherAvailabilityQueryDocument } from "@/frontend/graphql/sharedDocuments/availability-search.documents";
import { useSearchScheduleStore } from "@/frontend/stores/searchScheduleStore";
import { SearchScheduleForm } from "./SearchScheduleForm";
import { SearchScheduleView } from "./SearchScheduleView";

export function SearchScheduleContainer() {
  const t = useTranslations("dashboard.searchSchedule");

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

  return (
    <RequirePermission permissions={[AppPermission.ScheduleSearchAvailability]}>
      <PageContainer>
        <PageHeader title={t("pageTitle")} titleVariant="headlineLg" />
        <Box sx={{ mt: 3 }}>
          <SearchScheduleForm
            draft={draft}
            isSearching={isRefetching || isInitialLoading}
            onDraftChange={setDraft}
            onSearch={commitSearch}
          />

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {t("errorLoading")}
            </Typography>
          )}

          {(hasSearched || displayData?.searchTeacherAvailability) && (
            <SearchScheduleView
              result={displayData?.searchTeacherAvailability}
              fromDate={activeFromDate}
              toDate={activeToDate}
              isInitialLoading={isInitialLoading}
              onPageChange={setPage}
            />
          )}
        </Box>
      </PageContainer>
    </RequirePermission>
  );
}
