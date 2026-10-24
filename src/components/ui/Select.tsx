// A styled native <select>, so keyboard, screen-reader and mobile pickers keep working.
import type { ComponentProps } from "react";
import { cx } from "./cx";
import { ChevronDownIcon } from "./icons";

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <div className={cx("ui-select", className)}>
      <select {...props} />
      <ChevronDownIcon className="ui-select__icon" />
    </div>
  );
}
