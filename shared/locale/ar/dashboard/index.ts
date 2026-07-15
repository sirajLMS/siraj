import { admin } from "./admin";
import { view as adminView } from "./admin/view";
import { main as billing } from "./billing/main";
import { main as meetingProviders } from "./meeting-providers/main";

export const dashboard = {
  admin,
  adminView,
  billing,
  meetingProviders,
};
