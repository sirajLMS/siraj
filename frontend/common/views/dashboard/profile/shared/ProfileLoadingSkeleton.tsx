import { Box, Card, Skeleton, Stack, type StackProps } from "@mui/material";

export interface SkeletonCardConfig {
  readonly textWidth: string;
  readonly rectHeight: number;
  readonly lines?: readonly { readonly width: string; readonly mt?: number }[];
}

export interface ProfileLoadingSkeletonConfig {
  readonly gridCards: readonly SkeletonCardConfig[];
  readonly bottomCard: {
    readonly textWidth: string;
    readonly rectHeight: number;
  };
  readonly spacing?: NonNullable<StackProps["spacing"]>;
}

interface ProfileLoadingSkeletonProps {
  readonly config: ProfileLoadingSkeletonConfig;
}

export function ProfileLoadingSkeleton({ config }: Readonly<ProfileLoadingSkeletonProps>) {
  return (
    <Box sx={{ width: "100%" }}>
      <Stack spacing={config.spacing ?? 2}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "repeat(2, minmax(0, 1fr))",
            },
          }}
        >
          {config.gridCards.map(card => (
            <Card key={`${card.textWidth}-${card.rectHeight}`} sx={{ p: 2, height: "fit-content" }}>
              <Skeleton variant="text" width={card.textWidth} sx={{ fontSize: "1.25rem", mb: 2 }} />
              <Skeleton variant="rectangular" height={card.rectHeight} sx={{ mb: 2, borderRadius: 1 }} />
              {card.lines?.map(line => (
                <Skeleton
                  key={`${line.width}-${line.mt ?? 0}`}
                  variant="text"
                  width={line.width}
                  sx={line.mt ? { mt: line.mt } : undefined}
                />
              )) ?? null}
            </Card>
          ))}
        </Box>
        <Card sx={{ p: 2, width: "100%" }}>
          <Skeleton variant="text" width={config.bottomCard.textWidth} sx={{ fontSize: "1.1rem", mb: 1.5 }} />
          <Skeleton variant="rectangular" height={config.bottomCard.rectHeight} sx={{ borderRadius: 1 }} />
        </Card>
      </Stack>
    </Box>
  );
}
