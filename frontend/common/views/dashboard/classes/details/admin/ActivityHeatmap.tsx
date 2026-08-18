"use client";

import { Box, Divider, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { BaseCard } from "@/frontend/common/components/ui";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import {
  classDetailsCardInnerPaddingSx,
  classDetailsContentPaddingSx,
} from "@/frontend/common/views/dashboard/classes/details/classDetailsMobileLayout";

interface ActivityHeatmapProps {
  readonly data: readonly number[];
  readonly labels: {
    readonly activityHeatmap: string;
    readonly studentInput: string;
    readonly teacherResponse: string;
    readonly noData: string;
  };
}

interface Bar {
  id: string;
  height: number;
}

const StyledHeatmapHeader = styled(Stack)(({ theme }) => ({
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(1.5),
  paddingBlock: theme.spacing(2.5),
  borderBottom: 1,
  borderColor: theme.palette.border.light,
  backgroundColor: theme.palette.background.paper,
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
}));

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledStudentInputSwatch = styled(Box)(({ theme }) => ({
  width: 12,
  height: 12,
  backgroundColor: theme.palette.primary.main,
  borderRadius: 0.5,
}));

const StyledTeacherResponseSwatch = styled(Box)(({ theme }) => ({
  width: 12,
  height: 12,
  backgroundColor: theme.palette.secondary.main,
  borderRadius: 0.5,
}));

const StyledLegendCaption = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

const StyledGridDivider = styled(Divider)(() => ({}));

const StyledEmptyState = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textAlign: "center",
}));

export function ActivityHeatmap({ data, labels }: ActivityHeatmapProps) {
  const [bars, setBars] = useState<Bar[]>(() => data.map((h, i) => ({ id: `bar-${i}`, height: h })));

  useEffect(() => {
    setBars(data.map((h, i) => ({ id: `bar-${i}`, height: h })));
  }, [data]);

  const hasData = bars.length > 0;

  return (
    <BaseCard edgeToEdge edgeToEdgePadding={false} sx={{ py: 0, overflow: "hidden" }}>
      <StyledHeatmapHeader direction="row" sx={classDetailsCardInnerPaddingSx}>
        <StyledSectionTitle variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, minWidth: 0 })}>
          {labels.activityHeatmap}
        </StyledSectionTitle>
        <Stack direction="row" sx={{ gap: { xs: 2, sm: 3 }, flexWrap: "wrap", minWidth: 0 }}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
            <StyledStudentInputSwatch sx={theme => ({ backgroundColor: theme.palette.primary.main })} />
            <StyledLegendCaption variant="caption">{labels.studentInput}</StyledLegendCaption>
          </Stack>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
            <StyledTeacherResponseSwatch sx={theme => ({ backgroundColor: theme.palette.secondary.main })} />
            <StyledLegendCaption variant="caption">{labels.teacherResponse}</StyledLegendCaption>
          </Stack>
        </Stack>
      </StyledHeatmapHeader>

      <Box sx={mergeSx({ pb: 4, pt: 2, height: 300, position: "relative" }, classDetailsContentPaddingSx)}>
        {hasData ? (
          <>
            <Box
              sx={{
                position: "absolute",
                inset: "16px 32px 32px 32px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                pointerEvents: "none",
              }}
            >
              {[0, 1, 2].map(i => (
                <StyledGridDivider
                  key={i}
                  sx={theme => ({ borderColor: theme.palette.outlineVariant, opacity: 0.4 })}
                />
              ))}
            </Box>

            <Stack
              direction="row"
              sx={{
                alignItems: "flex-end",
                height: "100%",
                gap: 0.5,
              }}
            >
              {bars.map((bar, i) => (
                <Box
                  key={bar.id}
                  sx={theme => ({
                    flex: 1,
                    height: `${bar.height}%`,
                    borderRadius: "4px 4px 0 0",
                    backgroundColor: i % 2 === 0 ? theme.palette.primary.main : theme.palette.secondary.main,
                    opacity: i % 2 === 0 ? 0.85 : 0.5,
                    transition: theme.transitions.create("height", { duration: 600, easing: "ease" }),
                    "&:hover": { opacity: 1, filter: "brightness(1.15)" },
                    cursor: "pointer",
                  })}
                />
              ))}
            </Stack>
          </>
        ) : (
          <Stack sx={{ height: "100%", alignItems: "center", justifyContent: "center" }}>
            <StyledEmptyState
              variant="body2"
              sx={theme => ({ color: theme.palette.onSurfaceVariant, textAlign: "center" })}
            >
              {labels.noData}
            </StyledEmptyState>
          </Stack>
        )}
      </Box>
    </BaseCard>
  );
}
