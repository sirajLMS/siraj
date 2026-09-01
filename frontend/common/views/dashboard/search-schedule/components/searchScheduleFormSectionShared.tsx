"use client";

import { type SxProps, type Theme, Typography } from "@mui/material";
import type { FC } from "react";
import type { SearchScheduleFormProps } from "@/frontend/common/views/dashboard/search-schedule/types";

interface SearchScheduleFormSectionSlotProps {
  /** Tier-specific form component — desktop or mobile variant. */
  readonly FormComponent: FC<Readonly<SearchScheduleFormProps>>;
  /** Error Typography sx — desktop has no padding, mobile has px: 2. */
  readonly errorSx?: SxProps<Theme>;
}

type SearchScheduleFormSectionProps = SearchScheduleFormProps &
  SearchScheduleFormSectionSlotProps & {
    readonly error: string | null | undefined;
  };

export function SearchScheduleFormSectionShared({
  FormComponent,
  errorSx,
  error,
  ...formProps
}: Readonly<SearchScheduleFormSectionProps>) {
  return (
    <>
      <FormComponent {...formProps} />
      {error ? (
        <Typography color="error" sx={errorSx}>
          {error}
        </Typography>
      ) : null}
    </>
  );
}
