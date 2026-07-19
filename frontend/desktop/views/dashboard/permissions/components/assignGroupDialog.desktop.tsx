"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import type { User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import type { AssignGroupDialogProps } from "@/frontend/common/views/dashboard/permissions/types";
import { useAppTranslation } from "@/shared/locale";

export function AssignGroupDialogDesktop({
  open,
  group,
  users,
  isLoading,
  onClose,
  onAssign,
  control,
  errors,
  handleSubmit,
}: Readonly<AssignGroupDialogProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  if (!group) return null;

  const assignedUserIds = new Set(group.assignedUsers?.map(au => au.id) ?? []);
  const assignableUsers = users.filter(
    (user): user is User & { id: string } => !!user.id && !assignedUserIds.has(user.id)
  );

  const onSubmit = (data: { userId: string }) => {
    onAssign(data.userId);
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="assign-group-dialog-title-desktop"
    >
      <DialogTitle id="assign-group-dialog-title-desktop">
        {t.assignGroupTitle} ({resolveLocalizedString(group.name)})
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box
          component="form"
          id="assign-group-form-desktop"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 3 }}
        >
          <Controller
            name="userId"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth required error={!!errors.userId} disabled={isLoading} sx={outlinedInputSx}>
                <InputLabel id="assign-group-user-label-desktop" shrink>
                  {t.selectUserLabel}
                </InputLabel>
                <Select {...field} labelId="assign-group-user-label-desktop" label={t.selectUserLabel} displayEmpty>
                  <MenuItem value="" disabled>
                    {t.selectUserPlaceholder}
                  </MenuItem>
                  {assignableUsers.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
                {errors.userId ? <FormHelperText>{t.selectUserPlaceholder}</FormHelperText> : null}
              </FormControl>
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          disabled={isLoading}
          variant="text"
          sx={theme => ({
            color: theme.palette.text.secondary,
            fontWeight: 700,
            borderRadius: 1.5,
          })}
        >
          {t.cancel}
        </Button>
        <Button
          type="submit"
          form="assign-group-form-desktop"
          disabled={isLoading}
          variant="contained"
          sx={theme => ({
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            fontWeight: 700,
            borderRadius: 1.5,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
          })}
        >
          {t.assignButton}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
