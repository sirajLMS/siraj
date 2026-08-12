import { Box, Button, ButtonGroup, Typography } from "@mui/material";
import type { CSSProperties, ReactNode } from "react";
import {
  type ButtonGroupSelectorButton,
  type ButtonGroupSelectorOptions,
  type ButtonGroupSelectorSharedProps,
  type GenderSelectorSharedProps,
  useGenderSelectorButtons,
} from "@/frontend/common/components/ui/input/genderSelector/buttonGroupSelectorTypes";
import type { Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";

const DEFAULT_OPTIONS: ButtonGroupSelectorOptions = {};

function renderButton<TValue>(
  button: ButtonGroupSelectorButton<TValue>,
  isSelected: boolean,
  buttonSx: CSSProperties,
  useFlexButton: boolean,
  onSelect: (value: TValue) => void
): ReactNode {
  return (
    <Button
      key={String(button.value)}
      onClick={() => {
        onSelect(button.value);
      }}
      variant={isSelected ? "contained" : "outlined"}
      sx={useFlexButton ? { flex: 1, minWidth: 0, ...buttonSx } : { ...buttonSx, minWidth: 0 }}
    >
      {button.label}
    </Button>
  );
}

export function ButtonGroupSelectorShared<TValue>({
  selectedValue,
  onSelect,
  buttons,
  title,
  ariaLabel,
  anyLabel,
  error = false,
  required = false,
  fullWidth = false,
  allowEmpty = false,
  options = DEFAULT_OPTIONS,
}: Readonly<ButtonGroupSelectorSharedProps<TValue>>): ReactNode {
  const { buttonGroupWidth = "70%", buttonGroupFlexWrap, buttonSx = {}, useFlexButton = false } = options;

  const totalButtons = allowEmpty ? buttons.length + 1 : buttons.length;

  const computedButtonSx = useFlexButton ? buttonSx : { width: `${100 / totalButtons}%`, ...buttonSx };

  const buttonGroupSx: CSSProperties = {
    width: fullWidth ? "100%" : buttonGroupWidth,
    ...(buttonGroupFlexWrap !== undefined ? { flexWrap: buttonGroupFlexWrap } : {}),
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 1,
        width: fullWidth ? "100%" : "auto",
        flexWrap: "wrap",
        minWidth: 0,
      }}
    >
      <Typography
        color={error ? "error" : "default"}
        sx={{
          overflow: "visible",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 1,
          WebkitBoxOrient: "vertical",
        }}
        variant="subtitle1"
      >
        {title}
        {required ? (
          <Box component="span" sx={theme => ({ color: theme.palette.error.main, ml: 0.5 })}>
            *
          </Box>
        ) : null}
      </Typography>
      <ButtonGroup
        color={error ? "error" : "primary"}
        disableElevation
        variant="outlined"
        aria-label={ariaLabel}
        sx={buttonGroupSx}
      >
        {buttons.map(button =>
          renderButton(button, selectedValue === button.value, computedButtonSx, useFlexButton, onSelect)
        )}
        {allowEmpty ? (
          <Button
            onClick={() => {
              onSelect(null);
            }}
            variant={selectedValue === null ? "contained" : "outlined"}
            sx={useFlexButton ? { flex: 1, minWidth: 0, ...buttonSx } : { ...computedButtonSx, minWidth: 0 }}
          >
            {anyLabel}
          </Button>
        ) : null}
      </ButtonGroup>
    </Box>
  );
}

export function GenderSelectorShared({
  gender,
  setGenderAction,
  error = false,
  required = false,
  fullWidth = false,
  labels,
  allowEmpty = false,
  options = DEFAULT_OPTIONS,
}: Readonly<GenderSelectorSharedProps>): ReactNode {
  const { title, ariaLabel, anyLabel, buttons } = useGenderSelectorButtons(labels);

  return (
    <ButtonGroupSelectorShared<Gender>
      selectedValue={gender}
      onSelect={setGenderAction}
      buttons={buttons}
      title={title}
      ariaLabel={ariaLabel}
      anyLabel={anyLabel}
      error={error}
      required={required}
      fullWidth={fullWidth}
      allowEmpty={allowEmpty}
      options={options}
    />
  );
}
