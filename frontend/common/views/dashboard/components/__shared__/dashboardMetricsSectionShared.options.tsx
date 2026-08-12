import type {
  DashboardMetricsSectionSharedProps,
  ResponsiveGridSize,
} from "@/frontend/common/views/dashboard/components/__shared__/dashboardMetricsSectionShared";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui/card";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";

type SectionPanelSlot = React.ComponentType<{
  readonly title?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly children?: React.ReactNode;
  readonly edgeToEdge?: boolean;
  readonly contentInset?: boolean;
}>;

type MetricCardGridRenderParams = {
  readonly metrics: readonly DashboardMetricsSectionSharedProps["metrics"][number][];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedKey?: string;
  readonly gridSize?: ResponsiveGridSize;
};

export interface DashboardMetricsSectionSharedOptions {
  readonly SectionPanel: SectionPanelSlot;
  readonly renderMetricCardGrid: (params: MetricCardGridRenderParams) => React.ReactNode;
  readonly sectionPanelProps: {
    readonly edgeToEdge?: boolean;
    readonly contentInset?: boolean;
  };
}

export const DESKTOP_OPTIONS: DashboardMetricsSectionSharedOptions = {
  SectionPanel: DesktopSectionPanel,
  renderMetricCardGrid: ({ metrics, onMetricClick, selectedKey, gridSize }) => (
    <DesktopMetricCardGrid metrics={metrics} onMetricClick={onMetricClick} selectedKey={selectedKey} size={gridSize} />
  ),
  sectionPanelProps: {},
};

export const MOBILE_OPTIONS: DashboardMetricsSectionSharedOptions = {
  SectionPanel: MobileSectionPanel,
  renderMetricCardGrid: ({ metrics, onMetricClick, selectedKey }) => (
    <MobileMetricCardGrid metrics={metrics} onMetricClick={onMetricClick} selectedKey={selectedKey} />
  ),
  sectionPanelProps: { edgeToEdge: true, contentInset: false },
};
