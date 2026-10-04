import { Button } from "@mui/material";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { MobilePageHeader } from "@/frontend/mobile/components/ui/container/page/MobilePageHeader";

const stickyShellStyle: CSSProperties = { height: "200vh", paddingBottom: "100px" };
const stickySpacerStyle: CSSProperties = { padding: "16px", marginTop: "200px" };
const variantHeadingStyle: CSSProperties = { marginBottom: "8px", fontWeight: 600 };
const variantsColumnStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: "32px", padding: "16px" };

interface StickyScrollDecoratorProps {
  readonly Story: () => ReactElement;
  readonly spacerText: string;
}

/** Wraps a story in a tall scrollable shell so sticky positioning is observable. */
export function StickyScrollDecorator({ Story, spacerText }: StickyScrollDecoratorProps) {
  return (
    <div style={stickyShellStyle}>
      <Story />
      <div style={stickySpacerStyle}>
        <p>{spacerText}</p>
      </div>
    </div>
  );
}

export function ReportActions() {
  return (
    <>
      <Button variant="outlined" size="small">
        Export CSV
      </Button>
      <Button variant="contained" size="small">
        Generate Report
      </Button>
    </>
  );
}

export function FilterAddActions() {
  return (
    <>
      <Button variant="outlined" size="small">
        Filter
      </Button>
      <Button variant="contained" size="small">
        Add New
      </Button>
    </>
  );
}

function ExportGenerateActions() {
  return (
    <>
      <Button variant="outlined" size="small">
        Export
      </Button>
      <Button variant="contained" size="small">
        Generate
      </Button>
    </>
  );
}

function VariantBlock({ label, children }: Readonly<{ readonly label: string; readonly children: ReactNode }>) {
  return (
    <div>
      <h4 style={variantHeadingStyle}>{label}</h4>
      {children}
    </div>
  );
}

/** Renders every MobilePageHeader variant stacked in one scrollable column. */
export function MobilePageHeaderAllVariants() {
  return (
    <div style={variantsColumnStyle}>
      <VariantBlock label="Default">
        <MobilePageHeader title="Dashboard" subtitle="Overview" />
      </VariantBlock>
      <VariantBlock label="With Breadcrumbs">
        <MobilePageHeader
          title="Edit Profile"
          breadcrumbs={[
            { label: "Settings", href: "#" },
            { label: "Profile", current: true },
          ]}
        />
      </VariantBlock>
      <VariantBlock label="With Actions">
        <MobilePageHeader title="Reports" actions={<ExportGenerateActions />} />
      </VariantBlock>
      <VariantBlock label="Edge-to-Edge">
        <MobilePageHeader title="Full Width" edgeToEdge={true} />
      </VariantBlock>
      <VariantBlock label="Sticky">
        <div style={{ height: "100vh" }}>
          <MobilePageHeader title="Sticky Header" sticky={true} edgeToEdge={true} />
          <div style={stickySpacerStyle}>Scroll content...</div>
        </div>
      </VariantBlock>
    </div>
  );
}
