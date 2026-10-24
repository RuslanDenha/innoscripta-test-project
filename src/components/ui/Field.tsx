// A label stacked above its control.
import type { ReactNode } from "react";
import { cx } from "./cx";

export function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={cx("ui-field", className)}>
      <span className="ui-label">{label}</span>
      {children}
    </label>
  );
}
