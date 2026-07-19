"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
import { CatalogImageUpload } from "@/frontend/common/components/ui/input/catalogImageUpload/CatalogImageUpload";

type AvatarImageFieldBaseProps = {
  readonly label: string;
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

export function AvatarImageField<T extends FieldValues>(props: Readonly<AvatarImageFieldProps<T>>): React.ReactNode {
  const { label, onUploadAvatar, disabled = false } = props;

  if ("control" in props && props.control && props.name) {
    return (
      <Controller
        name={props.name}
        control={props.control}
        render={({ field }) => (
          <CatalogImageUpload
            imageUrl={(field.value as string | null | undefined) ?? null}
            onImageUrlChangeAction={url => field.onChange(url ?? undefined)}
            onUploadAction={onUploadAvatar}
            allowUrlFallback={false}
            label={label}
            disabled={disabled}
          />
        )}
      />
    );
  }

  return (
    <CatalogImageUpload
      imageUrl={props.value ?? null}
      onImageUrlChangeAction={url => props.onChange?.(url)}
      onUploadAction={onUploadAvatar}
      allowUrlFallback={false}
      label={label}
      disabled={disabled}
    />
  );
}
