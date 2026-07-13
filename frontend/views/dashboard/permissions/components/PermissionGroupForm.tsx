"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Close } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { type Control, useForm, useWatch } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui";
import { LocalizedStringFormField } from "@/frontend/components/ui/input/localizedString";
import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { LocalizedString } from "@/frontend/common/types/localized-string.types";
import { PermissionCategoryList } from "@/frontend/views/dashboard/permissions/components/PermissionCategoryList";
import { PermissionFilterBar } from "@/frontend/views/dashboard/permissions/components/PermissionFilterBar";
import {
  type PermissionGroupFormData,
  permissionGroupSchema,
} from "@/frontend/views/dashboard/permissions/schemas/permissionGroupSchema";

type ValidPermission = Permission & { id: string; key: string; category: string };

interface PermissionGroupFormProps {
  readonly open: boolean;
  readonly group: PermissionGroup | null;
  readonly permissions: readonly Permission[];
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onSave: (name: LocalizedString, description: LocalizedString, permissionIds: string[]) => Promise<void>;
}

function usePermissionFilters(permissions: readonly Permission[], searchTerm: string, selectedCategory: string) {
  const t = useTranslations("dashboard.permissions");

  const validPermissions = useMemo(
    () => permissions.filter((p): p is ValidPermission => !!p.id && !!p.key && !!p.category),
    [permissions]
  );

  const categories = useMemo(() => {
    const cats = validPermissions.map(p => p.category).filter((c): c is string => c.trim() !== "");
    return Array.from(new Set(cats));
  }, [validPermissions]);

  const filteredPermissions = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return validPermissions.filter(perm => {
      const matchesSearch =
        perm.key.toLowerCase().includes(q) || (perm.description?.toLowerCase().includes(q) ?? false);
      const matchesCategory = selectedCategory === "ALL" || perm.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [validPermissions, searchTerm, selectedCategory]);

  const groupedPermissions = useMemo(
    () =>
      filteredPermissions.reduce<Record<string, ValidPermission[]>>((acc, perm) => {
        const cat = perm.category || t("allCategoriesOption");
        if (!acc[cat]) {
          acc[cat] = [];
        }
        acc[cat].push(perm);
        return acc;
      }, {}),
    [filteredPermissions, t]
  );

  return { categories, groupedPermissions };
}

function usePermissionSelection(
  control: Control<PermissionGroupFormData>,
  setValue: ReturnType<typeof useForm<PermissionGroupFormData>>["setValue"]
) {
  const selectedPermissionIds = useWatch({ control, name: "permissionIds" }) ?? [];

  const handleTogglePermission = (permId: string, isSystem: boolean) => {
    if (isSystem) return;
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
      const merged = Array.from(new Set([...selectedPermissionIds, ...modifiableIds]));
      setValue("permissionIds", merged);
    } else {
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

  return {
    selectedPermissionIds,
    handleTogglePermission,
    handleSelectAllCategory,
    isGroupSelected,
    isGroupIndeterminate,
  };
}

function PermissionGroupFormActions({
  isLoading,
  onClose,
  t,
}: {
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly t: ReturnType<typeof useTranslations>;
}) {
  return (
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
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.onPrimary,
          fontWeight: 700,
          borderRadius: 1.5,
          "&:hover": {
            backgroundColor: theme.palette.primary.dark,
          },
        })}
      >
        {t("save")}
      </Button>
    </DialogActions>
  );
}

function PermissionGroupFormContent({
  control,
  isLoading,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  groupedPermissions,
  selectedPermissionIds,
  isGroupSelected,
  isGroupIndeterminate,
  handleSelectAllCategory,
  handleTogglePermission,
  handleSubmitForm,
  t,
}: {
  readonly control: Control<PermissionGroupFormData>;
  readonly isLoading: boolean;
  readonly searchTerm: string;
  readonly setSearchTerm: (v: string) => void;
  readonly selectedCategory: string;
  readonly setSelectedCategory: (v: string) => void;
  readonly categories: string[];
  readonly groupedPermissions: Record<string, ValidPermission[]>;
  readonly selectedPermissionIds: string[];
  readonly isGroupSelected: (perms: Array<Permission & { id: string }>) => boolean;
  readonly isGroupIndeterminate: (perms: Array<Permission & { id: string }>) => boolean;
  readonly handleSelectAllCategory: (perms: Array<Permission & { id: string }>, checked: boolean) => void;
  readonly handleTogglePermission: (permId: string, isSystem: boolean) => void;
  readonly handleSubmitForm: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  readonly t: ReturnType<typeof useTranslations>;
}) {
  return (
    <DialogContent dividers sx={{ p: 3 }}>
      <Box
        component="form"
        id="permission-group-form"
        onSubmit={handleSubmitForm}
        sx={{ display: "flex", flexDirection: "column", gap: 4 }}
      >
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <LocalizedStringFormField
              name="name"
              control={control}
              label={t("groupNameLabel")}
              required
              disabled={isLoading}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <LocalizedStringFormField
              name="description"
              control={control}
              label={t("descriptionLabel")}
              multiline
              minRows={2}
              disabled={isLoading}
              fullWidth
            />
          </Grid>
        </Grid>

        <SectionPanel title={t("addPermissions")}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <PermissionFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
              selectedCount={selectedPermissionIds.length}
              isLoading={isLoading}
            />
            <PermissionCategoryList
              groupedPermissions={groupedPermissions}
              selectedPermissionIds={selectedPermissionIds}
              isGroupSelected={isGroupSelected}
              isGroupIndeterminate={isGroupIndeterminate}
              onSelectAllCategory={handleSelectAllCategory}
              onTogglePermission={handleTogglePermission}
              isLoading={isLoading}
            />
          </Box>
        </SectionPanel>
      </Box>
    </DialogContent>
  );
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

  const { control, handleSubmit, setValue, reset } = useForm<PermissionGroupFormData>({
    resolver: zodResolver(permissionGroupSchema),
    defaultValues: {
      name: {},
      description: {},
      permissionIds: [],
    },
  });

  useEffect(() => {
    if (open) {
      if (group) {
        reset({
          name: (group.name ?? {}) as PermissionGroupFormData["name"],
          description: (group.description ?? {}) as PermissionGroupFormData["description"],
          permissionIds: (group.permissionIds ?? []).filter((id): id is string => !!id),
        });
      } else {
        reset({ name: {}, description: {}, permissionIds: [] });
      }
      setSearchTerm("");
      setSelectedCategory("ALL");
    }
  }, [open, group, reset]);

  const onSubmit = async (data: PermissionGroupFormData) => {
    await onSave(data.name, data.description ?? {}, data.permissionIds);
  };

  const { categories, groupedPermissions } = usePermissionFilters(permissions, searchTerm, selectedCategory);
  const {
    selectedPermissionIds,
    handleTogglePermission,
    handleSelectAllCategory,
    isGroupSelected,
    isGroupIndeterminate,
  } = usePermissionSelection(control, setValue);

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

      <PermissionGroupFormContent
        control={control}
        isLoading={isLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        groupedPermissions={groupedPermissions}
        selectedPermissionIds={selectedPermissionIds}
        isGroupSelected={isGroupSelected}
        isGroupIndeterminate={isGroupIndeterminate}
        handleSelectAllCategory={handleSelectAllCategory}
        handleTogglePermission={handleTogglePermission}
        handleSubmitForm={e => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}
        t={t}
      />

      <PermissionGroupFormActions isLoading={isLoading} onClose={onClose} t={t} />
    </Dialog>
  );
}
