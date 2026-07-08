"use client";

import { Box, Button, ButtonGroup, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type React from "react";
import { Gender } from "@/frontend/graphql/generated/gql/graphql-types";

/**
 * Props for the GenderSelector component.
 *
 * @typedef {Object} GenderSelectorProps
 * @property {Gender} gender - The selected gender.
 * @property {(gender: Gender) => void} setGender - Function to update the selected gender.
 * @property {boolean} error - Indicates if there's an error.
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setError - Function to update the error state.
 */
export type GenderSelectorProps = {
  gender: Gender;
  setGender: (gender: Gender) => void;
  error: boolean;
  setError: React.Dispatch<React.SetStateAction<boolean>>;
};

/**
 * GenderSelector Component
 *
 * Allows users to select their gender.
 *
 * @param {GenderSelectorProps} props - The props for the component.
 * @returns {JSX.Element} The rendered GenderSelector component.
 */
export const GenderSelector: React.FC<GenderSelectorProps> = ({ gender, setGender, error, setError }) => {
  const t = useTranslations("ui.genderSelector");

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 1,
        width: "100%",
        flexWrap: "wrap",
        minWidth: 0,
      }}
    >
      <Typography
        color={error ? "error" : "default"}
        sx={{
          overflow: "show",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 1,
          WebkitBoxOrient: "vertical",
        }}
        variant={"subtitle1"}
      >
        {t("title")}
      </Typography>
      <ButtonGroup
        color={error ? "error" : "primary"}
        disableElevation
        variant="outlined"
        aria-label={t("ariaLabel")}
        sx={{
          width: "70%",
        }}
      >
        <Button
          onClick={() => {
            setGender(Gender.Male);
            setError(false);
          }}
          variant={gender === Gender.Male ? "contained" : "outlined"}
          sx={{ width: "50%", minWidth: 0 }}
        >
          {t("male")}
        </Button>
        <Button
          onClick={() => {
            setGender(Gender.Female);
            setError(false);
          }}
          variant={gender === Gender.Female ? "contained" : "outlined"}
          sx={{ width: "50%", minWidth: 0 }}
        >
          {t("female")}
        </Button>
      </ButtonGroup>
    </Box>
  );
};
