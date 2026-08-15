"use client";

import AutoModeOutlinedIcon from "@mui/icons-material/AutoModeOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Box, Button, Card, CardContent, Collapse, Icon, Stack, Typography } from "@mui/material";
import { useId, useState } from "react";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

export type AutoGenerationSupportCalloutProps = {
  readonly labels: ProfileNotificationsLabels["autoGeneration"];
  readonly onCreateConfig?: () => void;
  readonly createConfigHref?: string;
};

type GuideStep = {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
};

type ModeItem = {
  readonly icon: React.ReactNode;
  readonly title: string;
};

function buildGuideSteps(labels: ProfileNotificationsLabels["autoGeneration"]): readonly GuideStep[] {
  return [
    {
      icon: <LinkOutlinedIcon />,
      title: labels.step1Title,
      description: labels.step1Description,
    },
    {
      icon: <SettingsOutlinedIcon />,
      title: labels.step2Title,
      description: labels.step2Description,
    },
    {
      icon: <AutoModeOutlinedIcon />,
      title: labels.step3Title,
      description: labels.step3Description,
    },
  ];
}

function buildModes(labels: ProfileNotificationsLabels["autoGeneration"]): readonly ModeItem[] {
  return [
    { icon: <SaveOutlinedIcon />, title: labels.onSave },
    { icon: <VisibilityOutlinedIcon />, title: labels.preview },
    { icon: <EventAvailableOutlinedIcon />, title: labels.booking },
  ];
}

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
        <Typography sx={theme => ({ typography: "bodySm", color: theme.palette.onInfo })}>
          {step.description}
        </Typography>
      </Stack>
    </Stack>
  );
}

function CollapsedSummary({
  labels,
  expanded,
  onToggle,
  contentId,
}: {
  readonly labels: ProfileNotificationsLabels["autoGeneration"];
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly contentId: string;
}) {
  return (
    <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.25 }}>
      <VisualIllustration />
      <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={theme => ({ typography: "titleSm", fontWeight: 700, color: theme.palette.onInfo })}>
          {labels.title}
        </Typography>
        <Typography sx={theme => ({ typography: "bodySm", color: theme.palette.onInfo })}>{labels.summary}</Typography>
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

function ExpandedGuide({
  labels,
  onCreateConfig,
  createConfigHref,
}: {
  readonly labels: ProfileNotificationsLabels["autoGeneration"];
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
            <Typography sx={theme => ({ typography: "bodySm", color: theme.palette.onInfo })}>{mode.title}</Typography>
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

export function AutoGenerationSupportCallout({
  labels,
  onCreateConfig,
  createConfigHref,
}: AutoGenerationSupportCalloutProps) {
  const reactId = useId();
  const sanitizedId = reactId.replace(/[^a-zA-Z0-9]/gu, "");
  const contentId = `auto-gen-content-${sanitizedId}`;
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => setExpanded(prev => !prev);

  return (
    <Card variant="outlined" sx={theme => ({ bgcolor: theme.palette.info.main })}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          <CollapsedSummary labels={labels} expanded={expanded} onToggle={handleToggle} contentId={contentId} />
          <Collapse in={expanded} id={contentId}>
            <ExpandedGuide labels={labels} onCreateConfig={onCreateConfig} createConfigHref={createConfigHref} />
          </Collapse>
        </Stack>
      </CardContent>
    </Card>
  );
}
