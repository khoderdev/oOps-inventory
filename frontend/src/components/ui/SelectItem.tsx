import type { ReactNode } from "react";

interface SelectItemProps<T = string | number> {
  value: T;
  children: ReactNode;
  disabled?: boolean;
}

const SelectItem = <T extends string | number>({ value, children, disabled }: SelectItemProps<T>) => {
  return (
    <option value={value.toString()} disabled={disabled}>
      {children}
    </option>
  );
};

export default SelectItem;
