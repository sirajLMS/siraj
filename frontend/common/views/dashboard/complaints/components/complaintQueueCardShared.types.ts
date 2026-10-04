import type { ButtonProps } from "@mui/material";
import type { StatusBadgeCategory } from "@/frontend/common/components/ui/badge/types/statusBadgeShared.types";

export type StatusBadgeComponentProps = {
  readonly category: StatusBadgeCategory;
  readonly status: string;
  readonly label: string;
};

export type ButtonComponentType = React.FC<Readonly<ButtonProps>>;
