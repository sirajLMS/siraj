import type { Components, Theme } from "@mui/material/styles";
import { getMuiInputOverrides } from "@/frontend/common/providers/theme/components.autofill";
import { getMuiCssBaseline } from "@/frontend/common/providers/theme/components.cssBaseline";
import {
  getMuiButton,
  getMuiCard,
  getMuiDataGrid,
  getMuiPaper,
  getMuiTypography,
} from "@/frontend/common/providers/theme/components.simple";
import { getMuiSwitch } from "@/frontend/common/providers/theme/components.switch";

export const components = (): Components<Omit<Theme, "components">> => {
  return {
    MuiCssBaseline: getMuiCssBaseline(),
    MuiButton: getMuiButton(),
    MuiPaper: getMuiPaper(),
    MuiCard: getMuiCard(),
    MuiSwitch: getMuiSwitch(),
    MuiTypography: getMuiTypography(),
    ...getMuiInputOverrides(),
    MuiDataGrid: getMuiDataGrid(),
  };
};
