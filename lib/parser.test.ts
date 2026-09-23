import assert from "node:assert/strict";
import test from "node:test";
import { assignKeys, extractKeys, parsePastedEvents } from "./parser";

const known = new Set(["W:J", "L:F", "L:S", "H:P", "S:S"]);

test("reads keys without mistaking clock times for keys", () => {
  assert.deepEqual(extractKeys("L:S - chilling with Jacob"), ["L:S"]);
  assert.deepEqual(extractKeys("Meet at 11:00 about W:J"), ["W:J"]);
});

test("secondary key is context and does not replace the primary", () => {
  const assigned = assignKeys("L:F + H:P family workout", known);
  assert.equal(assigned.primary, "L:F");
  assert.equal(assigned.secondary, "H:P");
});

test("unknown keys are reported and skipped", () => {
  const assigned = assignKeys("Q:Z then W:J standup", known);
  assert.deepEqual(assigned.unknown, ["Q:Z"]);
  assert.equal(assigned.primary, "W:J");
});

test("parses pasted calendar lines", () => {
  const parsed = parsePastedEvents("2026-09-22 | W:J Standup | 09:00 | 09:30\nbad line");
  assert.equal(parsed.entries.length, 1);
  assert.equal(parsed.entries[0].hours, 0.5);
  assert.equal(parsed.errors.length, 1);
});
