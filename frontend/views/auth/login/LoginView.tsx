import { Box, Card, CardContent } from "@mui/material";
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
  backgroundColor: theme.palette.background.default,
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
}: Readonly<LoginViewProps>) {
  return (
    <StyledPageContainer sx={{ px: 2 }}>
      <ThemeLanguageControls />

      <Card
        sx={theme => ({
          width: "100%",
          maxWidth: theme.layout?.authWidth || 400,
          boxShadow: theme.palette.shadow?.card || 3,
        })}
      >
        <CardContent
          sx={theme => ({
            p: theme.layout?.cardPadding || 4,
          })}
        >
          <LoginHeader labels={labels} />
          <LoginForm labels={labels} onSubmitAction={onSubmitAction} externalLoginResult={externalLoginResult} />
          {isDemo && onFastLogin && (
            <DemoFastLogin labels={labels} onFastLogin={onFastLogin} groups={demoGroups || []} />
          )}
          <LoginFooter />
        </CardContent>
      </Card>
    </StyledPageContainer>
  );
}
