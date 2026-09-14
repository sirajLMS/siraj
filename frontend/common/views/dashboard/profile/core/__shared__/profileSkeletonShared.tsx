"use client";

import { Box, Skeleton, Stack } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { BaseCard } from "@/frontend/common/components/ui";

interface SkeletonCardConfig {
  readonly id: string;
  readonly skeletonHeight: number;
  readonly textWidths: readonly string[];
}

export interface ProfileSkeletonSharedOptions {
  readonly stackDirection: { readonly md?: "row"; readonly xs?: "column" };
  readonly stackSpacing: number;
  readonly stackAlignItems: "center" | "flex-start";
  readonly cardSx: (theme: Theme) => Record<string, unknown>;
  readonly cards: readonly SkeletonCardConfig[];
}

function SkeletonCard({ config }: Readonly<{ readonly config: SkeletonCardConfig }>) {
  return (
    <BaseCard sx={{ padding: 0 }}>
      <Skeleton variant="text" width="80%" sx={{ fontSize: "1.25rem", mb: 1.5 }} />
      <Skeleton variant="rectangular" height={config.skeletonHeight} sx={{ mb: 1.5, borderRadius: 1 }} />
      {config.textWidths.map((width, wIndex) => {
        const showMargin = wIndex > 0;
        return <Skeleton key={width} variant="text" width={width} sx={showMargin ? { mt: 1 } : undefined} />;
      })}
    </BaseCard>
  );
}

export function ProfileSkeletonShared({ options }: Readonly<{ readonly options: ProfileSkeletonSharedOptions }>) {
  return (
    <Box sx={{ width: "100%" }}>
      <Stack
        direction={options.stackDirection}
        spacing={options.stackSpacing}
        sx={theme => ({
          alignItems: options.stackAlignItems,
          width: "100%",
          mb: 4,
          p: 2,
          borderRadius: theme.shape.borderRadius,
        })}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Skeleton variant="circular" width={64} height={64} />
        </Box>
        <Box sx={{ flex: 1, pt: 1 }}>
          <Skeleton variant="text" width="60%" sx={{ fontSize: "1.5rem" }} />
          <Skeleton variant="text" width="40%" sx={{ fontSize: "1rem" }} />
        </Box>
      </Stack>

      <Box sx={{ display: "flex", flexDirection: "column", gap: options.stackSpacing }}>
        {options.cards.map(cardConfig => (
          <Box key={cardConfig.id} sx={options.cardSx}>
            <SkeletonCard config={cardConfig} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
