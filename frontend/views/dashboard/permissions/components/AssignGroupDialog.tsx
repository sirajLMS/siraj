"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Select } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { FieldWrapper, standardInputSx } from "@/frontend/components/ui/form";
import type { PermissionGroup, User } from "@/frontend/graphql/generated/gql/graphql-types";

interface AssignGroupDialogProps {
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

/**
 * AssignGroupDialog allows SuperAdmins to select a user and assign
 * the selected permission group to them.
 */
export function AssignGroupDialog({
  open,
  group,
  users,
  isLoading,
  onClose,
  onAssign,
}: Readonly<AssignGroupDialogProps>) {
  const t = useTranslations("dashboard.permissions");

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

  // Reset form when dialog opens or group changes
  useEffect(() => {
    if (open) {
      reset({ userId: "" });
    }
  }, [open, reset]);

  if (!group) return null;

  // Filter out users who are already assigned to this group, ensuring id is defined
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
      fullWidth
      maxWidth="xs"
      aria-labelledby="assign-group-dialog-title"
    >
      <DialogTitle id="assign-group-dialog-title">
        {t("assignGroupTitle")} ({group.name})
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box
          component="form"
          id="assign-group-form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 3 }}
        >
          <Controller
            name="userId"
            control={control}
            render={({ field }) => (
              <FieldWrapper
                label={t("selectUserLabel")}
                required
                error={errors.userId ? t("selectUserPlaceholder") : undefined}
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
                    {t("selectUserPlaceholder")}
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
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          form="assign-group-form"
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
          {t("assignButton")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
