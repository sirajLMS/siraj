import { Box } from "@mui/material";
import type { ReactNode } from "react";
import type { ParentBillingViewModel } from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel";

export interface ParentBillingSharedOptions {
  readonly renderBillingSection: (vm: Readonly<ParentBillingViewModel>) => ReactNode;
  readonly wrapperBox: boolean;
}

export function ParentBillingShared({
  options,
  ...vm
}: Readonly<ParentBillingViewModel> & { readonly options: ParentBillingSharedOptions }): ReactNode {
  const sectionContent = options.renderBillingSection(vm);
  const content = <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>{sectionContent}</Box>;
  return options.wrapperBox ? content : sectionContent;
}
