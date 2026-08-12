import type { PermissionFilterBarSharedOptions } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionFilterBarShared";

export const DESKTOP_OPTIONS: PermissionFilterBarSharedOptions = {
  filterContainerSx: theme => ({
    display: "flex",
    flexDirection: "row",
    gap: theme.spacing(2),
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing(2),
    backgroundColor: theme.palette.surfaceContainerHigh,
    borderRadius: Number(theme.shape.borderRadius) * 2,
  }),
  inputGroupSx: theme => ({
    display: "flex",
    flex: 1,
    gap: theme.spacing(2),
    width: "100%",
    flexDirection: "row",
  }),
  selectedCountBadgeSx: theme => ({
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    borderRadius: Number(theme.shape.borderRadius) * 1.5,
    backgroundColor: theme.palette.primaryContainer,
    color: theme.palette.onPrimaryContainer,
    fontWeight: 700,
  }),
};

export const MOBILE_OPTIONS: PermissionFilterBarSharedOptions = {
  filterContainerSx: theme => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    justifyContent: "space-between",
    alignItems: "stretch",
    padding: theme.spacing(2),
    backgroundColor: theme.palette.surfaceContainerHigh,
    borderRadius: Number(theme.shape.borderRadius) * 2,
  }),
  inputGroupSx: theme => ({
    display: "flex",
    flex: 1,
    gap: theme.spacing(2),
    width: "100%",
    flexDirection: "column",
  }),
  selectedCountBadgeSx: theme => ({
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    borderRadius: Number(theme.shape.borderRadius) * 1.5,
    backgroundColor: theme.palette.primaryContainer,
    color: theme.palette.onPrimaryContainer,
    fontWeight: 700,
    alignSelf: "flex-start",
  }),
};
