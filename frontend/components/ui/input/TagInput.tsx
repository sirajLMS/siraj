"use client";

import { Box, Chip, InputBase, Paper, styled, Typography, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import type React from "react";
import { type KeyboardEvent, type MouseEvent, useCallback, useEffect, useRef, useState } from "react";

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
  border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.23)" : "rgba(0, 0, 0, 0.23)"}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
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
  tags: readonly string[];
  editingIndex: number | null;
  editingValue: string;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  onEditInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditKeyDown: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => void;
  onEditBlur: (index: number) => void;
  onDelete: (index: number) => (e: MouseEvent) => void;
  onChipDoubleClick: (index: number) => void;
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

export function TagInput({ label, placeholder, onChange, initialTags = [] }: TagInputProps) {
  const t = useTranslations("ui.tagInput");
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  const resolvedLabel = label ?? t("label");
  const resolvedPlaceholder = placeholder ?? t("placeholder");

  useEffect(() => {
    if (onChange) {
      onChange(tags);
    }
  }, [tags, onChange]);

  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingIndex]);

  const handleContainerClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleEditInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingValue(e.target.value);
  }, []);

  const addTag = useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim();
      if (trimmedTag && !tags.includes(trimmedTag)) {
        setTags([...tags, trimmedTag]);
        setInputValue("");
      }
    },
    [tags]
  );

  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditingValue("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const updateTag = useCallback(
    (index: number) => {
      const trimmedValue = editingValue.trim();
      if (trimmedValue && !tags.includes(trimmedValue)) {
        const newTags = [...tags];
        newTags[index] = trimmedValue;
        setTags(newTags);
      }
      cancelEdit();
    },
    [editingValue, tags, cancelEdit]
  );

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === "Enter" || e.key === ",") && inputValue) {
        e.preventDefault();
        addTag(inputValue);
      } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
        e.preventDefault();
        const lastTag = tags[tags.length - 1];
        setTags(tags.slice(0, -1));
        setInputValue(lastTag);
      }
    },
    [inputValue, tags, addTag]
  );

  const handleEditKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
      if (e.key === "Enter") {
        e.preventDefault();
        updateTag(index);
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
      }
    },
    [updateTag, cancelEdit]
  );

  const handleChipDoubleClick = useCallback(
    (index: number) => {
      setEditingIndex(index);
      setEditingValue(tags[index]);
    },
    [tags]
  );

  const handleDelete = useCallback(
    (index: number) => (e: MouseEvent) => {
      e.stopPropagation();
      const newTags = [...tags];
      newTags.splice(index, 1);
      setTags(newTags);
    },
    [tags]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      if (inputValue && !containerRef.current?.contains(e.relatedTarget as Node)) {
        addTag(inputValue);
      }
    },
    [inputValue, addTag]
  );

  const handleEditBlur = useCallback(
    (index: number) => {
      updateTag(index);
    },
    [updateTag]
  );

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
          editingIndex={editingIndex}
          editingValue={editingValue}
          editInputRef={editInputRef}
          onEditInputChange={handleEditInputChange}
          onEditKeyDown={handleEditKeyDown}
          onEditBlur={handleEditBlur}
          onDelete={handleDelete}
          onChipDoubleClick={handleChipDoubleClick}
        />
        <StyledInputBase
          inputRef={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? resolvedPlaceholder : ""}
          sx={{
            margin: 0.5,
            flexGrow: 1,
          }}
        />
      </TagContainer>
    </Box>
  );
}
