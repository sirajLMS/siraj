import { Grid, Paper, Stack } from "@mui/material";
import type { ReactNode } from "react";

export function DesktopProfileLayout({ children }: { readonly children: ReactNode }) {
  return (
    <Grid container spacing={3}>
      {children}
    </Grid>
  );
}

export function DesktopProfileSection({ children }: { readonly children: ReactNode }) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        {children}
      </Paper>
    </Grid>
  );
}

export function MobileProfileLayout({ children }: { readonly children: ReactNode }) {
  return <Stack spacing={3}>{children}</Stack>;
}

export function MobileProfileSection({ children }: { readonly children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      {children}
    </Paper>
  );
}
