import type { CSSProperties } from "react";
import { Gender } from "@/frontend/common/graphql/generated/gql/graphql";
import { type GenderSelectorLabels, Translation, useAppTranslation } from "@/shared/locale";

export type ButtonGroupSelectorButton<TValue> = {
  readonly value: TValue;
  readonly label: string;
};

export type ButtonGroupSelectorSharedProps<TValue> = {
  readonly selectedValue: TValue | null;
  readonly onSelect: (value: TValue | null) => void;
  readonly buttons: ReadonlyArray<ButtonGroupSelectorButton<TValue>>;
  readonly title: string;
  readonly ariaLabel: string;
  readonly anyLabel?: string;
  readonly error?: boolean;
  readonly required?: boolean;
  readonly fullWidth?: boolean;
  readonly allowEmpty?: boolean;
  readonly disabled?: boolean;
  readonly options?: ButtonGroupSelectorOptions;
};

export type ButtonGroupSelectorOptions = {
  readonly buttonGroupWidth?: string;
  readonly buttonGroupFlexWrap?: "wrap" | "nowrap";
  readonly buttonSx?: CSSProperties;
  readonly useFlexButton?: boolean;
};

export type GenderSelectorSharedProps = {
  readonly gender: Gender | null;
  readonly setGenderAction: (gender: Gender | null) => void;
  readonly error?: boolean;
  readonly required?: boolean;
  readonly fullWidth?: boolean;
  readonly labels?: Partial<GenderSelectorLabels>;
  readonly allowEmpty?: boolean;
  readonly disabled?: boolean;
  readonly options?: ButtonGroupSelectorOptions;
};

export function useGenderSelectorButtons(labels?: Partial<GenderSelectorLabels>): {
  readonly title: string;
  readonly ariaLabel: string;
  readonly anyLabel: string | undefined;
  readonly buttons: ReadonlyArray<ButtonGroupSelectorButton<Gender>>;
} {
  const t = useAppTranslation(Translation.Ui.GenderSelector);
  const title = labels?.title ?? t.title;
  const maleLabel = labels?.male ?? t.male;
  const femaleLabel = labels?.female ?? t.female;
  const ariaLabel = labels?.ariaLabel ?? t.ariaLabel;
  const anyLabel = labels?.any ?? t.any;

  const buttons: ReadonlyArray<ButtonGroupSelectorButton<Gender>> = [
    { value: Gender.Male, label: maleLabel },
    { value: Gender.Female, label: femaleLabel },
  ];

  return { title, ariaLabel, anyLabel, buttons };
}
