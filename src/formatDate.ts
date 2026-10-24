const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const full = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
const short = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// "5 minutes ago", "3 hours ago", "yesterday"; older than a week falls back to the date.
export function formatRelativeDate(date: Date, now = Date.now()): string {
  const elapsed = now - date.getTime();
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return relative.format(-Math.floor(elapsed / MINUTE), "minute");
  if (elapsed < DAY) return relative.format(-Math.floor(elapsed / HOUR), "hour");
  if (elapsed < 7 * DAY) return relative.format(-Math.floor(elapsed / DAY), "day");
  return short.format(date);
}

export function formatFullDate(date: Date): string {
  return full.format(date);
}
