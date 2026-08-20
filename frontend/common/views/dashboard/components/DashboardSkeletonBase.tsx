import { Box, Skeleton } from "@mui/material";

export interface DashboardSkeletonBaseProps {
  readonly navItemCount?: number;
  readonly contentVariant?: "compact" | "detailed";
}

export function DashboardSkeletonBase({ navItemCount = 6, contentVariant = "compact" }: DashboardSkeletonBaseProps) {
  const navIds = Array.from({ length: navItemCount }, (_, i) => String.fromCharCode(97 + i));

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <Box
        sx={theme => ({
          display: { xs: "none", md: "block" },
          width: 280,
          flexShrink: 0,
          borderRight: `1px solid ${theme.palette.divider}`,
          p: 2,
        })}
      >
        <Skeleton variant="rounded" width="70%" height={32} sx={{ mb: 2 }} />
        {navIds.map(id => (
          <Skeleton key={id} variant="rounded" height={40} sx={{ mb: 1 }} />
        ))}
      </Box>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Skeleton variant="rectangular" height={64} sx={{ flexShrink: 0 }} />
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
          {contentVariant === "detailed" ? (
            <>
              <Skeleton variant="text" width="35%" height={40} />
              <Skeleton variant="text" width="55%" height={24} sx={{ mt: 1 }} />
              <Skeleton variant="rounded" width="100%" height={400} sx={{ mt: 3 }} />
            </>
          ) : (
            <Skeleton variant="rounded" width="100%" height={320} />
          )}
        </Box>
      </Box>
    </Box>
  );
}
