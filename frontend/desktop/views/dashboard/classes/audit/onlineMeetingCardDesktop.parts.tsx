import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { type ReactElement, useState } from "react";
import { StyledDesktopVideoIcon } from "@/frontend/desktop/views/dashboard/classes/audit/onlineMeetingCardDesktop.styled";

const FALLBACK_CELL = "1 / 1";

const StyledLogoMediaBox = styled(Box)({
  display: "grid",
  placeItems: "center",
  borderRadius: "50%",
  overflow: "hidden",
  flexShrink: 0,
});

const StyledLogoImage = styled("img")({
  gridArea: FALLBACK_CELL,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
});

const StyledLogoFallbackSlot = styled(Box)({
  gridArea: FALLBACK_CELL,
  display: "flex",
});

export function MeetingProviderLogo({
  logoUrl,
  size,
  fallback,
}: Readonly<{ logoUrl?: string | null; size: number; fallback: ReactElement }>) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!logoUrl?.trim() || failed) return fallback;

  return (
    <StyledLogoMediaBox sx={{ width: size, height: size }}>
      <StyledLogoImage
        src={logoUrl}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={{ visibility: loaded ? "visible" : "hidden" }}
      />
      {loaded ? null : <StyledLogoFallbackSlot>{fallback}</StyledLogoFallbackSlot>}
    </StyledLogoMediaBox>
  );
}

export function MeetingPreviewIcon({ logoUrl }: Readonly<{ logoUrl?: string | null }>) {
  return <MeetingProviderLogo logoUrl={logoUrl} size={64} fallback={<StyledDesktopVideoIcon />} />;
}
