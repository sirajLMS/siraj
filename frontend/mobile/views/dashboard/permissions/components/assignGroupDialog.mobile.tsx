"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Select } from "@mui/material";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { standardInputSx } from "@/frontend/common/components/ui/form";
import type { PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { useAppTranslation } from "@/shared/locale";

interface AssignGroupDialogMobileProps {
  readonly open: boolean;
  readonly group: PermissionGroup | null;
  readonly users: readonly User[];
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onAssign: (userId: string) => void;
}

const assignSchema = z.object({
  userId: z.string().min(1, "userRequired"),
});

type AssignFormValues = z.infer<typeof assignSchema>;

export function AssignGroupDialogMobile({
  open,
  group,
  users,
  isLoading,
  onClose,
  onAssign,
}: Readonly<AssignGroupDialogMobileProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      userId: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({ userId: "" });
    }
  }, [open, reset]);

  if (!group) return null;

  const assignedUserIds = new Set(group.assignedUsers?.map(au => au.id) ?? []);
  const assignableUsers = users.filter(
    (user): user is User & { id: string } => !!user.id && !assignedUserIds.has(user.id)
  );

  const onSubmit = (data: AssignFormValues) => {
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
            render={({ field }) => (
              <MobileFieldWrapper
                label={t.selectUserLabel}
                required
                error={errors.userId ? t.selectUserPlaceholder : undefined}
              >
                <Select
                  {...field}
                  error={!!errors.userId}
                  fullWidth
                  variant="standard"
                  displayEmpty
                  sx={standardInputSx}
                  disabled={isLoading}
                >
                  <MenuItem value="" disabled>
                    {t.selectUserPlaceholder}
                  </MenuItem>
                  {assignableUsers.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FieldWrapper>
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
