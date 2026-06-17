import { Box, Card, CardContent } from "@mui/material";
import { DemoFastLogin } from "./components/DemoFastLogin";
import { LoginFooter } from "./components/LoginFooter";
import { LoginForm, type LoginFormProps } from "./components/LoginForm";
import { LoginHeader } from "./components/LoginHeader";
import { ThemeLanguageControls } from "./components/ThemeLanguageControls";

export interface LoginViewProps extends LoginFormProps {
  isDemo?: boolean;
  demoGroups?: { slug: string; name: string; description: string | null }[];
  onFastLogin?: (groupSlug: string) => void;
}

export function LoginView({ isDemo, demoGroups, onFastLogin, ...formProps }: Readonly<LoginViewProps>) {
  return (
    <Box
      sx={theme => ({
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        px: 2,
        bgcolor: theme.palette.background.default,
      })}
    >
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
    </Box>
  );
}
