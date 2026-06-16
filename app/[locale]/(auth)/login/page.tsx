"use client";

import { Box, Card, CardContent } from "@mui/material";
import { LoginFooter } from "@/frontend/views/auth/login/components/LoginFooter";
import { LoginForm } from "@/frontend/views/auth/login/components/LoginForm";
import { LoginHeader } from "@/frontend/views/auth/login/components/LoginHeader";
import { ThemeLanguageControls } from "@/frontend/views/auth/login/components/ThemeLanguageControls";

export default function LoginPage() {
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
          maxWidth: theme.layout.authWidth,
          boxShadow: theme.palette.shadow.card,
        })}
      >
        <CardContent
          sx={theme => ({
            p: theme.layout.cardPadding,
          })}
        >
          <LoginHeader />
          <LoginForm />
          <LoginFooter />
        </CardContent>
      </Card>
    </Box>
  );
}
