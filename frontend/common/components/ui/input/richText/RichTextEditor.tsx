"use client";

import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import { Box, FormControl, FormHelperText, IconButton, InputLabel } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import type React from "react";
import { useEffect, useId, useRef } from "react";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { RichTextLabels } from "@/shared/locale/types";

export interface RichTextEditorProps {
  /** Current document as an HTML string; the empty document is `""`. */
  readonly value: string;
  /** Receives the document HTML on every user edit; `""` when cleared. */
  readonly onChange: (html: string) => void;
  readonly label?: string;
  readonly helperText?: string;
  readonly error?: boolean;
  readonly disabled?: boolean;
  readonly required?: boolean;
  /** Base id used to derive the label/editor aria association. */
  readonly id?: string;
  /** Minimum visible text rows in the content area; defaults to 3. */
  readonly minRows?: number;
}

interface ToolbarAction {
  readonly key: string;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly isActive: (editor: Editor) => boolean;
  readonly run: (editor: Editor) => void;
}

/** Toolbar definition; every action maps 1:1 to a mark/node the persisted allowlist keeps. */
function buildToolbarActions(t: RichTextLabels): readonly ToolbarAction[] {
  return [
    {
      key: "bold",
      label: t.bold,
      icon: <FormatBoldIcon fontSize="small" />,
      isActive: editor => editor.isActive("bold"),
      run: editor => {
        editor.chain().focus().toggleBold().run();
      },
    },
    {
      key: "italic",
      label: t.italic,
      icon: <FormatItalicIcon fontSize="small" />,
      isActive: editor => editor.isActive("italic"),
      run: editor => {
        editor.chain().focus().toggleItalic().run();
      },
    },
    {
      key: "underline",
      label: t.underline,
      icon: <FormatUnderlinedIcon fontSize="small" />,
      isActive: editor => editor.isActive("underline"),
      run: editor => {
        editor.chain().focus().toggleUnderline().run();
      },
    },
    {
      key: "bulletList",
      label: t.bulletList,
      icon: <FormatListBulletedIcon fontSize="small" />,
      isActive: editor => editor.isActive("bulletList"),
      run: editor => {
        editor.chain().focus().toggleBulletList().run();
      },
    },
    {
      key: "orderedList",
      label: t.orderedList,
      icon: <FormatListNumberedIcon fontSize="small" />,
      isActive: editor => editor.isActive("orderedList"),
      run: editor => {
        editor.chain().focus().toggleOrderedList().run();
      },
    },
  ];
}

function buildEditorSurfaceSx(error: boolean, disabled: boolean, minRows: number): SxProps<Theme> {
  return (theme: Theme) => ({
    position: "relative",
    // Numeric sx borderRadius is multiplied by theme.shape.borderRadius, so 1
    // resolves to the same radius MUI OutlinedInput uses in styleOverrides.
    borderRadius: 1,
    backgroundColor: disabled ? theme.palette.action.disabledBackground : "transparent",
    cursor: disabled ? "default" : "text",
    "&:focus-within fieldset": {
      borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
    },
    "& .ProseMirror": {
      outline: "none",
      // bodyMd rows are 20px (14px × 1.43); the 2×1.5 vertical padding adds 3
      // spacing units, so the default shows ~3 text rows and grows past them.
      minHeight: theme.spacing(minRows * 2.5 + 3),
      padding: theme.spacing(1.5, 2),
      whiteSpace: "pre-wrap",
      ...theme.typography.bodyMd,
      "& ul, & ol": {
        paddingInlineStart: theme.spacing(3),
      },
    },
  });
}

/**
 * Border overlay that encloses the toolbar and the content as a single
 * control (notched-outline technique): the fieldset draws the one rounded
 * border, and its hidden legend reserves the gap the shrunken floating label
 * occupies, so nothing is painted over the border to fake a notch.
 */
function buildOutlineSx(error: boolean): SxProps<Theme> {
  return (theme: Theme) => ({
    textAlign: "start",
    position: "absolute",
    inset: "-5px 0 0 0",
    margin: 0,
    padding: "0 8px",
    pointerEvents: "none",
    borderRadius: "inherit",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: error ? theme.palette.error.main : theme.palette.divider,
    overflow: "hidden",
    minWidth: "0%",
    // The legend's 0.75em must resolve against the same base size the scaled
    // floating label uses so the reserved notch matches the label width.
    ...theme.typography.body1,
  });
}

const outlineLegendSx: SxProps<Theme> = {
  float: "unset",
  width: "auto",
  overflow: "hidden",
  display: "block",
  padding: 0,
  height: 11,
  fontSize: "0.75em",
  visibility: "hidden",
  maxWidth: "100%",
  whiteSpace: "nowrap",
  "& > span": {
    paddingInline: "5px",
    display: "inline-block",
    opacity: 0,
    visibility: "visible",
  },
};

const toolbarRowSx: SxProps<Theme> = (theme: Theme) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: 0.5,
  // 1.25 here + the 0.75 button padding aligns the first icon with the 2
  // spacing units of content padding below.
  padding: theme.spacing(0.5, 1.25),
  borderBlockEnd: `1px solid ${theme.palette.divider}`,
  // Round the band's top corners to the container radius so its background
  // stays inside the notched-outline arc instead of squaring against it.
  borderStartStartRadius: `${theme.shape.borderRadius}px`,
  borderStartEndRadius: `${theme.shape.borderRadius}px`,
  backgroundColor: theme.palette.surfaceContainerLow,
});

function ToolbarButton({
  action,
  editor,
  disabled,
}: {
  readonly action: ToolbarAction;
  readonly editor: Editor;
  readonly disabled: boolean;
}): React.ReactNode {
  const active = action.isActive(editor);
  return (
    <IconButton
      size="small"
      aria-label={action.label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={event => event.preventDefault()}
      onClick={() => action.run(editor)}
      sx={(theme: Theme) => ({
        // 6px of padding around the 20px icon gives a 32px touch target.
        padding: theme.spacing(0.75),
        color: active ? theme.palette.primary.main : theme.palette.text.secondary,
        backgroundColor: active ? theme.palette.action.selected : "transparent",
        "&:hover": {
          backgroundColor: active ? theme.palette.action.selected : theme.palette.action.hover,
        },
      })}
    >
      {action.icon}
    </IconButton>
  );
}

/**
 * Controlled rich-text input with a fixed minimal toolbar (bold, italic,
 * underline, bullet and ordered lists) whose tag set stays within the
 * server-side allowlist. Emits HTML on every edit and `""` when the document
 * is cleared, so form state can treat emptiness as a plain falsy string.
 */
export function RichTextEditor({
  value,
  onChange,
  label,
  helperText,
  error = false,
  disabled = false,
  required = false,
  id,
  minRows = 3,
}: RichTextEditorProps): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.RichText);
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const labelId = `${baseId}-label`;
  const helperTextId = `${baseId}-helper`;
  // Last HTML delivered to the consumer; guards the external-value sync so a
  // prop echo of our own onChange never re-enters setContent (no update loop).
  const lastEmittedRef = useRef(value);
  // The editor instance is created once, so its `onUpdate` closure would
  // otherwise pin the first render's `onChange`. Mirror the prop into a ref
  // and always call the latest handler.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    // Server rendering must not touch the DOM; the instance mounts client-side.
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        link: false,
        strike: false,
      }),
    ],
    content: value,
    editorProps: {
      attributes: label
        ? { role: "textbox", "aria-multiline": "true", "aria-labelledby": labelId }
        : { role: "textbox", "aria-multiline": "true", "aria-label": t.editorLabel },
    },
    onUpdate: ({ editor: editorInstance }) => {
      const html = editorInstance.isEmpty ? "" : editorInstance.getHTML();
      if (html === lastEmittedRef.current) {
        return;
      }
      lastEmittedRef.current = html;
      onChangeRef.current(html);
    },
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  // Error/required state and the helper text are purely visual in MUI; mirror
  // them onto the editable element so assistive tech sees the same status.
  useEffect(() => {
    if (!editor) return;
    const editableElement = editor.view.dom;
    editableElement.setAttribute("aria-required", String(required));
    editableElement.setAttribute("aria-invalid", String(error));
    if (helperText) {
      editableElement.setAttribute("aria-describedby", helperTextId);
    } else {
      editableElement.removeAttribute("aria-describedby");
    }
  }, [editor, required, error, helperText, helperTextId]);

  useEffect(() => {
    if (!editor || value === lastEmittedRef.current) {
      return;
    }
    lastEmittedRef.current = value;
    editor.commands.setContent(value);
  }, [editor, value]);

  return (
    <FormControl fullWidth error={error} disabled={disabled} required={required}>
      {label ? (
        <InputLabel shrink id={labelId}>
          {label}
        </InputLabel>
      ) : null}
      <Box sx={buildEditorSurfaceSx(error, disabled, minRows)}>
        <Box component="fieldset" aria-hidden sx={buildOutlineSx(error)}>
          {label ? (
            <Box component="legend" sx={outlineLegendSx}>
              <span>{required ? `${label}\u2009*` : label}</span>
            </Box>
          ) : null}
        </Box>
        <Box sx={toolbarRowSx} role="toolbar" aria-label={t.editorLabel}>
          {editor
            ? buildToolbarActions(t).map(action => (
                <ToolbarButton key={action.key} action={action} editor={editor} disabled={disabled} />
              ))
            : null}
        </Box>
        <EditorContent editor={editor} />
      </Box>
      {helperText ? <FormHelperText id={helperTextId}>{helperText}</FormHelperText> : null}
    </FormControl>
  );
}
