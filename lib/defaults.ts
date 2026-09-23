import { GROUP_COLORS } from "./colors";

export type DefaultGroup = {
  slug: "work" | "life" | "health" | "sleep";
  name: string;
  goalPercent: number;
  color: string;
  includes: string;
  sortOrder: number;
  subs: { name: string; key: string }[];
};

export const DEFAULT_GROUPS: DefaultGroup[] = [
  {
    slug: "work",
    name: "Work",
    goalPercent: 30,
    color: GROUP_COLORS.work,
    includes: "Paid work, side gigs, skill improvement, career growth, entrepreneurial work, and education.",
    sortOrder: 0,
    subs: [
      { name: "Job", key: "W:J" },
      { name: "Side Hustle", key: "W:S" },
      { name: "Music", key: "W:M" },
      { name: "Business", key: "W:B" },
      { name: "Education", key: "W:E" },
    ],
  },
  {
    slug: "life",
    name: "Life",
    goalPercent: 30,
    color: GROUP_COLORS.life,
    includes: "Family, friends, solo time, chores, driving, DIY, and maintenance.",
    sortOrder: 1,
    subs: [
      { name: "Family", key: "L:F" },
      { name: "Social", key: "L:S" },
      { name: "Personal", key: "L:P" },
      { name: "Other", key: "L:O" },
      { name: "Child", key: "L:C" },
    ],
  },
  {
    slug: "health",
    name: "Health",
    goalPercent: 10,
    color: GROUP_COLORS.health,
    includes: "Hygiene, exercise, nutrition, meditation, brain games, medical, and preventive care.",
    sortOrder: 2,
    subs: [
      { name: "Mental", key: "H:M" },
      { name: "Physical", key: "H:P" },
      { name: "Eating", key: "H:E" },
      { name: "Other", key: "H:O" },
      { name: "Extra", key: "X:X" },
    ],
  },
  {
    slug: "sleep",
    name: "Sleep",
    goalPercent: 30,
    color: GROUP_COLORS.sleep,
    includes: "Sleep and naps, intentional and unintentional.",
    sortOrder: 3,
    subs: [
      { name: "Sleep", key: "S:S" },
      { name: "Nap", key: "S:N" },
    ],
  },
];

export const DEFAULT_HABITS = [
  "6am wake up",
  "Stretch & exercise",
  "Hygiene",
  "Meditation",
  "Brain training",
  "Diet on track",
  "Cannabis",
  "Plan tomorrow",
  "11pm asleep",
];

export const DEFAULT_GOALS: Record<DefaultGroup["slug"], number> = {
  work: 30,
  life: 30,
  health: 10,
  sleep: 30,
};

export const FREE_MONTHLY_ENTRY_LIMIT = 200;
export const PRO_PRICE_LABEL = "$9";
