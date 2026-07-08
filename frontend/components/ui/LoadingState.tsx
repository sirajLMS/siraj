import { Box, CircularProgress } from "@mui/material";

export function LoadingState() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
      <CircularProgress sx={theme => ({ color: theme.palette.primary.main })} />
    </Box>
  );
}
