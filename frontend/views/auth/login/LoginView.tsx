import { Box, Card, CardContent } from "@mui/material";
import { styled } from "@mui/material/styles";
import { DemoFastLogin } from "./components/DemoFastLogin";
import { LoginFooter } from "./components/LoginFooter";
import { LoginForm, type LoginFormProps } from "./components/LoginForm";
import { LoginHeader } from "./components/LoginHeader";
import { ThemeLanguageControls } from "./components/ThemeLanguageControls";

// Full viewport container with centered content and default background
const StyledPageContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  backgroundColor: theme.palette.background.default,
}));

export interface LoginViewProps extends LoginFormProps {
  isDemo?: boolean;
  demoGroups?: { slug: string; name: string; description: string | null }[];
  onFastLogin?: (groupSlug: string) => void;
}

export function LoginView({ isDemo, demoGroups, onFastLogin, ...formProps }: Readonly<LoginViewProps>) {
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
          <LoginHeader />
          <LoginForm {...formProps} />
          {isDemo && onFastLogin && <DemoFastLogin onFastLogin={onFastLogin} groups={demoGroups || []} />}
          <LoginFooter />
        </CardContent>
      </Card>
    </StyledPageContainer>
  );
}
