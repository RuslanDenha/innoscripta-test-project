import type { ComponentProps } from "react";
import { cx } from "./cx";

interface BadgeProps extends ComponentProps<"span"> {
  variant?: "default" | "secondary" | "outline";
}

export function Badge({ variant = "secondary", className, ...props }: BadgeProps) {
  return <span className={cx("ui-badge", `ui-badge--${variant}`, className)} {...props} />;
}
