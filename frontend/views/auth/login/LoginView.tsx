"use client";

import { alpha, Box, Card, CardContent } from "@mui/material";
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
  // Layered gradient background: primary tint + subtle radial highlight.
  // Adapts to light/dark via palette channels (no hardcoded hex).
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
          maxWidth: theme.layout?.authWidth || 400,
          // Glassmorphism: translucent surface + subtle backdrop blur + soft border.
          // Uses alpha() on background.paper so it adapts to light/dark themes
          // (no hardcoded rgba hex values — passes local/no-hardcoded-colors).
          backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.04 : 0.85),
          backdropFilter: "blur(12px)",
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.palette.shadow?.card || "0 8px 32px rgba(0,0,0,0.12)",
          // Entrance animation: subtle fade + lift on mount.
          animation: "sirajLoginEntrance 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          "@keyframes sirajLoginEntrance": {
            "0%": { opacity: "0", transform: "translateY(12px)" },
            "100%": { opacity: "1", transform: "translateY(0)" },
          },
        })}
      >
        <CardContent
          sx={theme => ({
            p: theme.layout?.cardPadding || 4,
          })}
        >
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
        </CardContent>
      </Card>
    </StyledPageContainer>
  );
}
