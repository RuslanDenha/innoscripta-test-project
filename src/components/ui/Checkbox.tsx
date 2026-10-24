// A native checkbox with a custom look drawn over it, so it stays accessible.
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";
import { CheckIcon } from "./icons";

interface CheckboxProps extends Omit<ComponentProps<"input">, "type"> {
  label: ReactNode;
}

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className={cx("ui-checkbox", className)}>
      <span className="ui-checkbox__box">
        <input type="checkbox" {...props} />
        <CheckIcon className="ui-checkbox__icon" />
      </span>
      {label}
    </label>
  );
}
