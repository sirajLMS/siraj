import type { ReactElement } from "react";
import { Pie, PieChart, ResponsiveContainer } from "recharts";
import type { GaugeComponentProps } from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/quotaInsightsChartsShared.types";
import { makeGaugeShape } from "@/frontend/common/views/dashboard/billing/quota/utils";

/**
 * Shared PieChart gauge element for pending backlog. Both desktop and mobile
 * render the same Pie structure; they differ only in `height` and outer card
 * wrapping (handled by the caller).
 */
export function PendingBacklogGaugeContent({
  metrics,
  chartLabels,
  chartColors,
  height,
}: Readonly<GaugeComponentProps & { readonly height: number }>): ReactElement {
  const gaugeShape = makeGaugeShape(chartColors);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={[
            { name: chartLabels.pendingCredits, value: metrics.pendingBacklogCount },
            { name: "", value: Math.max(50 - metrics.pendingBacklogCount, 0) },
          ]}
          cx="50%"
          cy="80%"
          startAngle={180}
          endAngle={0}
          innerRadius="90%"
          outerRadius="100%"
          dataKey="value"
          shape={gaugeShape}
          isAnimationActive
          animationDuration={500}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
