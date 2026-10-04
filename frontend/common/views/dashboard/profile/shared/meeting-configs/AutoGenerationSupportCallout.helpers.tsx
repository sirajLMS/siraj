"use client";

import AutoModeOutlinedIcon from "@mui/icons-material/AutoModeOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

type AutoGenerationLabels = ProfileNotificationsLabels["autoGeneration"];

export type GuideStep = {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
};

type ModeItem = {
  readonly icon: React.ReactNode;
  readonly title: string;
};

export function buildGuideSteps(labels: AutoGenerationLabels): readonly GuideStep[] {
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

export function buildModes(labels: AutoGenerationLabels): readonly ModeItem[] {
  return [
    { icon: <SaveOutlinedIcon />, title: labels.onSave },
    { icon: <VisibilityOutlinedIcon />, title: labels.preview },
    { icon: <EventAvailableOutlinedIcon />, title: labels.booking },
  ];
}
