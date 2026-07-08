import { Stack, TextField } from "@mui/material";
import type { UseFormRegisterReturn } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui";
import { InfoField } from "../parent/sections/InfoField";

type PhoneContactSectionProps =
  | {
      readonly mode: "view";
      readonly title: string;
      readonly phoneLabel: string;
      readonly phoneValue: string;
    }
  | {
      readonly mode: "edit";
      readonly title: string;
      readonly phoneLabel: string;
      readonly phoneRegister: UseFormRegisterReturn;
    };

export function PhoneContactSection(props: PhoneContactSectionProps) {
  return (
    <SectionPanel title={props.title}>
      <Stack spacing={2}>
        {props.mode === "edit" ? (
          <TextField label={props.phoneLabel} fullWidth size="small" {...props.phoneRegister} />
        ) : (
          <InfoField label={props.phoneLabel} value={props.phoneValue} />
        )}
      </Stack>
    </SectionPanel>
  );
}
