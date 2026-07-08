"use client";

import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  FormControlLabel,
  Skeleton,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import {
  buildPreferenceMap,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_TYPES,
  type NotificationPrefRow,
} from "./notificationPreferenceTypes";

type PreferencesAccordionProps = {
  readonly preferences: readonly NotificationPrefRow[];
  readonly onToggle: (
    channel: Types.NotificationChannel,
    eventType: Types.NotificationEventType,
    enabled: boolean
  ) => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
};

function AccordionSkeleton() {
  return (
    <Stack spacing={1}>
      {["panel-a", "panel-b", "panel-c"].map(id => (
        <Skeleton key={id} variant="rounded" height={56} />
      ))}
    </Stack>
  );
}

export function PreferencesAccordion({
  preferences,
  onToggle,
  disabled = false,
  loading = false,
}: PreferencesAccordionProps) {
  const t = useTranslations("profile.notifications");
  const preferenceMap = buildPreferenceMap(preferences);

  if (loading && preferences.length === 0) {
    return <AccordionSkeleton />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {NOTIFICATION_CHANNELS.map(channel => (
        <Accordion
          key={channel}
          disableGutters
          sx={theme => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            "&:before": { display: "none" },
          })}
        >
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Typography sx={{ typography: "titleSm" }}>{t(`channels.${channel}`)}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              {NOTIFICATION_EVENT_TYPES.map(eventType => {
                const pref = preferenceMap.get(`${channel}:${eventType}`);
                const enabled = pref?.enabled ?? true;

                return (
                  <FormControlLabel
                    key={`${channel}-${eventType}`}
                    control={
                      <Switch
                        checked={enabled}
                        disabled={disabled}
                        onChange={(_, checked) => {
                          onToggle(channel, eventType, checked);
                        }}
                      />
                    }
                    label={t(`events.${eventType}`)}
                    sx={{ mx: 0, width: "100%", justifyContent: "space-between" }}
                    labelPlacement="start"
                  />
                );
              })}
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
