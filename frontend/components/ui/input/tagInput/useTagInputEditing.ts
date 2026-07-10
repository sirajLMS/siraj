"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export type TagInputEditingApi = {
  readonly editingIndex: number | null;
  readonly editingValue: string;
  readonly editInputRef: React.RefObject<HTMLInputElement | null>;
  readonly startEdit: (index: number, currentTags: readonly string[]) => void;
  readonly cancelEdit: () => void;
  readonly updateTag: (index: number, currentTags: readonly string[]) => void;
  readonly handleEditInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly handleEditKeyDown: (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
    currentTags: readonly string[]
  ) => void;
  readonly handleEditBlur: (index: number, currentTags: readonly string[]) => void;
  readonly handleEditAndCommit: (index: number, currentTags: readonly string[]) => void;
};

type CancelEditFn = () => void;
type UpdateTagFn = (index: number, currentTags: readonly string[]) => void;

function performUpdateTag(
  editingValue: string,
  index: number,
  currentTags: readonly string[],
  onCommit: (index: number, value: string) => void,
  cancelEdit: CancelEditFn
): void {
  const trimmedValue = editingValue.trim();
  if (trimmedValue && !currentTags.includes(trimmedValue)) {
    onCommit(index, trimmedValue);
  }
  cancelEdit();
}

function processEditKeyDown(
  e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  index: number,
  currentTags: readonly string[],
  updateTag: UpdateTagFn,
  cancelEdit: CancelEditFn
): void {
  if (e.key === "Enter") {
    e.preventDefault();
    updateTag(index, currentTags);
  } else if (e.key === "Escape") {
    e.preventDefault();
    cancelEdit();
  }
}

/**
 * Manages the chip-editing lifecycle for TagInput: which chip is being edited,
 * the editing buffer value, focus handling, and commit/cancel flows.
 */
export function useTagInputEditing(onCommit: (index: number, value: string) => void): TagInputEditingApi {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingIndex]);

  const startEdit = useCallback((index: number, currentTags: readonly string[]) => {
    setEditingIndex(index);
    setEditingValue(currentTags[index] ?? "");
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditingValue("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const updateTag = useCallback(
    (index: number, currentTags: readonly string[]) => {
      performUpdateTag(editingValue, index, currentTags, onCommit, cancelEdit);
    },
    [editingValue, onCommit, cancelEdit]
  );

  const handleEditInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingValue(e.target.value);
  }, []);

  const handleEditKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, index: number, currentTags: readonly string[]) => {
      processEditKeyDown(e, index, currentTags, updateTag, cancelEdit);
    },
    [updateTag, cancelEdit]
  );

  const handleEditBlur = useCallback(
    (index: number, currentTags: readonly string[]) => {
      updateTag(index, currentTags);
    },
    [updateTag]
  );

  const handleEditAndCommit = useCallback(
    (index: number, currentTags: readonly string[]) => {
      updateTag(index, currentTags);
    },
    [updateTag]
  );

  return {
    editingIndex,
    editingValue,
    editInputRef,
    startEdit,
    cancelEdit,
    updateTag,
    handleEditInputChange,
    handleEditKeyDown,
    handleEditBlur,
    handleEditAndCommit,
  };
}

export type TagInputDeletionApi = {
  readonly handleDelete: (index: number) => (e: MouseEvent) => void;
};

/**
 * Returns a stable delete handler for TagInput chips.
 */
export function useTagInputDeletion(setTags: React.Dispatch<React.SetStateAction<string[]>>): TagInputDeletionApi {
  const handleDelete = useCallback(
    (index: number) => (e: MouseEvent) => {
      e.stopPropagation();
      setTags(prevTags => {
        const newTags = [...prevTags];
        newTags.splice(index, 1);
        return newTags;
      });
    },
    [setTags]
  );

  return { handleDelete };
}
