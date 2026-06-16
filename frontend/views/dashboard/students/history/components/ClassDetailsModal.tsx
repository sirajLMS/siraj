import { CloseOutlined, Science } from "@mui/icons-material";
import { alpha, Box, IconButton, Paper, styled, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { ClassSession } from "@/frontend/stores/studentHistoryStore";

const ModalOverlay = styled(Box)(({ theme }) => ({
  position: "fixed",
  inset: 0,
  backgroundColor: alpha(theme.palette.scrim, 0.5),
  backdropFilter: "blur(4px)",
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(2),
}));

const ModalContainer = styled(Paper)(({ theme }) => ({
  width: "100%",
  maxWidth: 512,
  borderRadius: theme.layout.radius.card,
  overflow: "hidden",
  animation: "fadeIn 0.3s ease-out",
  "@keyframes fadeIn": {
    from: { opacity: 0, transform: "scale(0.95)" },
    to: { opacity: 1, transform: "scale(1)" },
  },
}));

interface ClassDetailsModalProps {
  session: ClassSession;
  dateStr: string;
  onClose: () => void;
}

export function ClassDetailsModal({ session, dateStr, onClose }: Readonly<ClassDetailsModalProps>) {
  const t = useTranslations("dashboard.studentHistory.classDetails");

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer
        elevation={24}
        onClick={e => {
          e.stopPropagation();
        }}
      >
        <ModalHeader title={t("classDetails", { date: dateStr })} onClose={onClose} />

        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <ModalSessionInfo session={session} t={t} />
            <ModalDetailsGrid session={session} t={t} />
            <ModalNotes session={session} t={t} />
            <ModalActions t={t} />
          </Box>
        </Box>
      </ModalContainer>
    </ModalOverlay>
  );
}

type TranslationFn = (key: string, values?: Record<string, string | number>) => string;

function ModalHeader({ title, onClose }: Readonly<{ title: string; onClose: () => void }>) {
  return (
    <Box
      sx={theme => ({
        p: 3,
        borderBottom: `1px solid ${theme.palette.border.light}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      })}
    >
      <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
        {title}
      </Typography>
      <IconButton
        onClick={onClose}
        sx={theme => ({
          color: theme.palette.onSurfaceVariant,
          "&:hover": { color: theme.palette.primary.main },
        })}
      >
        <CloseOutlined />
      </IconButton>
    </Box>
  );
}

function ModalSessionInfo({ session, t }: Readonly<{ session: ClassSession; t: TranslationFn }>) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
      <Box
        sx={theme => ({
          width: 48,
          height: 48,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          borderRadius: theme.layout.radius.card,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.primary.main,
        })}
      >
        <Science sx={{ fontSize: 28 }} />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
          {session.title}
        </Typography>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {t("instructor", { name: session.instructor })}
        </Typography>
      </Box>
      <Box
        sx={theme => {
          let bgcolor = theme.palette.secondary.main;
          let color = theme.palette.onSecondary;
          if (session.status === "present") {
            bgcolor = theme.palette.status.active;
            color = theme.palette.status.onActive;
          } else if (session.status === "absent") {
            bgcolor = theme.palette.error.main;
            color = theme.palette.onError;
          }
          return {
            bgcolor,
            color,
            px: 1.5,
            py: 0.5,
            borderRadius: theme.layout.radius.badge,
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
          };
        }}
      >
        {t(`status.${session.status}`)}
      </Box>
    </Box>
  );
}

function ModalDetailsGrid({ session, t }: Readonly<{ session: ClassSession; t: TranslationFn }>) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
      <Box
        sx={theme => ({
          bgcolor: theme.palette.surfaceContainerLow,
          p: 2,
          borderRadius: theme.layout.radius.card,
        })}
      >
        <Typography
          variant="labelMd"
          sx={theme => ({ color: theme.palette.onSurfaceVariant, textTransform: "uppercase", mb: 0.5 })}
        >
          {t("timeSlot")}
        </Typography>
        <Typography sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
          {session.timeSlot}
        </Typography>
      </Box>
      <Box
        sx={theme => ({
          bgcolor: theme.palette.surfaceContainerLow,
          p: 2,
          borderRadius: theme.layout.radius.card,
        })}
      >
        <Typography
          variant="labelMd"
          sx={theme => ({ color: theme.palette.onSurfaceVariant, textTransform: "uppercase", mb: 0.5 })}
        >
          {t("roomNo")}
        </Typography>
        <Typography sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>{session.room}</Typography>
      </Box>
    </Box>
  );
}

function ModalNotes({ session, t }: Readonly<{ session: ClassSession; t: TranslationFn }>) {
  return (
    <Box>
      <Typography
        variant="labelMd"
        sx={theme => ({ color: theme.palette.onSurfaceVariant, textTransform: "uppercase", mb: 1 })}
      >
        {t("contentNotes")}
      </Typography>
      <Box
        sx={theme => ({
          bgcolor: theme.palette.surfaceContainerLowest,
          border: `1px solid ${theme.palette.border.light}`,
          p: 2,
          borderRadius: theme.layout.radius.card,
          fontStyle: "italic",
        })}
      >
        <Typography variant="bodyMd">{session.notes}</Typography>
      </Box>
    </Box>
  );
}

function ModalActions({ t }: Readonly<{ t: TranslationFn }>) {
  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <Box
        component="button"
        sx={theme => ({
          flex: 1,
          py: 1.5,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.onPrimary,
          borderRadius: theme.layout.radius.button,
          fontWeight: 700,
          typography: "buttonText",
          "&:hover": { opacity: 0.95 },
          border: "none",
          cursor: "pointer",
        })}
      >
        {t("viewAssignments")}
      </Box>
      <Box
        component="button"
        sx={theme => ({
          flex: 1,
          py: 1.5,
          border: `1px solid ${theme.palette.border.light}`,
          color: theme.palette.primary.main,
          bgcolor: "transparent",
          borderRadius: theme.layout.radius.button,
          fontWeight: 700,
          typography: "buttonText",
          "&:hover": { bgcolor: theme.palette.surfaceContainerLow },
          cursor: "pointer",
        })}
      >
        {t("downloadLogs")}
      </Box>
    </Box>
  );
}
