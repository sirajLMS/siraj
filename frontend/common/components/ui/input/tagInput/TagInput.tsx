"use client";

import { Box, Chip, InputBase, Paper, styled, type Theme, Typography, useTheme } from "@mui/material";
import type React from "react";
import { type KeyboardEvent, type MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import { useTagInputEditing } from "@/frontend/common/hooks/useTagInputEditing";
import { Translation, useAppTranslation } from "@/shared/locale";

export type TagInputProps = {
  readonly label?: string;
  readonly placeholder?: string;
  readonly onChange?: (tags: string[]) => void;
  readonly initialTags?: string[];
};

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

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  flex: 1,
  fontSize: 16,
  padding: theme.spacing(0.5),
  minWidth: "120px",
  height: "32px",
}));

const ChipEditInput = styled(InputBase)(({ theme }) => ({
  fontSize: 14,
  padding: theme.spacing(0.25, 0.5),
  margin: theme.spacing(0.5),
  border: `1px solid ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  width: "auto",
  minWidth: "60px",
  height: "24px",
}));

const chipAnimationSx = {
  m: 0.5,
  transition: "all 0.2s ease",
  animation: "fadeIn 0.3s",
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
} as const;

function TagInputChipList({
  tags,
  editingIndex,
  editingValue,
  editInputRef,
  onEditInputChange,
  onEditKeyDown,
  onEditBlur,
  onDelete,
  onChipDoubleClick,
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
}) {
  return tags.map((tag, index) =>
    editingIndex === index ? (
      <ChipEditInput
        key={tag}
        inputRef={editInputRef}
        value={editingValue}
        onChange={onEditInputChange}
        onKeyDown={e => onEditKeyDown(e, index)}
        onBlur={() => onEditBlur(index)}
        autoFocus
      />
    ) : (
      <Chip
        key={tag}
        label={tag}
        onDelete={onDelete(index)}
        onClick={e => e.stopPropagation()}
        onDoubleClick={() => onChipDoubleClick(index)}
        size="small"
        sx={chipAnimationSx}
      />
    )
  );
}

type TagInputViewProps = {
  readonly theme: Theme;
  readonly resolvedLabel: string;
  readonly resolvedPlaceholder: string;
  readonly tags: string[];
  readonly inputValue: string;
  readonly inputRef: React.RefObject<HTMLInputElement | null>;
  readonly containerRef: React.RefObject<HTMLDivElement | null>;
  readonly editing: ReturnType<typeof useTagInputEditing>;
  readonly handleContainerClick: () => void;
  readonly handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly handleInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  readonly handleBlur: (e: React.FocusEvent) => void;
  readonly handleDeleteTag: (index: number) => (e: MouseEvent) => void;
};

function TagInputView({
  theme,
  resolvedLabel,
  resolvedPlaceholder,
  tags,
  inputValue,
  inputRef,
  containerRef,
  editing,
  handleContainerClick,
  handleInputChange,
  handleInputKeyDown,
  handleBlur,
  handleDeleteTag,
}: TagInputViewProps) {
  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        variant="body2"
        sx={{
          mb: 1,
          fontWeight: 500,
          color: theme.palette.text.primary,
        }}
      >
        {resolvedLabel}
      </Typography>

      <TagContainer ref={containerRef} onClick={handleContainerClick} elevation={0}>
        <TagInputChipList
          tags={tags}
          editingIndex={editing.editingIndex}
          editingValue={editing.editingValue}
          editInputRef={editing.editInputRef}
          onEditInputChange={editing.handleEditInputChange}
          onEditKeyDown={(e, index) => editing.handleEditKeyDown(e, index, tags)}
          onEditBlur={index => editing.handleEditBlur(index, tags)}
          onDelete={handleDeleteTag}
          onChipDoubleClick={index => editing.startEdit(index, tags)}
        />
        <StyledInputBase
          inputRef={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? resolvedPlaceholder : ""}
        />
      </TagContainer>
    </Box>
  );
}

function useTagInput({ label, placeholder, onChange, initialTags = [] }: TagInputProps) {
  const t = useAppTranslation(Translation.Ui.TagInput);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const resolvedLabel = label ?? t.label;
  const resolvedPlaceholder = placeholder ?? t.placeholder;

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const lastSyncedInitial = useRef<string>(JSON.stringify(initialTags));

  const updateTags = useCallback((newTags: string[]) => {
    setTags(newTags);
    lastSyncedInitial.current = JSON.stringify(newTags);
    if (onChangeRef.current) {
      onChangeRef.current(newTags);
    }
  }, []);

  const handleCommitEdit = useCallback(
    (index: number, value: string) => {
      const newTags = [...tags];
      newTags[index] = value;
      updateTags(newTags);
    },
    [tags, updateTags]
  );

  const editing = useTagInputEditing(handleCommitEdit);

  const handleDeleteTag = useCallback(
    (index: number) => (e: MouseEvent) => {
      e.stopPropagation();
      const newTags = tags.filter((_, i) => i !== index);
      updateTags(newTags);
    },
    [tags, updateTags]
  );

  useEffect(() => {
    const serializedInitial = JSON.stringify(initialTags);
    if (serializedInitial !== lastSyncedInitial.current) {
      lastSyncedInitial.current = serializedInitial;
      setTags(initialTags);
    }
  }, [initialTags]);

  const handleContainerClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const addTag = useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim();
      if (trimmedTag && !tags.includes(trimmedTag)) {
        updateTags([...tags, trimmedTag]);
        setInputValue("");
      }
    },
    [tags, updateTags]
  );

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === "Enter" || e.key === ",") && inputValue) {
        e.preventDefault();
        addTag(inputValue);
      } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
        e.preventDefault();
        const lastTag = tags.at(-1) ?? "";
        updateTags(tags.slice(0, -1));
        setInputValue(lastTag);
      }
    },
    [inputValue, tags, addTag, updateTags]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      if (inputValue && !containerRef.current?.contains(e.relatedTarget)) {
        addTag(inputValue);
      }
    },
    [inputValue, addTag]
  );

  return {
    theme,
    resolvedLabel,
    resolvedPlaceholder,
    tags,
    inputValue,
    inputRef,
    containerRef,
    editing,
    handleContainerClick,
    handleInputChange,
    handleInputKeyDown,
    handleBlur,
    handleDeleteTag,
  };
}

export function TagInput(props: TagInputProps) {
  const viewProps = useTagInput(props);
  return <TagInputView {...viewProps} />;
}
