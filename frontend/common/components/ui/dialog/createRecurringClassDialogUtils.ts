import {
  ClassType,
  SchedulingMode,
  type SchedulingMode as SchedulingModeType,
} from "@/frontend/common/graphql/generated/gql/graphql-types";

const CLASS_TYPE_MAPPING: Record<string, ClassType> = {
  REGULAR: ClassType.Regular,
  TRIAL: ClassType.Trial,
  ADVANCE: ClassType.Advance,
};

export function isValidSchedulingMode(v: string): v is SchedulingMode {
  return (
    v === SchedulingMode.NumberOfClasses.toString() ||
    v === SchedulingMode.OnDemand.toString() ||
    v === SchedulingMode.Quota.toString()
  );
}

export function resolveClassTypeChange(value: string, setClassType: (type: ClassType) => void): void {
  const mapped = CLASS_TYPE_MAPPING[value];
  if (mapped) {
    setClassType(mapped);
  }
}

export function resolveSchedulingModeChange(
  value: string,
  setSchedulingMode: (mode: SchedulingModeType | null) => void
): void {
  setSchedulingMode(isValidSchedulingMode(value) ? value : null);
}
