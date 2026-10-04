"use client";

import AutoModeOutlinedIcon from "@mui/icons-material/AutoModeOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import { Box, Button, Icon, Stack, Typography } from "@mui/material";
import {
  buildGuideSteps,
  buildModes,
  type GuideStep,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/AutoGenerationSupportCallout.helpers";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

type AutoGenerationLabels = ProfileNotificationsLabels["autoGeneration"];

function ExpandIcon({ expanded }: { readonly expanded: boolean }) {
  return (
    <Box
      component={ExpandMoreOutlinedIcon}
      sx={theme => ({
        color: theme.palette.onInfo,
        fontSize: 24,
        display: "inline-flex",
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        transition: theme.transitions.create("transform"),
      })}
    />
  );
}

function VisualIllustration() {
  return (
    <Stack
      sx={theme => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 0.75,
        py: 0.5,
        px: 1,
        borderRadius: 1.5,
        bgcolor: theme.palette.onInfo,
        color: theme.palette.info.main,
      })}
    >
      <VideocamOutlinedIcon fontSize="small" />
      <AutoModeOutlinedIcon fontSize="small" />
    </Stack>
  );
}

function StepItem({ step }: { readonly step: GuideStep }) {
  return (
    <Stack sx={{ flexDirection: "row", alignItems: "flex-start", gap: 1.25 }}>
      <Icon sx={theme => ({ color: theme.palette.onInfo, fontSize: 20, mt: 0.25 })}>{step.icon}</Icon>
      <Stack spacing={0.25}>
        <Typography sx={theme => ({ typography: "labelMd", fontWeight: 700, color: theme.palette.onInfo })}>
          {step.title}
        </Typography>
        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.onInfo })}>
          {step.description}
        </Typography>
      </Stack>
    </Stack>
  );
}

export function CollapsedSummary({
  labels,
  expanded,
  onToggle,
  contentId,
}: {
  readonly labels: AutoGenerationLabels;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly contentId: string;
}) {
  return (
    <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.25 }}>
      <VisualIllustration />
      <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={theme => ({ typography: "labelSm", fontWeight: 700, color: theme.palette.onInfo })}>
          {labels.title}
        </Typography>
        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.onInfo })}>{labels.summary}</Typography>
      </Stack>
      <Button
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={contentId}
        size="small"
        endIcon={<ExpandIcon expanded={expanded} />}
        sx={theme => ({
          color: theme.palette.onInfo,
          textTransform: "none",
          minWidth: "auto",
        })}
      >
        {expanded ? labels.learnLess : labels.learnMore}
      </Button>
    </Stack>
  );
}

export function ExpandedGuide({
  labels,
  onCreateConfig,
  createConfigHref,
}: {
  readonly labels: AutoGenerationLabels;
  readonly onCreateConfig?: () => void;
  readonly createConfigHref?: string;
}) {
  const steps = buildGuideSteps(labels);
  const modes = buildModes(labels);
  return (
    <Stack spacing={1.75} sx={{ pt: 1 }}>
      <Stack spacing={1.5}>
        {steps.map(step => (
          <StepItem key={step.title} step={step} />
        ))}
      </Stack>
      <Stack spacing={0.75}>
        {modes.map(mode => (
          <Stack key={mode.title} sx={{ flexDirection: "row", alignItems: "flex-start", gap: 1.25 }}>
            <Icon sx={theme => ({ color: theme.palette.onInfo, fontSize: 20, mt: 0.25 })}>{mode.icon}</Icon>
            <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.onInfo })}>{mode.title}</Typography>
          </Stack>
        ))}
      </Stack>
      {onCreateConfig || createConfigHref ? (
        <Button
          href={createConfigHref}
          onClick={onCreateConfig}
          size="small"
          startIcon={<SettingsOutlinedIcon />}
          sx={theme => ({
            alignSelf: "flex-start",
            color: theme.palette.onInfo,
            borderColor: theme.palette.onInfo,
            textTransform: "none",
            borderWidth: 1.5,
          })}
        >
          {labels.createConfig}
        </Button>
      ) : null}
    </Stack>
  );
}
