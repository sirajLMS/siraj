// NEW FOR PLAN v5: lifted state hook out of tier localizedStringInput renderers; tier files now import this common hook.
//   Migrated from frontend/common/components/ui/input/localizedString/hooks/useLocalizedStringInputState.ts
//   to frontend/common/hooks/ to satisfy specs.md §2.4 allowlist — tier imports
//   of common UI hooks dirs (@/frontend/common/components/ui/**/hooks) are forbidden.
"use client";

import type { SxProps, Theme } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocaleSwitchSuccess } from "@/frontend/common/hooks/useLocaleSwitchSuccess";
import { useNarrowContainer } from "@/frontend/common/hooks/useNarrowContainer";
import { getLanguageDisplayName } from "@/frontend/common/lib/locale";
import { pickInitialActiveLocale, setLocalizedString } from "@/frontend/common/lib/localized-string";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { AppLocale } from "@/shared/locale";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { LocalizedStringLabels } from "@/shared/locale/types/ui";
import type { LocalizedString } from "@/shared/types";
import { DEFAULT_CONTENT_LOCALE } from "@/shared/types/localized-string";

export type LocalizedStringInputStateProps = {
  readonly value: LocalizedString;
  readonly onChangeAction: (value: LocalizedString) => void;
  readonly error: boolean;
  readonly required: boolean;
  readonly requiredLocales?: readonly AppLocale[];
  readonly errorMessage?: string;
  readonly helperText?: string;
  readonly label?: string;
  readonly drawerTitle?: string;
  readonly drawerAutosave: boolean;
  readonly multiline?: boolean;
  readonly containerRef: React.RefObject<HTMLDivElement | null>;
};

export type LocalizedStringInputState = {
  readonly isCompact: boolean;
  readonly activeLocale: AppLocale;
  readonly draft: LocalizedString;
  readonly drawerOpen: boolean;
  readonly successSwitch: boolean;
  readonly resolvedRequiredLocales: readonly AppLocale[];
  readonly fieldValue: string;
  readonly isRtl: boolean;
  readonly showInlineError: boolean;
  readonly inlineHelperText: string | undefined;
  readonly drawerResolvedTitle: string;
  readonly textFieldSuccessSx: SxProps<Theme> | undefined;
  readonly adornmentTopSx: { alignSelf: string; height: string; marginTop: number } | undefined;
  readonly handleFieldChange: (text: string) => void;
  readonly handleLocaleSwitch: (nextLocale: AppLocale) => void;
  readonly handleDrawerSave: (next: LocalizedString) => void;
  readonly handleDrawerCancel: () => void;
  readonly setDrawerOpen: (open: boolean) => void;
};

type LocalizedStringT = LocalizedStringLabels;

const SUCCESS_FIELD_SX: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    borderColor: (theme: Theme) => theme.palette.success.main,
  },
  transition: (theme: Theme) => theme.transitions.create("border-color", { duration: 500 }),
};

const MULTILINE_ADORNMENT_TOP_SX = { alignSelf: "flex-start", height: "auto", marginTop: 1.75 } as const;

const buildInlineHelperText = (args: {
  errorMessage?: string;
  helperText?: string;
  activeRequired: boolean;
  isFieldEmpty: boolean;
  required: boolean;
  activeLocale: AppLocale;
  uiLocale: string;
  t: LocalizedStringT;
}): string | undefined => {
  if (args.errorMessage) return args.errorMessage;
  if (args.activeRequired && args.isFieldEmpty && args.required) {
    return args.t.localeRequiredEntry(getLanguageDisplayName(args.activeLocale, args.uiLocale));
  }
  return args.helperText;
};

const shouldFlashSuccess = (
  draft: LocalizedString,
  fromLocale: AppLocale,
  error: boolean,
  requiredLocales: readonly AppLocale[]
): boolean => {
  const currentValue = draft[fromLocale] ?? "";
  const wasValid = currentValue.trim() !== "" && (!requiredLocales.includes(fromLocale) || currentValue.trim() !== "");
  return wasValid && !error;
};

const buildSuccessSx = (successSwitch: boolean, showInlineError: boolean): SxProps<Theme> | undefined =>
  successSwitch && !showInlineError ? SUCCESS_FIELD_SX : undefined;

const buildAdornmentTopSx = (
  multiline?: boolean
): { alignSelf: string; height: string; marginTop: number } | undefined =>
  multiline ? MULTILINE_ADORNMENT_TOP_SX : undefined;

const buildDrawerTitle = (drawerTitle: string | undefined, label: string | undefined, t: LocalizedStringT): string =>
  drawerTitle ?? label ?? t.editTranslations;

type ChangeHandlers = Pick<
  LocalizedStringInputState,
  "handleFieldChange" | "handleLocaleSwitch" | "handleDrawerSave" | "handleDrawerCancel"
>;

function useChangeHandlers(args: {
  readonly emitChange: (next: LocalizedString) => void;
  readonly draft: LocalizedString;
  readonly activeLocale: AppLocale;
  readonly setActiveLocale: (next: AppLocale) => void;
  readonly error: boolean;
  readonly resolvedRequiredLocales: readonly AppLocale[];
  readonly triggerSuccess: () => void;
  readonly drawerAutosave: boolean;
  readonly setDrawerOpen: (open: boolean) => void;
}): ChangeHandlers {
  const {
    emitChange,
    draft,
    activeLocale,
    setActiveLocale,
    error,
    resolvedRequiredLocales,
    triggerSuccess,
    drawerAutosave,
    setDrawerOpen,
  } = args;

  const handleFieldChange = useCallback(
    (text: string) => emitChange(setLocalizedString(draft, activeLocale, text)),
    [draft, activeLocale, emitChange]
  );

  const handleLocaleSwitch = useCallback(
    (nextLocale: AppLocale) => {
      if (shouldFlashSuccess(draft, activeLocale, error, resolvedRequiredLocales)) {
        triggerSuccess();
      }
      setActiveLocale(nextLocale);
    },
    [draft, activeLocale, error, resolvedRequiredLocales, triggerSuccess, setActiveLocale]
  );

  const handleDrawerSave = useCallback(
    (next: LocalizedString) => {
      emitChange(next);
      if (!drawerAutosave) setDrawerOpen(false);
    },
    [emitChange, drawerAutosave, setDrawerOpen]
  );

  const handleDrawerCancel = useCallback(() => setDrawerOpen(false), [setDrawerOpen]);

  return { handleFieldChange, handleLocaleSwitch, handleDrawerSave, handleDrawerCancel };
}

type DisplayState = Pick<
  LocalizedStringInputState,
  | "fieldValue"
  | "isRtl"
  | "showInlineError"
  | "inlineHelperText"
  | "drawerResolvedTitle"
  | "textFieldSuccessSx"
  | "adornmentTopSx"
>;

function useDisplayState(args: {
  readonly draft: LocalizedString;
  readonly activeLocale: AppLocale;
  readonly error: boolean;
  readonly required: boolean;
  readonly multiline?: boolean;
  readonly successSwitch: boolean;
  readonly requiredSet: Set<AppLocale>;
  readonly errorMessage?: string;
  readonly helperText?: string;
  readonly label?: string;
  readonly drawerTitle?: string;
  readonly uiLocale: string;
  readonly t: LocalizedStringT;
}): DisplayState {
  const activeRequired = args.requiredSet.has(args.activeLocale);
  const fieldValue = args.draft[args.activeLocale] ?? "";
  const isRtl = args.activeLocale === "ar";
  const isFieldEmpty = fieldValue.trim() === "";
  const showInlineError = args.error || (activeRequired && isFieldEmpty && args.required);

  const inlineHelperText = useMemo(
    () =>
      buildInlineHelperText({
        errorMessage: args.errorMessage,
        helperText: args.helperText,
        activeRequired,
        isFieldEmpty,
        required: args.required,
        activeLocale: args.activeLocale,
        uiLocale: args.uiLocale,
        t: args.t,
      }),
    [
      args.errorMessage,
      args.helperText,
      activeRequired,
      isFieldEmpty,
      args.required,
      args.t,
      args.activeLocale,
      args.uiLocale,
    ]
  );

  const drawerResolvedTitle = useMemo(
    () => buildDrawerTitle(args.drawerTitle, args.label, args.t),
    [args.drawerTitle, args.label, args.t]
  );
  const textFieldSuccessSx = useMemo(
    () => buildSuccessSx(args.successSwitch, showInlineError),
    [args.successSwitch, showInlineError]
  );
  const adornmentTopSx = useMemo(() => buildAdornmentTopSx(args.multiline), [args.multiline]);

  return {
    fieldValue,
    isRtl,
    showInlineError,
    inlineHelperText,
    drawerResolvedTitle,
    textFieldSuccessSx,
    adornmentTopSx,
  };
}

export const useLocalizedStringInputState = (props: LocalizedStringInputStateProps): LocalizedStringInputState => {
  const {
    value,
    onChangeAction,
    error,
    required,
    requiredLocales,
    errorMessage,
    helperText,
    label,
    drawerTitle,
    drawerAutosave,
    multiline,
    containerRef,
  } = props;
  const t = useAppTranslation(Translation.Ui.LocalizedString);
  const uiLocale = useAppLocale();
  const isCompact = useNarrowContainer(containerRef);

  const resolvedRequiredLocales = useMemo(
    () => requiredLocales ?? (required ? [DEFAULT_CONTENT_LOCALE] : []),
    [requiredLocales, required]
  );
  const requiredSet = useMemo(() => new Set<AppLocale>(resolvedRequiredLocales), [resolvedRequiredLocales]);

  const [activeLocale, setActiveLocale] = useState<AppLocale>(() => pickInitialActiveLocale(uiLocale));
  const [draft, setDraft] = useState<LocalizedString>(value);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { successSwitch, triggerSuccess } = useLocaleSwitchSuccess();

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const emitChange = useCallback(
    (next: LocalizedString) => {
      setDraft(next);
      onChangeAction(next);
    },
    [onChangeAction]
  );

  const handlers = useChangeHandlers({
    emitChange,
    draft,
    activeLocale,
    setActiveLocale,
    error,
    resolvedRequiredLocales,
    triggerSuccess,
    drawerAutosave,
    setDrawerOpen,
  });

  const display = useDisplayState({
    draft,
    activeLocale,
    error,
    required,
    multiline,
    successSwitch,
    requiredSet,
    errorMessage,
    helperText,
    label,
    drawerTitle,
    uiLocale,
    t,
  });

  return {
    isCompact,
    activeLocale,
    draft,
    drawerOpen,
    successSwitch,
    resolvedRequiredLocales,
    ...display,
    ...handlers,
    setDrawerOpen,
  };
};
