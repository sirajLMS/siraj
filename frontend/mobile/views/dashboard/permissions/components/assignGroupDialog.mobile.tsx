"use client";

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useMemo } from "react";
import { Controller } from "react-hook-form";
import { type PersonOption, resolvePersonOption } from "@/frontend/common/components/ui/input/userSelect";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import type { AssignGroupDialogProps } from "@/frontend/common/views/dashboard/permissions/types";
import { UserAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { useAppTranslation } from "@/shared/locale";

export function AssignGroupDialogMobile({
  open,
  group,
  isLoading,
  onClose,
  onAssign,
  control,
  errors,
  handleSubmit,
}: Readonly<AssignGroupDialogProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  const assignedUserIds = useMemo(
    () => group?.assignedUsers?.map(user => user.id).filter((id): id is string => Boolean(id)) ?? [],
    [group]
  );

  if (!group) return null;

  const onSubmit = (data: { userId: string }) => {
    onAssign(data.userId);
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullScreen
      aria-labelledby="assign-group-dialog-title-mobile"
    >
      <DialogTitle id="assign-group-dialog-title-mobile">
        {t.assignGroupTitle} ({resolveLocalizedString(group.name)})
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box
          component="form"
          id="assign-group-form-mobile"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 3 }}
        >
          <Controller
            name="userId"
            control={control}
            render={({ field }) => {
              const selectedUser: PersonOption | null = field.value
                ? resolvePersonOption(field.value, [], { id: field.value, name: "" })
                : null;

              return (
                <UserAutocompleteMobile
                  value={selectedUser}
                  disabled={isLoading}
                  required
                  label={t.selectUserLabel}
                  placeholder={t.selectUserPlaceholder}
                  error={Boolean(errors.userId)}
                  helperText={errors.userId ? t.selectUserPlaceholder : undefined}
                  excludeIds={assignedUserIds}
                  onChange={person => {
                    if (person && assignedUserIds.includes(person.id)) {
                      return;
                    }
                    field.onChange(person?.id ?? "");
                  }}
                />
              );
            }}
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
          form="assign-group-form-mobile"
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
