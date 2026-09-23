import { addDays, weekdayIndex, zonedToday } from "./dates";
import type { DraftEntry } from "./parser";

function hours(_date: string, _salt: string, base: number) {
  return base;
}

/** A two-week example rhythm so a new workspace is readable on day one. */
export function buildRhythm(today = zonedToday("America/New_York")): DraftEntry[] {
  const drafts: DraftEntry[] = [];
  for (let offset = 13; offset >= 0; offset--) {
    const date = addDays(today, -offset);
    const dow = weekdayIndex(date);
    const weekend = dow === 0 || dow === 6;
    const push = (title: string, start: string, end: string, base: number, salt: string) => {
      drafts.push({
        date,
        title,
        start,
        end,
        hours: hours(date, salt, base),
        externalId: `rhythm:${date}:${salt}`,
      });
    };

    if (weekend) {
      push("S:S Sleep", "00:00", "07:30", 7.5, "sleep");
      push("H:P Long walk", "08:00", "09:00", 1, "physical");
      push("H:E Breakfast", "09:00", "09:45", 0.75, "eat1");
      push("W:M Music", "10:30", "13:00", 2.5, "music");
      push("W:B Business admin", "13:30", "15:00", 1.5, "business");
      push("S:N Nap", "15:15", "15:45", 0.5, "nap");
      push("L:F Family afternoon", "16:00", "19:00", 3, "family");
      push("L:S + H:P Friends outside", "19:15", "20:45", 1.5, "social");
      push("L:P Solo wind-down", "21:00", "22:30", 1.5, "personal");
    } else {
      push("S:S Sleep", "00:00", "07:00", 7, "sleep");
      push("H:P Training", "07:15", "08:00", 0.75, "physical");
      push("H:E Breakfast", "08:00", "08:45", 0.75, "eat1");
      push("W:J Deep work", "09:00", "12:00", 3, "job1");
      push("L:S Lunch", "12:00", "13:00", 1, "social");
      push("W:J Focus block", "13:00", dow === 2 ? "16:00" : "17:00", dow === 2 ? 3 : 4, "job2");
      if (dow === 2) push("W:S Side hustle", "16:15", "17:15", 1, "hustle");
      else push("W:E Study", "17:15", "18:15", 1, "edu");
      push("L:F Family", "18:30", "20:00", 1.5, "family");
      push("H:E Dinner", "20:00", "20:45", 0.75, "eat2");
      push("L:P Personal", "20:45", "21:45", 1, "personal");
      if (dow % 2 === 0) push("H:M Meditation", "21:45", "22:15", 0.5, "mental");
    }
  }
  return drafts;
}
