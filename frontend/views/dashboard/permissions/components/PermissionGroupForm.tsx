"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Close, Lock, Search } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Input,
  InputAdornment,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui";
import { FieldWrapper, labelSx, standardInputSx } from "@/frontend/components/ui/form";
import type { Permission, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";
import { type PermissionGroupFormData, permissionGroupSchema } from "../schemas/permissionGroupSchema";

interface PermissionGroupFormProps {
  readonly open: boolean;
  readonly group: PermissionGroup | null;
  readonly permissions: readonly Permission[];
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onSave: (name: string, description: string, permissionIds: string[]) => Promise<void>;
}

/**
 * PermissionGroupForm handles creating and editing permission groups.
 * It contains form fields for Name and Description, and a searchable,
 * categorised list of checkboxes for permissions.
 */
export function PermissionGroupForm({
  open,
  group,
  permissions,
  isLoading,
  onClose,
  onSave,
}: Readonly<PermissionGroupFormProps>) {
  const t = useTranslations("dashboard.permissions");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PermissionGroupFormData>({
    resolver: zodResolver(permissionGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      permissionIds: [],
    },
  });

  const selectedPermissionIds = useWatch({ control, name: "permissionIds" }) || [];

  // Reset form with group details on open/edit changes
  useEffect(() => {
    if (open) {
      if (group) {
        reset({
          name: group.name ?? "",
          description: group.description ?? "",
          permissionIds: (group.permissionIds ?? []).filter((id): id is string => !!id),
        });
      } else {
        reset({
          name: "",
          description: "",
          permissionIds: [],
        });
      }
      setSearchTerm("");
      setSelectedCategory("ALL");
    }
  }, [open, group, reset]);

  const onSubmit = async (data: PermissionGroupFormData) => {
    await onSave(data.name, data.description ?? "", data.permissionIds);
  };

  // Filter out any permission without id, key or category to make typing completely safe
  const validPermissions = permissions.filter(
    (p): p is Permission & { id: string; key: string; category: string } => !!p.id && !!p.key && !!p.category
  );

  // Get list of unique categories from all permissions
  const categories = Array.from(new Set(validPermissions.map(p => p.category)));

  // Filter permissions based on search text and category dropdown selection
  const filteredPermissions = validPermissions.filter(perm => {
    const matchesSearch =
      perm.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "ALL" || perm.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group filtered permissions by their category
  const groupedPermissions = filteredPermissions.reduce<
    Record<string, Array<Permission & { id: string; key: string; category: string }>>
  >((acc, perm) => {
    const cat = perm.category;
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(perm);
    return acc;
  }, {});

  const handleTogglePermission = (permId: string, isSystem: boolean) => {
    if (isSystem) return; // Cannot modify system permissions

    if (selectedPermissionIds.includes(permId)) {
      setValue(
        "permissionIds",
        selectedPermissionIds.filter(id => id !== permId)
      );
    } else {
      setValue("permissionIds", [...selectedPermissionIds, permId]);
    }
  };

  const handleSelectAllCategory = (categoryPerms: Array<Permission & { id: string }>, checked: boolean) => {
    const modifiablePerms = categoryPerms.filter(p => !p.isSystem);
    const modifiableIds = modifiablePerms.map(p => p.id);

    if (checked) {
      // Add all modifiable IDs from this category
      const merged = Array.from(new Set([...selectedPermissionIds, ...modifiableIds]));
      setValue("permissionIds", merged);
    } else {
      // Remove all modifiable IDs of this category
      setValue(
        "permissionIds",
        selectedPermissionIds.filter(id => !modifiableIds.includes(id))
      );
    }
  };

  const isGroupSelected = (categoryPerms: Array<Permission & { id: string }>) => {
    const modifiablePerms = categoryPerms.filter(p => !p.isSystem);
    if (modifiablePerms.length === 0) return false;
    return modifiablePerms.every(p => selectedPermissionIds.includes(p.id));
  };

  const isGroupIndeterminate = (categoryPerms: Array<Permission & { id: string }>) => {
    const modifiablePerms = categoryPerms.filter(p => !p.isSystem);
    if (modifiablePerms.length === 0) return false;
    const selectedInCategory = modifiablePerms.filter(p => selectedPermissionIds.includes(p.id));
    return selectedInCategory.length > 0 && selectedInCategory.length < modifiablePerms.length;
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="permission-group-form-title"
    >
      <DialogTitle id="permission-group-form-title">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="titleLg">{group ? t("editGroupTitle") : t("createGroupTitle")}</Typography>
          <IconButton onClick={onClose} disabled={isLoading} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Box
          component="form"
          id="permission-group-form"
          onSubmit={e => {
            e.preventDefault();
            handleSubmit(onSubmit)(e);
          }}
          sx={{ display: "flex", flexDirection: "column", gap: 4 }}
        >
          {/* Section 1: Basic Info */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FieldWrapper
                label={t("groupNameLabel")}
                required
                error={errors.name ? t("groupNamePlaceholder") : undefined}
              >
                <Input
                  {...register("name")}
                  error={!!errors.name}
                  placeholder={t("groupNamePlaceholder")}
                  fullWidth
                  sx={standardInputSx}
                  disabled={isLoading}
                />
              </FieldWrapper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FieldWrapper
                label={t("descriptionLabel")}
                error={errors.description ? t("descriptionPlaceholder") : undefined}
              >
                <Input
                  {...register("description")}
                  error={!!errors.description}
                  placeholder={t("descriptionPlaceholder")}
                  fullWidth
                  multiline
                  rows={2}
                  sx={standardInputSx}
                  disabled={isLoading}
                />
              </FieldWrapper>
            </Grid>
          </Grid>

          {/* Section 2: Permissions Assignment */}
          <SectionPanel title={t("addPermissions")}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Filter and Selection feedback bar */}
              <Box
                sx={theme => ({
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 2,
                  bgcolor: theme.palette.surfaceContainerHigh,
                  borderRadius: 2,
                })}
              >
                <Box
                  sx={{ display: "flex", flex: 1, gap: 2, width: "100%", flexDirection: { xs: "column", sm: "row" } }}
                >
                  <Input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder={t("searchPermissionsPlaceholder")}
                    sx={standardInputSx}
                    startAdornment={
                      <InputAdornment position="start">
                        <Search sx={theme => ({ color: theme.palette.text.secondary })} />
                      </InputAdornment>
                    }
                    disabled={isLoading}
                  />

                  <Select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    displayEmpty
                    variant="standard"
                    sx={standardInputSx}
                    disabled={isLoading}
                  >
                    <MenuItem value="ALL">{t("allCategoriesOption")}</MenuItem>
                    {categories.map(cat => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>

                <Box
                  sx={theme => ({
                    px: 2,
                    py: 1,
                    borderRadius: 1.5,
                    bgcolor: theme.palette.primaryContainer,
                    color: theme.palette.onPrimaryContainer,
                    fontWeight: 700,
                  })}
                >
                  {t("itemsSelectedLabel", { count: selectedPermissionIds.length })}
                </Box>
              </Box>

              {/* Permissions list grouped by category */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {Object.keys(groupedPermissions).length === 0 ? (
                  <Typography
                    variant="bodyMd"
                    sx={theme => ({ textAlign: "center", color: theme.palette.text.secondary, py: 4 })}
                  >
                    {t("noPermissionsFound")}
                  </Typography>
                ) : (
                  Object.entries(groupedPermissions).map(([categoryName, perms]) => {
                    const allChecked = isGroupSelected(perms);
                    const indeterminate = isGroupIndeterminate(perms);

                    return (
                      <Box
                        key={categoryName}
                        sx={theme => ({
                          border: `1px solid ${theme.palette.outlineVariant}`,
                          borderRadius: 2,
                          overflow: "hidden",
                        })}
                      >
                        {/* Category Header */}
                        <Box
                          sx={theme => ({
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            px: 2,
                            py: 1.5,
                            bgcolor: theme.palette.surfaceContainerHigh,
                            borderBottom: `1px solid ${theme.palette.outlineVariant}`,
                          })}
                        >
                          <Typography variant="bodyLg" sx={{ fontWeight: 700 }}>
                            {categoryName}
                          </Typography>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={allChecked}
                                indeterminate={indeterminate}
                                onChange={e => handleSelectAllCategory(perms, e.target.checked)}
                                disabled={isLoading}
                              />
                            }
                            label={
                              <Typography sx={labelSx} component="span">
                                {t("allCategoriesOption")}
                              </Typography>
                            }
                          />
                        </Box>

                        {/* Category Permissions List */}
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                          {perms.map(perm => {
                            const isChecked = selectedPermissionIds.includes(perm.id);

                            return (
                              <Box
                                key={perm.id}
                                onClick={() => handleTogglePermission(perm.id, !!perm.isSystem)}
                                sx={theme => ({
                                  display: "flex",
                                  alignItems: "center",
                                  px: 2,
                                  py: 1.5,
                                  cursor: perm.isSystem ? "not-allowed" : "pointer",
                                  bgcolor: isChecked ? theme.palette.primaryContainer : "transparent",
                                  borderBottom: `1px solid ${theme.palette.outlineVariant}`,
                                  "&:last-child": {
                                    borderBottom: "none",
                                  },
                                  "&:hover": {
                                    bgcolor: isChecked ? theme.palette.primaryContainer : theme.palette.action.hover,
                                  },
                                  opacity: perm.isSystem ? 0.7 : 1,
                                  transition: "background-color 0.2s",
                                })}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  disabled={!!perm.isSystem || isLoading}
                                  onClick={e => e.stopPropagation()}
                                  onChange={() => handleTogglePermission(perm.id, !!perm.isSystem)}
                                />

                                <Box sx={{ flex: 1, ml: 1 }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography
                                      variant="bodyMd"
                                      sx={theme => ({
                                        fontFamily: "monospace",
                                        fontWeight: 600,
                                        color: isChecked
                                          ? theme.palette.onPrimaryContainer
                                          : theme.palette.primary.main,
                                      })}
                                    >
                                      {perm.key}
                                    </Typography>
                                    {perm.isSystem && (
                                      <Tooltip title={t("corePermissionTooltip")}>
                                        <Lock fontSize="small" color="error" />
                                      </Tooltip>
                                    )}
                                  </Box>
                                  {perm.description && (
                                    <Typography
                                      variant="caption"
                                      sx={theme => ({
                                        color: isChecked
                                          ? theme.palette.onPrimaryContainer
                                          : theme.palette.text.secondary,
                                        mt: 0.5,
                                      })}
                                    >
                                      {perm.description}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>
          </SectionPanel>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
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
          form="permission-group-form"
          disabled={isLoading}
          variant="contained"
          sx={theme => ({
            bgcolor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            fontWeight: 700,
            borderRadius: 1.5,
            "&:hover": {
              bgcolor: theme.palette.primary.dark,
            },
          })}
        >
          {t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
