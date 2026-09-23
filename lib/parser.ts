import { durationFromClocks, roundQuarter } from "./time-math";

const KEY_PATTERN = /\b([A-Za-z]):([A-Za-z])\b/g;

export type KeyAssignment = {
  keys: string[];
  primary: string | null;
  secondary: string | null;
  unknown: string[];
};

/** Pull calendar keys such as W:J or L:F out of an event title, in order. */
export function extractKeys(title: string) {
  const keys: string[] = [];
  for (const match of title.matchAll(KEY_PATTERN)) {
    keys.push(`${match[1].toUpperCase()}:${match[2].toUpperCase()}`);
  }
  return keys;
}

/**
 * First known key is the primary category and receives the hours.
 * A second known key is stored as context and is not added again.
 */
export function assignKeys(title: string, knownKeys: Set<string>): KeyAssignment {
  const keys = extractKeys(title);
  const matched = keys.filter((key) => knownKeys.has(key));
  const unknown = keys.filter((key) => !knownKeys.has(key));
  return {
    keys,
    primary: matched[0] ?? null,
    secondary: matched[1] && matched[1] !== matched[0] ? matched[1] : null,
    unknown,
  };
}

export type DraftEntry = {
  date: string;
  title: string;
  start: string | null;
  end: string | null;
  hours: number;
  notes?: string;
  externalId?: string;
};

export function parsePastedEvents(text: string) {
  const entries: DraftEntry[] = [];
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  lines.forEach((line, index) => {
    const parts = line.split(/[|\t]/).map((part) => part.trim());
    const columns = parts.length >= 2 ? parts : line.split(",").map((part) => part.trim());
    const lineNo = index + 1;
    if (columns.length < 2) {
      errors.push(`Line ${lineNo}: expected date and title.`);
      return;
    }
    const date = columns[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(`Line ${lineNo}: date must be YYYY-MM-DD.`);
      return;
    }
    const title = columns[1];
    if (!title) {
      errors.push(`Line ${lineNo}: title is empty.`);
      return;
    }
    const start = normalizeClock(columns[2]);
    const end = normalizeClock(columns[3]);
    const explicit = columns[4] ? Number(columns[4]) : NaN;
    const computed = durationFromClocks(start, end);
    const hours = Number.isFinite(explicit) && explicit > 0 ? roundQuarter(explicit) : computed;
    if (!hours || hours <= 0 || hours > 24) {
      errors.push(`Line ${lineNo}: add a start and end, or a duration in hours.`);
      return;
    }
    entries.push({ date, title, start, end, hours });
  });

  return { entries, errors };
}

function normalizeClock(value: string | undefined) {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}
