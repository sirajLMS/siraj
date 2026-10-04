import { MobileEmptyState } from "@/frontend/mobile/components/ui/state/MobileEmptyState";
import {
  customEmptyStateSx,
  errorIcon,
  inboxIcon,
} from "@/frontend/mobile/components/ui/state/MobileEmptyState.stories.fixtures";

export function MobileEmptyStateAllVariants() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "48px", padding: "24px" }}>
      <div>
        <h4 style={{ marginBottom: "16px", fontWeight: 600 }}>Title Only</h4>
        <MobileEmptyState title="No data available" />
      </div>
      <div>
        <h4 style={{ marginBottom: "16px", fontWeight: 600 }}>Title + Subtitle</h4>
        <MobileEmptyState title="No data available" subtitle="There are no items to display at the moment." />
      </div>
      <div>
        <h4 style={{ marginBottom: "16px", fontWeight: 600 }}>With Icon</h4>
        <MobileEmptyState
          title="No messages"
          subtitle="Your inbox is empty. When you receive messages, they will appear here."
          icon={inboxIcon}
        />
      </div>
      <div>
        <h4 style={{ marginBottom: "16px", fontWeight: 600 }}>With Error Icon</h4>
        <MobileEmptyState
          title="Failed to load data"
          subtitle="An error occurred while fetching the data. Please try again later."
          icon={errorIcon}
        />
      </div>
      <div>
        <h4 style={{ marginBottom: "16px", fontWeight: 600 }}>Custom Styling</h4>
        <MobileEmptyState
          title="Custom styled empty state"
          subtitle="This empty state has custom padding and background color applied via the sx prop."
          icon={inboxIcon}
          sx={customEmptyStateSx}
        />
      </div>
    </div>
  );
}
