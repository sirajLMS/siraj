import type { IanaTimezone } from "@/frontend/common/graphql/generated/gql/graphql-types";

export type TimezoneSelectProps = {
  readonly value: IanaTimezone | null;
  readonly onChangeAction: (timezone: IanaTimezone | null) => void;
  readonly onBlurAction?: () => void;
  readonly label?: string;
  readonly required?: boolean;
  readonly fullWidth?: boolean;
  readonly disabled?: boolean;
  readonly autoComplete?: string;
  readonly style?: React.CSSProperties;
  readonly error?: boolean;
  readonly helperText?: string;
};
