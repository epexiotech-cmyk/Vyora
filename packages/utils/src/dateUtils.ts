export function getStartOfDay(date: Date | string): Date {
  const d = new Date(date);
  // Ensure we don't accidentally mutate passed Date object, but we already created a new one
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfDay(date: Date | string): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
