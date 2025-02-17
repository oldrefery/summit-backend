// src/types/select.ts
export interface SelectOption {
  label: string;
  value: string | number;
}

export interface ReactSelectProps {
  value: SelectOption | SelectOption[] | null;
  onChange: (value: SelectOption | SelectOption[] | null) => void;
  options: SelectOption[];
  isMulti?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
}
