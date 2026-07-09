import { Stack } from "@mui/material";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { PhoneFormField, SectionPanel } from "@/frontend/components/ui";
import { PhoneDisplay } from "@/frontend/components/ui/display";
import { InfoField } from "../parent/sections/InfoField";

type PhoneContactSectionProps<T extends FieldValues> =
  | {
      readonly mode: "view";
      readonly title: string;
      readonly phoneLabel: string;
      readonly phoneValue: string | null | undefined;
      readonly notSetLabel?: string;
    }
  | {
      readonly mode: "edit";
      readonly title: string;
      readonly phoneLabel: string;
      readonly control: Control<T>;
      readonly name: FieldPath<T>;
    };

export function PhoneContactSection<T extends FieldValues>(props: PhoneContactSectionProps<T>) {
  return (
    <SectionPanel title={props.title}>
      <Stack spacing={2}>
        {props.mode === "edit" ? (
          <PhoneFormField name={props.name} control={props.control} label={props.phoneLabel} />
        ) : (
          <InfoField
            label={props.phoneLabel}
            value={<PhoneDisplay phone={props.phoneValue} fallback={props.notSetLabel} />}
          />
        )}
      </Stack>
    </SectionPanel>
  );
}
