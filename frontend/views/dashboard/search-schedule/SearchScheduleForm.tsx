"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, Button, MenuItem, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import { type SyntheticEvent, useState } from "react";

interface SearchScheduleFormProps {
  readonly onSearch: (fromTime: string, toTime: string, gender: string | null) => void;
}

export function SearchScheduleForm({ onSearch }: Readonly<SearchScheduleFormProps>) {
  const t = useTranslations("dashboard.searchSchedule");

  const [fromTime, setFromTime] = useState("08:00");
  const [toTime, setToTime] = useState("17:00");
  const [gender, setGender] = useState<string>("");

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(fromTime, toTime, gender || null);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={theme => ({
        display: "flex",
        gap: 2,
        alignItems: "flex-end",
        flexWrap: "wrap",
        p: 2,
        borderRadius: 2,
        bgcolor: theme.palette.surfaceContainerLow,
        mb: 3,
      })}
    >
      <TextField
        label={t("fromTime")}
        type="time"
        value={fromTime}
        onChange={e => setFromTime(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 150 }}
      />

      <TextField
        label={t("toTime")}
        type="time"
        value={toTime}
        onChange={e => setToTime(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 150 }}
      />

      <TextField
        select
        label={t("gender")}
        value={gender}
        onChange={e => setGender(e.target.value)}
        sx={{ minWidth: 150 }}
      >
        <MenuItem value="">{t("allGenders")}</MenuItem>
        <MenuItem value="MALE">{t("male")}</MenuItem>
        <MenuItem value="FEMALE">{t("female")}</MenuItem>
      </TextField>

      <Button type="submit" variant="contained" startIcon={<SearchOutlined />} sx={{ height: 56 }}>
        {t("searchBtn")}
      </Button>
    </Box>
  );
}
