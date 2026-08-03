import { Box, Typography } from "@mui/material";

type EndpointListProps = {
  readonly endpoints: readonly string[];
  readonly label: string;
};

export function EndpointList({ endpoints, label }: EndpointListProps) {
  return (
    <Box>
      <Typography sx={{ typography: "labelUppercase", color: "text.secondary", mb: 0.5 }}>{label}</Typography>
      {endpoints.map(endpoint => (
        <Typography key={endpoint} sx={{ typography: "bodySm", fontFamily: "monospace", wordBreak: "break-all" }}>
          {endpoint}
        </Typography>
      ))}
    </Box>
  );
}
