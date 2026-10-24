import type { ComponentProps } from "react";
import { cx } from "./cx";

interface ButtonProps extends ComponentProps<"button"> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
}

export function Button({ variant = "default", size = "default", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx("ui-button", `ui-button--${variant}`, size === "sm" && "ui-button--sm", className)}
      {...props}
    />
  );
}
