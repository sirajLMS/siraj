"use client";

import { Box, Button, ButtonGroup, Typography } from "@mui/material";
import type * as React from "react";
import type { GenderSelectorProps } from "@/frontend/common/components/ui/input/genderSelector/GenderSelector";
import { Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAppTranslation } from "@/shared/locale";

export const GenderSelectorMobile: React.FC<GenderSelectorProps> = ({
  gender,
  setGenderAction,
  error = false,
  required = false,
  fullWidth = false,
  labels,
  allowEmpty = false,
}): React.ReactNode => {
  const t = useAppTranslation().uiTranslations.genderSelector;
  const title = labels?.title ?? t.title;
  const maleLabel = labels?.male ?? t.male;
  const femaleLabel = labels?.female ?? t.female;
  const ariaLabel = labels?.ariaLabel ?? t.ariaLabel;

  const buttons: ReadonlyArray<{
    readonly value: Gender;
    readonly label: string;
  }> = [
    { value: Gender.Male, label: maleLabel },
    { value: Gender.Female, label: femaleLabel },
  ];

  const totalButtons = allowEmpty ? buttons.length + 1 : buttons.length;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 1,
        width: fullWidth ? "100%" : "auto",
        flexWrap: "wrap",
        minWidth: 0,
      }}
    >
      <Typography
        color={error ? "error" : "default"}
        sx={{
          overflow: "visible",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 1,
          WebkitBoxOrient: "vertical",
        }}
        variant="subtitle1"
      >
        {title}
        {required ? (
          <Box component="span" sx={theme => ({ color: theme.palette.error.main, ml: 0.5 })}>
            *
          </Box>
        ) : null}
      </Typography>
      <ButtonGroup
        color={error ? "error" : "primary"}
        disableElevation
        variant="outlined"
        aria-label={ariaLabel}
        sx={{ width: "100%" }}
      >
        {buttons.map(button => (
          <Button
            key={button.value}
            onClick={() => {
              setGenderAction(button.value);
            }}
            variant={gender === button.value ? "contained" : "outlined"}
            sx={{ width: `${100 / totalButtons}%`, minWidth: 0, minHeight: 40 }}
          >
            {button.label}
          </Button>
        ))}
        {allowEmpty ? (
          <Button
            onClick={() => {
              setGenderAction(null);
            }}
            variant={gender === null ? "contained" : "outlined"}
            sx={{ width: `${100 / totalButtons}%`, minWidth: 0, minHeight: 40 }}
          >
            {labels?.any ?? t.any}
          </Button>
        ) : null}
      </ButtonGroup>
    </Box>
  );
};
