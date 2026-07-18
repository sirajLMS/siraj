export interface BillingSearchBarProps {
  readonly value: string;
  readonly placeholder: string;
  readonly searchingLabel?: string;
  readonly isSearching?: boolean;
  readonly onChange: (value: string) => void;
}
