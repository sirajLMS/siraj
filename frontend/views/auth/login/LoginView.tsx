"use client";

import { alpha, Box, Card, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import { DemoFastLogin } from "@/frontend/views/auth/login/components/DemoFastLogin";
import { LoginFooter } from "@/frontend/views/auth/login/components/LoginFooter";
import { LoginForm, type LoginFormProps } from "@/frontend/views/auth/login/components/LoginForm";
import { LoginHeader } from "@/frontend/views/auth/login/components/LoginHeader";
import { ThemeLanguageControls } from "@/frontend/views/auth/login/components/ThemeLanguageControls";
import type { AuthLoginLabels } from "@/shared/locale/types/auth";

const StyledPageContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  background: `linear-gradient(135deg, ${theme.palette.primary.main}22 0%, ${theme.palette.background.default} 45%, ${theme.palette.background.default} 100%)`,
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    background: `radial-gradient(circle at 20% 20%, ${theme.palette.primary.main}1a 0%, transparent 50%), radial-gradient(circle at 80% 80%, ${theme.palette.secondary.main}1a 0%, transparent 50%)`,
    pointerEvents: "none",
  },
}));

export interface LoginViewProps extends Omit<LoginFormProps, "labels"> {
  readonly labels: AuthLoginLabels;
  readonly isDemo?: boolean;
  readonly demoGroups?: { slug: string; name: string; description: string | null }[];
  readonly onFastLogin?: (groupSlug: string) => void;
}

export function LoginView({
  labels,
  isDemo,
  demoGroups,
  onFastLogin,
  onSubmitAction,
  externalLoginResult,
  isRetrying,
}: Readonly<LoginViewProps>) {
  return (
    <StyledPageContainer sx={{ px: 2 }}>
      <ThemeLanguageControls />

      <Card
        sx={theme => ({
          width: "100%",
          maxWidth: 460,
          mx: "auto",
          p: { xs: 3, sm: 4 },
          borderRadius: { xs: 3, sm: 4 },
          backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.1 : 0.92),
          backdropFilter: "blur(14px)",
          border: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === "dark" ? 1.8 : 1)}`,
          boxShadow: `
            0 1px 2px ${alpha(theme.palette.common.black, 0.1)},
            0 8px 24px ${alpha(theme.palette.common.black, 0.14)},
            0 24px 64px ${alpha(theme.palette.primary.main, 0.14)}`,
          animation: "sirajLoginEntrance 360ms cubic-bezier(0.2, 0, 0, 1) both",
          "@keyframes sirajLoginEntrance": {
            "0%": { opacity: "0", transform: "translateY(12px)" },
            "100%": { opacity: "1", transform: "translateY(0)" },
          },
        })}
      >
        <Stack spacing={{ xs: 2.5, sm: 3 }}>
          <LoginHeader labels={labels} />
          <LoginForm
            labels={labels}
            onSubmitAction={onSubmitAction}
            externalLoginResult={externalLoginResult}
            isRetrying={isRetrying}
          />
          {isDemo && onFastLogin && (
            <DemoFastLogin labels={labels} onFastLogin={onFastLogin} groups={demoGroups ?? []} />
          )}
          <LoginFooter />
        </Stack>
      </Card>
    </StyledPageContainer>
  );
}
