import type { Meta, StoryObj } from "@storybook/react";
import { useTranslations } from "next-intl";
import { useTeacherDashboardActiveStore } from "@/frontend/stores/mockTeacherDashboardActiveStore";
import { useTeacherDashboardStore } from "@/frontend/stores/mockTeacherDashboardStore";
import { useUserStore as useMockUserStore } from "@/frontend/stores/mockUserStore";
import { TeacherDashboardActiveView } from "./TeacherDashboardActiveView";
import { TeacherDashboardView } from "./TeacherDashboardView";
import { buildTeacherDashboardLabels } from "./utils/buildTeacherDashboardLabels";

interface MockTeacherDashboardContainerProps {
  readonly mode?: "standard" | "active";
}

export function MockTeacherDashboardContainer({ mode = "standard" }: MockTeacherDashboardContainerProps) {
  const t = useTranslations("dashboard.teacherDashboard");
  const userName = useMockUserStore(state => state.name);

  const standardStore = useTeacherDashboardStore();
  const activeStore = useTeacherDashboardActiveStore();
  const labels = buildTeacherDashboardLabels(t);

  if (mode === "active") {
    const feed = activeStore.progressFeed.map(f => ({
      id: f.id,
      studentName: f.studentName,
      studentInitials: f.studentInitials,
      summary: f.summary,
      timeAgo: f.timeAgo,
      icon: f.icon,
    }));

    return (
      <TeacherDashboardActiveView
        userName={userName}
        metrics={activeStore.metrics}
        scheduleRows={activeStore.scheduleRows}
        progressFeed={feed}
        welcomeDateSummary={activeStore.welcomeDateSummary}
        sessionsScheduledToday={activeStore.sessionsScheduledToday}
        labels={labels}
        onActivate={id => alert(`Activated session ${id}`)}
        onNewSession={() => alert("New session clicked")}
        onStartSession={id => alert(`Start session ${id}`)}
        onMarkAbsent={id => alert(`Mark absent ${id}`)}
        onRequestLeave={id => alert(`Request leave ${id}`)}
      />
    );
  }

  return (
    <TeacherDashboardView
      metrics={standardStore.metrics}
      scheduleRows={standardStore.scheduleRows}
      missedAlert={standardStore.missedAlert}
      scheduleDateLabel={standardStore.scheduleDateLabel}
      totalScheduledToday={standardStore.totalScheduledToday}
      labels={labels}
      canActivate={true}
      canManualEntry={true}
      canPrintSchedule={true}
      onPrintSchedule={() => globalThis.print()}
      onManualEntry={() => alert("Manual entry clicked")}
      onJoinVideo={id => alert(`Join video for ${id}`)}
      onActivate={id => alert(`Activated session ${id}`)}
      onDownloadHandbook={() => alert("Download handbook clicked")}
      onContactCoordinator={() => alert("Contact coordinator clicked")}
      onSupport={() => alert("Live support clicked")}
    />
  );
}

const meta: Meta<typeof MockTeacherDashboardContainer> = {
  title: "Views/dashboard/teachers/dashboard/TeacherDashboardContainer",
  component: MockTeacherDashboardContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof MockTeacherDashboardContainer>;

export const Standard: Story = {
  args: {
    mode: "standard",
  },
};

export const Active: Story = {
  args: {
    mode: "active",
  },
};
