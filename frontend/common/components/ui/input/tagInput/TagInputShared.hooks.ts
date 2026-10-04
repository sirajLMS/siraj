"use client";

import {
  type ChangeEvent,
  type Dispatch,
  type FocusEvent,
  type KeyboardEvent,
  type RefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type TagInputSharedHandlers = {
  readonly handleContainerClick: () => void;
  readonly handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  readonly handleInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  readonly handleBlur: (e: FocusEvent) => void;
};

export type TagInputSharedState = {
  readonly tags: string[];
  readonly inputValue: string;
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly containerRef: RefObject<HTMLDivElement | null>;
  readonly setTags: Dispatch<SetStateAction<string[]>>;
} & TagInputSharedHandlers;

type TagInputHandlerContext = {
  readonly tags: string[];
  readonly setTags: Dispatch<SetStateAction<string[]>>;
  readonly inputValue: string;
  readonly setInputValue: Dispatch<SetStateAction<string>>;
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly containerRef: RefObject<HTMLDivElement | null>;
};

function useSyncedInitialTags(initialTags: string[], setTags: Dispatch<SetStateAction<string[]>>): void {
  const lastSyncedInitial = useRef<string>(JSON.stringify(initialTags));

  useEffect(() => {
    const serializedInitial = JSON.stringify(initialTags);
    if (serializedInitial !== lastSyncedInitial.current) {
      lastSyncedInitial.current = serializedInitial;
      setTags(initialTags);
    }
  }, [initialTags, setTags]);
}

function useTagsChangeNotifier(tags: string[], onChange?: (tags: string[]) => void): void {
  useEffect(() => {
    if (onChange) {
      onChange(tags);
    }
  }, [tags, onChange]);
}

function useTagInputHandlers(context: TagInputHandlerContext): TagInputSharedHandlers {
  const { tags, setTags, inputValue, setInputValue, inputRef, containerRef } = context;

  const handleContainerClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    },
    [setInputValue]
  );

  const addTag = useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim();
      if (trimmedTag && !tags.includes(trimmedTag)) {
        setTags([...tags, trimmedTag]);
        setInputValue("");
      }
    },
    [tags, setTags, setInputValue]
  );

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === "Enter" || e.key === ",") && inputValue) {
        e.preventDefault();
        addTag(inputValue);
      } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
        e.preventDefault();
        const lastTag = tags.at(-1) ?? "";
        setTags(tags.slice(0, -1));
        setInputValue(lastTag);
      }
    },
    [inputValue, tags, addTag, setTags, setInputValue]
  );

  const handleBlur = useCallback(
    (e: FocusEvent) => {
      if (inputValue && !containerRef.current?.contains(e.relatedTarget)) {
        addTag(inputValue);
      }
    },
    [inputValue, containerRef, addTag]
  );

  return { handleContainerClick, handleInputChange, handleInputKeyDown, handleBlur };
}

/**
 * Owns the tag buffer, input buffer, DOM refs, and input handlers for TagInputShared.
 * Keeps the presentational component focused on rendering the chip list and input.
 */
export function useTagInputSharedState(
  initialTags: string[],
  onChange?: (tags: string[]) => void
): TagInputSharedState {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useSyncedInitialTags(initialTags, setTags);
  useTagsChangeNotifier(tags, onChange);

  const handlers = useTagInputHandlers({ tags, setTags, inputValue, setInputValue, inputRef, containerRef });

  return { tags, inputValue, inputRef, containerRef, setTags, ...handlers };
}
