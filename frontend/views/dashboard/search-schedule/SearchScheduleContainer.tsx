"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { searchTeacherAvailabilityQueryDocument } from "@/frontend/graphql/sharedDocuments/availability-search.documents";
import { SearchScheduleForm } from "./SearchScheduleForm";
import { SearchScheduleView } from "./SearchScheduleView";

export function SearchScheduleContainer() {
  const t = useTranslations("dashboard.searchSchedule");

  const [searchInput, setSearchInput] = useState<{
    fromTime: string;
    toTime: string;
    gender: string | null;
  } | null>(null);

  const { data, loading, error } = useQuery(searchTeacherAvailabilityQueryDocument, {
    variables: {
      input: {
        fromTime: searchInput?.fromTime ?? "",
        toTime: searchInput?.toTime ?? "",
        gender: searchInput?.gender ?? null,
      },
    },
    skip: !searchInput,
  });

  return (
    <RequirePermission permissions={[AppPermission.ScheduleSearchAvailability]}>
      <PageContainer>
        <PageHeader title={t("pageTitle")} titleVariant="headlineLg" />
        <Box sx={{ mt: 3 }}>
          <SearchScheduleForm
            onSearch={(fromTime, toTime, gender) => {
              setSearchInput({ fromTime, toTime, gender });
            }}
          />

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {t("errorLoading")}
            </Typography>
          )}

          {data?.searchTeacherAvailability && <SearchScheduleView result={data.searchTeacherAvailability} />}
        </Box>
      </PageContainer>
    </RequirePermission>
  );
}
