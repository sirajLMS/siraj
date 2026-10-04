"use client";

import { CloseOutlined } from "@mui/icons-material";
import { Box, DialogContent, DialogTitle, Divider, Drawer, IconButton } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildHelperText,
  computeFieldConfigs,
  resolveDismiss,
  resolveFieldChange,
} from "@/frontend/common/components/ui/input/localizedString/localizedStringDrawerShared.helpers";
import {
  DrawerFooter,
  LocalizedStringFieldStack,
} from "@/frontend/common/components/ui/input/localizedString/localizedStringDrawerShared.parts";
import type {
  LocaleEmojiComponentProps,
  LocalizedStringDrawerSlotProps,
} from "@/frontend/common/components/ui/input/localizedString/localizedStringDrawerShared.types";
import type { LocalizedStringDrawerProps } from "@/frontend/common/components/ui/input/localizedString/types/localizedStringDrawer.types";
import { hasRequiredLocalizedValue } from "@/frontend/common/lib/localized-string";
import { type AppLocale, Translation, useAppLocale, useAppTranslation } from "@/shared/locale";
import { DEFAULT_CONTENT_LOCALE, type LocalizedString } from "@/shared/types/localized-string";

export type { LocaleEmojiComponentProps, LocalizedStringDrawerSlotProps };

export function LocalizedStringDrawerShared({
  open,
  value,
  title,
  multiline,
  minRows,
  required = false,
  requiredLocales,
  onSaveAction,
  onCancelAction,
  saving = false,
  autosave = false,
  showActions,
  dismissAction = "save",
  anchor: anchorProp,
  LocaleEmoji,
  paperSx,
  footerButtonSx,
}: Readonly<LocalizedStringDrawerProps & LocalizedStringDrawerSlotProps>) {
  const t = useAppTranslation(Translation.Ui.LocalizedString);
  const uiLocale = useAppLocale();
  const [draft, setDraft] = useState<LocalizedString>(value);
  const prevOpenRef = useRef(false);

  const anchor = anchorProp ?? "right";

  const showFooter = useMemo(() => showActions ?? !autosave, [showActions, autosave]);
  const resolvedRequired = useMemo(
    () => requiredLocales ?? (required ? [DEFAULT_CONTENT_LOCALE] : []),
    [requiredLocales, required]
  );

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setDraft(value);
    }
    prevOpenRef.current = open;
  }, [open, value]);

  const handleFieldChange = useCallback(
    (locale: AppLocale, text: string) => resolveFieldChange({ draft, locale, text, autosave, onSaveAction, setDraft }),
    [draft, autosave, onSaveAction]
  );

  const valid = hasRequiredLocalizedValue(draft, resolvedRequired);
  const canSave = valid && !saving;

  const handleDismiss = useCallback(
    () => resolveDismiss({ autosave, dismissAction, canSave, draft, onSaveAction, onCancelAction }),
    [autosave, dismissAction, canSave, draft, onSaveAction, onCancelAction]
  );

  const headerTitle = useMemo(() => title ?? t.editTranslations, [title, t]);
  const requiredSet = useMemo(() => new Set<AppLocale>(resolvedRequired), [resolvedRequired]);
  const helperText = useMemo(
    () => buildHelperText({ draft, required, resolvedRequired, uiLocale, t }),
    [draft, required, resolvedRequired, uiLocale, t]
  );
  const fieldConfigs = useMemo(() => computeFieldConfigs(draft, requiredSet, uiLocale), [draft, requiredSet, uiLocale]);

  return (
    <Drawer open={open} anchor={anchor} onClose={handleDismiss} slotProps={{ paper: { sx: paperSx } }}>
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexShrink: 0 }}
      >
        <Box component="span" sx={{ typography: "h6" }}>
          {headerTitle}
        </Box>
        <IconButton onClick={handleDismiss} disabled={saving} size="small" aria-label={t.cancel}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent dividers sx={{ flex: 1, overflow: "auto" }}>
        <LocalizedStringFieldStack
          fieldConfigs={fieldConfigs}
          multiline={multiline}
          minRows={minRows}
          disabled={saving}
          onChange={handleFieldChange}
          t={t}
          LocaleEmoji={LocaleEmoji}
          helperText={helperText}
        />
      </DialogContent>
      {showFooter ? (
        <DrawerFooter
          canSave={canSave}
          saving={saving}
          onSaveAction={onSaveAction}
          draft={draft}
          onCancelAction={onCancelAction}
          t={t}
          footerButtonSx={footerButtonSx}
        />
      ) : null}
    </Drawer>
  );
}
