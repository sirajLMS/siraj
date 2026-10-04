"use client";

import { Box, Chip, InputBase, Paper, styled, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type React from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { useTagInputSharedState } from "@/frontend/common/components/ui/input/tagInput/TagInputShared.hooks";
import { useTagInputDeletion, useTagInputEditing } from "@/frontend/common/hooks/useTagInputEditing";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { Translation, useAppTranslation } from "@/shared/locale";

export type TagInputSharedProps = {
  readonly label?: string;
  readonly placeholder?: string;
  readonly onChange?: (tags: string[]) => void;
  readonly initialTags?: string[];
};

export type TagInputSlotProps = {
  /** Chip `size` prop — `"small"` for common/desktop, `"medium"` for mobile. */
  readonly chipSize?: "small" | "medium";
  /** Extra `sx` merged into each Chip (mobile adds `minHeight` + `fontSize`). */
  readonly chipSxExt?: SxProps<Theme>;
  /** Extra `sx` merged into the label Typography (mobile adds `fontSize`). */
  readonly labelSxExt?: SxProps<Theme>;
  /** Extra `sx` merged into the main InputBase (desktop adds `margin` + `flexGrow`). */
  readonly inputSxExt?: SxProps<Theme>;
  /** Extra `sx` merged into the chip-edit InputBase (mobile adds larger sizes). */
  readonly chipEditInputSxExt?: SxProps<Theme>;
};

const DEFAULT_INITIAL_TAGS: string[] = [];

const TagContainer = styled(Paper)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  padding: theme.spacing(1),
  minHeight: "56px",
  alignItems: "flex-start",
  cursor: "text",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.action.hover,
  transition: theme.transitions.create(["border-color", "box-shadow"]),
  "&:focus-within": {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 2px ${theme.palette.primary.main}${theme.palette.mode === "dark" ? "40" : "20"}`,
  },
}));

const baseChipAnimationSx: SxProps<Theme> = (theme: Theme) => ({
  m: 0.5,
  transition: theme.transitions.create("all", { duration: 200, easing: "ease" }),
  "@keyframes fadeIn": {
    "0%": {
      opacity: 0,
      transform: "scale(0.9)",
    },
    "100%": {
      opacity: 1,
      transform: "scale(1)",
    },
  },
});

const baseLabelSx: SxProps<Theme> = (theme: Theme) => ({
  mb: 1,
  fontWeight: 500,
  color: theme.palette.text.primary,
});

const baseInputSx: SxProps<Theme> = (theme: Theme) => ({
  flex: 1,
  fontSize: theme.typography.bodyLg.fontSize,
  padding: 0.5,
  minWidth: "120px",
  height: "32px",
});

const baseChipEditInputSx: SxProps<Theme> = (theme: Theme) => ({
  fontSize: theme.typography.bodyMd.fontSize,
  padding: theme.spacing(0.25, 0.5),
  margin: theme.spacing(0.5),
  border: `1px solid ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  width: "auto",
  minWidth: "60px",
  height: "24px",
});

function TagInputChipListShared({
  tags,
  editingIndex,
  editingValue,
  editInputRef,
  onEditInputChange,
  onEditKeyDown,
  onEditBlur,
  onDelete,
  onChipDoubleClick,
  chipEditInputSx,
  chipSx,
  chipSize,
}: {
  readonly tags: readonly string[];
  readonly editingIndex: number | null;
  readonly editingValue: string;
  readonly editInputRef: React.RefObject<HTMLInputElement | null>;
  readonly onEditInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onEditKeyDown: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => void;
  readonly onEditBlur: (index: number) => void;
  readonly onDelete: (index: number) => (e: MouseEvent) => void;
  readonly onChipDoubleClick: (index: number) => void;
  readonly chipEditInputSx: SxProps<Theme>;
  readonly chipSx: SxProps<Theme>;
  readonly chipSize: "small" | "medium";
}) {
  return tags.map((tag, index) =>
    editingIndex === index ? (
      <InputBase
        key={tag}
        inputRef={editInputRef}
        value={editingValue}
        onChange={onEditInputChange}
        onKeyDown={e => onEditKeyDown(e, index)}
        onBlur={() => onEditBlur(index)}
        sx={chipEditInputSx}
      />
    ) : (
      <Chip
        key={tag}
        label={tag}
        onDelete={onDelete(index)}
        onClick={e => e.stopPropagation()}
        onDoubleClick={() => onChipDoubleClick(index)}
        size={chipSize}
        sx={chipSx}
      />
    )
  );
}

export function TagInputShared({
  label,
  placeholder,
  onChange,
  initialTags = DEFAULT_INITIAL_TAGS,
  chipSize = "small",
  chipSxExt,
  labelSxExt,
  inputSxExt,
  chipEditInputSxExt,
}: Readonly<TagInputSharedProps & TagInputSlotProps>): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.TagInput);
  const {
    tags,
    setTags,
    inputValue,
    inputRef,
    containerRef,
    handleContainerClick,
    handleInputChange,
    handleInputKeyDown,
    handleBlur,
  } = useTagInputSharedState(initialTags, onChange);
  const resolvedLabel = label ?? t.label;
  const resolvedPlaceholder = placeholder ?? t.placeholder;

  const editing = useTagInputEditing((index, value) => {
    setTags(prevTags => {
      const newTags = [...prevTags];
      newTags[index] = value;
      return newTags;
    });
  });
  const deletion = useTagInputDeletion(setTags);

  const mergedChipSx = mergeSx(baseChipAnimationSx, chipSxExt);
  const mergedLabelSx = mergeSx(baseLabelSx, labelSxExt);
  const mergedInputSx = mergeSx(baseInputSx, inputSxExt);
  const mergedChipEditInputSx = mergeSx(baseChipEditInputSx, chipEditInputSxExt);

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="body2" sx={mergedLabelSx}>
        {resolvedLabel}
      </Typography>

      <TagContainer ref={containerRef} onClick={handleContainerClick} elevation={0}>
        <TagInputChipListShared
          tags={tags}
          editingIndex={editing.editingIndex}
          editingValue={editing.editingValue}
          editInputRef={editing.editInputRef}
          onEditInputChange={editing.handleEditInputChange}
          onEditKeyDown={(e, index) => editing.handleEditKeyDown(e, index, tags)}
          onEditBlur={index => editing.handleEditBlur(index, tags)}
          onDelete={deletion.handleDelete}
          onChipDoubleClick={index => editing.startEdit(index, tags)}
          chipEditInputSx={mergedChipEditInputSx}
          chipSx={mergedChipSx}
          chipSize={chipSize}
        />
        <InputBase
          inputRef={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? resolvedPlaceholder : ""}
          sx={mergedInputSx}
        />
      </TagContainer>
    </Box>
  );
}
