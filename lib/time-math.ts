/** Round to the nearest quarter hour, matching the sheet's 0.25 grid. */
export function roundQuarter(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value / 0.25) * 0.25;
}

/**
 * Untracked time for one calendar day.
 * Past day = 24 − tracked.
 * Today = max(0, hours since midnight − tracked), rounded to 0.25.
 * Future = 0.
 */
export function untrackedForDay(
  date: string,
  trackedHours: number,
  today: string,
  hoursIntoToday: number,
) {
  if (date > today) return 0;
  if (date === today) {
    return roundQuarter(Math.max(0, hoursIntoToday - trackedHours));
  }
  return 24 - trackedHours;
}

export function minutesFromClock(value: string | null | undefined) {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Duration in hours. An end at or before the start crosses midnight. */
export function durationFromClocks(start: string | null | undefined, end: string | null | undefined) {
  const startMin = minutesFromClock(start);
  const endMin = minutesFromClock(end);
  if (startMin == null || endMin == null) return null;
  let diff = endMin - startMin;
  if (diff <= 0) diff += 24 * 60;
  return roundQuarter(diff / 60);
}

export function formatHours(value: number) {
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return `${rounded}h`;
  return `${rounded.toFixed(2).replace(/0$/, "")}h`;
}

export function formatSignedHours(value: number) {
  if (value < 0) return `${formatHours(Math.abs(value))} over`;
  return formatHours(value);
}
