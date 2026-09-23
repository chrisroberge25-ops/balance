import { GROUP_COLORS } from "./colors";
import { untrackedForDay } from "./time-math";

export type GroupLike = {
  id: string;
  slug: string;
  name: string;
  goalPercent: number;
  color: string;
  sortOrder: number;
};

export type SubLike = {
  id: string;
  groupId: string;
  name: string;
  key: string;
  active: boolean;
  sortOrder: number;
};

export type EntryLike = {
  id: string;
  date: string;
  hours: number;
  title: string;
  startTime: string | null;
  endTime: string | null;
  subcategoryId: string | null;
  secondarySubcategoryId: string | null;
};

export function groupMap(subs: SubLike[]) {
  return new Map(subs.map((sub) => [sub.id, sub.groupId]));
}

export function hoursForGroup(entries: EntryLike[], subs: SubLike[], groupId: string) {
  const groups = groupMap(subs);
  return entries.reduce((sum, entry) => {
    if (!entry.subcategoryId) return sum;
    return groups.get(entry.subcategoryId) === groupId ? sum + entry.hours : sum;
  }, 0);
}

export function hoursForSub(entries: EntryLike[], subcategoryId: string) {
  return entries.reduce((sum, entry) => (entry.subcategoryId === subcategoryId ? sum + entry.hours : sum), 0);
}

export function trackedHours(entries: EntryLike[]) {
  return entries.reduce((sum, entry) => sum + entry.hours, 0);
}

export function uncategorizedHours(entries: EntryLike[]) {
  return entries.reduce((sum, entry) => (entry.subcategoryId ? sum : sum + entry.hours), 0);
}

export function dayBudget(date: string, today: string, hoursIntoToday: number) {
  if (date > today) return 0;
  if (date === today) return Math.max(0, hoursIntoToday);
  return 24;
}

export function summarizeRange(
  dates: string[],
  entries: EntryLike[],
  groups: GroupLike[],
  subs: SubLike[],
  today: string,
  hoursIntoToday: number,
) {
  const byDate = new Map<string, EntryLike[]>();
  for (const entry of entries) {
    const list = byDate.get(entry.date) ?? [];
    list.push(entry);
    byDate.set(entry.date, list);
  }

  let available = 0;
  let tracked = 0;
  let untracked = 0;
  const perGroup = new Map(groups.map((group) => [group.id, 0]));
  const perSub = new Map(subs.map((sub) => [sub.id, 0]));
  let uncategorized = 0;

  const days = dates.map((date) => {
    const dayEntries = byDate.get(date) ?? [];
    const dayTracked = trackedHours(dayEntries);
    const dayUntracked = untrackedForDay(date, dayTracked, today, hoursIntoToday);
    const budget = dayBudget(date, today, hoursIntoToday);
    available += budget;
    tracked += dayTracked;
    untracked += dayUntracked;
    const groupHours = groups.map((group) => {
      const hours = hoursForGroup(dayEntries, subs, group.id);
      perGroup.set(group.id, (perGroup.get(group.id) ?? 0) + hours);
      return { group, hours };
    });
    for (const sub of subs) {
      perSub.set(sub.id, (perSub.get(sub.id) ?? 0) + hoursForSub(dayEntries, sub.id));
    }
    const dayUncategorized = uncategorizedHours(dayEntries);
    uncategorized += dayUncategorized;
    return { date, tracked: dayTracked, untracked: dayUntracked, budget, groupHours, uncategorized: dayUncategorized, entries: dayEntries };
  });

  const slices = groups.map((group) => {
    const hours = perGroup.get(group.id) ?? 0;
    const actualPercent = available > 0 ? (hours / available) * 100 : 0;
    const goalHours = (group.goalPercent / 100) * available;
    return { group, hours, actualPercent, goalHours, goalPercent: group.goalPercent };
  });

  const untrackedPercent = available > 0 ? (Math.max(0, untracked) / available) * 100 : 0;
  const deviation = slices.reduce((sum, slice) => sum + Math.abs(slice.actualPercent - slice.goalPercent), 0);
  const score = available > 0 ? Math.max(0, Math.round(100 - deviation / 2)) : null;

  return { days, available, tracked, untracked, uncategorized, slices, untrackedPercent, score, perSub };
}

export function balanceNarrative(slices: { group: GroupLike; actualPercent: number; goalPercent: number }[]) {
  if (slices.length === 0) return "Add a few entries and Balance will tell you which part of the day is drifting.";
  const ranked = [...slices].sort(
    (a, b) => a.actualPercent - a.goalPercent - (b.actualPercent - b.goalPercent),
  );
  const low = ranked[0];
  const high = ranked[ranked.length - 1];
  const lowGap = low.goalPercent - low.actualPercent;
  const highGap = high.actualPercent - high.goalPercent;
  if (lowGap < 3 && highGap < 3) {
    return "This stretch sits close to your goals. The useful question is whether the mix felt like the day you wanted.";
  }
  if (lowGap >= highGap) {
    return `${low.group.name} is ${Math.round(lowGap)} points under its ${low.goalPercent}% goal. That gap is the clearest place to reclaim time.`;
  }
  return `${high.group.name} is running ${Math.round(highGap)} points above its ${high.goalPercent}% goal.`;
}

export function pieSlices(
  slices: { group: GroupLike; hours: number }[],
  untracked: number,
  uncategorized: number,
) {
  const data = slices
    .filter((slice) => slice.hours > 0)
    .map((slice) => ({ name: slice.group.name, hours: round1(slice.hours), fill: slice.group.color }));
  if (uncategorized > 0.05) {
    data.push({ name: "Uncategorized", hours: round1(uncategorized), fill: GROUP_COLORS.uncategorized });
  }
  if (untracked > 0.05) {
    data.push({ name: "Untracked", hours: round1(untracked), fill: GROUP_COLORS.untracked });
  }
  return data;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function overlappingEntryIds(entries: EntryLike[]) {
  const blocks = entries
    .map((entry) => {
      const start = clockToMinutes(entry.startTime);
      const endRaw = clockToMinutes(entry.endTime);
      if (start == null || endRaw == null) return null;
      const end = endRaw <= start ? endRaw + 1440 : endRaw;
      return { id: entry.id, start, end };
    })
    .filter((block): block is { id: string; start: number; end: number } => Boolean(block))
    .sort((a, b) => a.start - b.start);

  const ids = new Set<string>();
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      if (blocks[j].start >= blocks[i].end) break;
      ids.add(blocks[i].id);
      ids.add(blocks[j].id);
    }
  }
  return ids;
}

function clockToMinutes(value: string | null) {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}
