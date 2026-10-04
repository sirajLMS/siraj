"use client";

import { Box } from "@mui/material";
import { useCallback, useRef } from "react";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import {
  AvatarActionsStack,
  AvatarSlot,
  FieldHeading,
  type UploadStatusTexts,
} from "@/frontend/common/components/ui/input/avatarImageField/AvatarImageField.parts";
import { AvatarFrostedContainer } from "@/frontend/common/components/ui/input/avatarImageField/avatarRingShared";
import { ACCEPTED_TYPES, DEFAULT_MAX_SIZE_MB, useImageUpload } from "@/frontend/common/hooks/useImageUpload";
import { Translation, useAppTranslation } from "@/shared/locale";

type AvatarImageFieldBaseProps = {
  readonly label: string;
  readonly title?: string;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
  readonly disabled?: boolean;
};

type AvatarImageFieldFormProps<T extends FieldValues> = AvatarImageFieldBaseProps & {
  readonly control: Control<T>;
  readonly name: FieldPath<T>;
  readonly value?: never;
  readonly onChange?: never;
};

type AvatarImageFieldControlledProps = AvatarImageFieldBaseProps & {
  readonly control?: never;
  readonly name?: never;
  readonly value: string | null | undefined;
  readonly onChange: (url: string | null) => void;
};

export type AvatarImageFieldProps<T extends FieldValues = FieldValues> =
  | AvatarImageFieldFormProps<T>
  | AvatarImageFieldControlledProps;

type AvatarEditorBodyProps = {
  readonly imageUrl: string | null | undefined;
  readonly onImageUrlChange: (url: string | null) => void;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
  readonly label: string;
  readonly title: string;
  readonly disabled: boolean;
};

function AvatarEditorBody({
  imageUrl,
  onImageUrlChange,
  onUploadAvatar,
  label,
  title,
  disabled,
}: Readonly<AvatarEditorBodyProps>): React.ReactNode {
  const tUpload = useAppTranslation(Translation.Ui.CatalogImageUpload);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useImageUpload({
    onImageUrlChangeAction: onImageUrlChange,
    onUploadAction: onUploadAvatar,
  });

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const previewUrl = upload.previewUrl ?? imageUrl ?? null;
  const helperText = tUpload.helperText(DEFAULT_MAX_SIZE_MB);
  const texts: UploadStatusTexts = {
    upload: tUpload.upload,
    uploading: tUpload.uploading,
    remove: tUpload.remove,
  };
  const editDisabled = disabled || upload.isUploading;

  return (
    <AvatarFrostedContainer px={{ xs: 2, md: 3 }} py={{ xs: 2.5, md: 3 }}>
      <FieldHeading label={label} title={title} />
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          gap: { xs: 2.5, md: 3 },
        }}
      >
        <AvatarSlot
          previewUrl={previewUrl}
          isUploading={upload.isUploading}
          alt={label}
          triggerFileInput={triggerFileInput}
          editDisabled={editDisabled}
          uploadAriaLabel={tUpload.upload}
        />
        <AvatarActionsStack
          triggerFileInput={triggerFileInput}
          onRemove={upload.handleRemove}
          disabled={disabled}
          isUploading={upload.isUploading}
          previewUrl={previewUrl}
          helperText={helperText}
          localError={upload.localError}
          texts={texts}
        />
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={upload.handleFileSelect}
        disabled={disabled}
        hidden
      />
    </AvatarFrostedContainer>
  );
}

export function AvatarImageField<T extends FieldValues>(props: Readonly<AvatarImageFieldProps<T>>): React.ReactNode {
  const { label, onUploadAvatar, disabled = false } = props;
  const title = props.title ?? label;

  if ("control" in props && props.control && props.name) {
    return (
      <Controller
        name={props.name}
        control={props.control}
        render={({ field }) => (
          <AvatarEditorBody
            imageUrl={field.value ?? null}
            onImageUrlChange={url => field.onChange(url ?? undefined)}
            onUploadAvatar={onUploadAvatar}
            label={label}
            title={title}
            disabled={disabled}
          />
        )}
      />
    );
  }

  return (
    <AvatarEditorBody
      imageUrl={props.value}
      onImageUrlChange={url => props.onChange?.(url)}
      onUploadAvatar={onUploadAvatar}
      label={label}
      title={title}
      disabled={disabled}
    />
  );
}
