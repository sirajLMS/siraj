"use client";

import { PersonSearchOutlined, TrendingUpOutlined } from "@mui/icons-material";
import { InsightCard } from "@/frontend/common/views/dashboard/teachers/availability/components/__shared__/availabilityInsightsShared.card";
import { TimezoneInsight } from "@/frontend/common/views/dashboard/teachers/availability/components/__shared__/availabilityInsightsShared.timezone";
import type { AvailabilityInsightsSharedProps } from "@/frontend/common/views/dashboard/teachers/availability/components/__shared__/availabilityInsightsShared.types";
import { AvailabilityInsightsLayout } from "@/frontend/common/views/dashboard/teachers/availability/components/availabilityInsightsLayout";

export type {
  AvailabilityInsightsSharedOptions,
  AvailabilityInsightsSharedProps,
  AvailabilityInsightsSharedStyleOptions,
} from "@/frontend/common/views/dashboard/teachers/availability/components/__shared__/availabilityInsightsShared.types";

export function AvailabilityInsightsShared({ insights, labels, options }: Readonly<AvailabilityInsightsSharedProps>) {
  const t = labels;

  return (
    <AvailabilityInsightsLayout
      insights={insights}
      layoutSx={options.layoutSx}
      peakLoadCard={
        <InsightCard
          title={t.peakLoad}
          value={insights.peakLoad}
          description={t.peakLoadDesc}
          icon={<TrendingUpOutlined sx={theme => ({ color: theme.palette.primary.main })} />}
          options={options}
        />
      }
      availableStaffCard={
        <InsightCard
          title={t.availableStaff}
          value={t.teachersCount(insights.availableStaff)}
          description={t.availableStaffDesc}
          icon={<PersonSearchOutlined sx={theme => ({ color: theme.palette.primary.main })} />}
          options={options}
        />
      }
      timezoneInsightCard={
        <TimezoneInsight
          timezones={insights.timezones}
          labels={{
            title: t.localTimezones,
            description: t.localTimezonesDesc,
          }}
          options={options}
        />
      }
    />
  );
}
