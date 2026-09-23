import ExcelJS from "exceljs";
import type { DraftEntry } from "./parser";
import { durationFromClocks, roundQuarter } from "./time-math";

export async function readEntryWorkbook(data: ArrayBuffer | Buffer) {
  const workbook = new ExcelJS.Workbook();
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(new Uint8Array(data));
  await workbook.xlsx.load(bytes as unknown as ExcelJS.Buffer);
  const sheet =
    workbook.getWorksheet("Entry Log") ??
    workbook.worksheets.find((item) => /entry/i.test(item.name)) ??
    workbook.worksheets[0];
  if (!sheet) return { entries: [] as DraftEntry[], sheetName: "" };

  const headerRow = sheet.getRow(1);
  const columns = new Map<string, number>();
  headerRow.eachCell((cell, col) => {
    const label = String(cell.value ?? "")
      .trim()
      .toLowerCase();
    if (label) columns.set(label, col);
  });

  const dateCol = findColumn(columns, ["date"]);
  const titleCol = findColumn(columns, ["entry title", "title", "event", "summary"]);
  const startCol = findColumn(columns, ["start", "start time"]);
  const endCol = findColumn(columns, ["end", "end time"]);
  const hoursCol = findColumn(columns, ["duration", "hours", "time"]);
  const notesCol = findColumn(columns, ["notes / comments / description", "notes", "description"]);

  const entries: DraftEntry[] = [];
  if (!dateCol || !titleCol) return { entries, sheetName: sheet.name };

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const date = asDate(row.getCell(dateCol).value);
    const title = asText(row.getCell(titleCol).value).replace(/\s+/g, " ").trim();
    if (!date || !title) return;
    const start = asClock(startCol ? row.getCell(startCol).value : null);
    const end = asClock(endCol ? row.getCell(endCol).value : null);
    const explicit = hoursCol ? asNumber(row.getCell(hoursCol).value) : null;
    const hours = explicit && explicit > 0 ? roundQuarter(explicit) : durationFromClocks(start, end);
    if (!hours || hours <= 0 || hours > 24) return;
    const notes = notesCol ? stripNotes(asText(row.getCell(notesCol).value)) : "";
    entries.push({
      date,
      title,
      start,
      end,
      hours,
      notes,
      externalId: `import:${date}:${title}:${start ?? ""}:${rowNumber}`,
    });
  });

  return { entries, sheetName: sheet.name };
}

function findColumn(columns: Map<string, number>, names: string[]) {
  for (const name of names) {
    const exact = columns.get(name);
    if (exact) return exact;
  }
  for (const [label, index] of columns) {
    if (names.some((name) => label.startsWith(name))) return index;
  }
  return undefined;
}

function asText(value: ExcelJS.CellValue) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "text" in value && value.text) return String(value.text);
  if (typeof value === "object" && "result" in value) return asText(value.result as ExcelJS.CellValue);
  if (typeof value === "object" && "richText" in value && Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text).join("");
  }
  return String(value);
}

function asNumber(value: ExcelJS.CellValue) {
  if (typeof value === "number") return value;
  if (typeof value === "object" && value && "result" in value && typeof value.result === "number") return value.result;
  const parsed = Number(asText(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function asDate(value: ExcelJS.CellValue) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    if (year > 1901) return `${year}-${month}-${day}`;
  }
  const text = asText(value).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(text);
  if (us) return `${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
  return null;
}

function asClock(value: ExcelJS.CellValue) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }
  if (typeof value === "number" && value >= 0 && value < 1) {
    const total = Math.round(value * 24 * 60);
    const hours = String(Math.floor(total / 60)).padStart(2, "0");
    const minutes = String(total % 60).padStart(2, "0");
    return `${hours}:${minutes}`;
  }
  const text = asText(value).trim();
  const match = /(\d{1,2}):(\d{2})/.exec(text);
  if (!match) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function stripNotes(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

export async function workbookToBuffer(sheets: { name: string; rows: (string | number)[][] }[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Balance";
  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name);
    sheet.rows.forEach((row) => ws.addRow(row));
    ws.getRow(1).font = { bold: true };
    ws.columns.forEach((column) => {
      column.width = 22;
    });
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
