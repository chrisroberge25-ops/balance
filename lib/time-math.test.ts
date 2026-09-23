import assert from "node:assert/strict";
import test from "node:test";
import { durationFromClocks, roundQuarter, untrackedForDay } from "./time-math";

test("rounds to the quarter hour", () => {
  assert.equal(roundQuarter(1.1), 1);
  assert.equal(roundQuarter(1.13), 1.25);
  assert.equal(roundQuarter(7.25), 7.25);
});

test("untracked time follows past, today, and future rules", () => {
  assert.equal(untrackedForDay("2026-09-22", 10, "2026-09-23", 8), 14);
  assert.equal(untrackedForDay("2026-09-23", 3, "2026-09-23", 8.1), 5);
  assert.equal(untrackedForDay("2026-09-24", 0, "2026-09-23", 8), 0);
  assert.equal(untrackedForDay("2026-09-23", 10, "2026-09-23", 4), 0);
});

test("overnight duration counts once across midnight", () => {
  assert.equal(durationFromClocks("22:15", "00:15"), 2);
  assert.equal(durationFromClocks("09:00", "10:30"), 1.5);
});
