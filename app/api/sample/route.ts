import { WORKBOOK_ENTRIES } from "@/lib/demo/workbook-entries";
import { workbookToBuffer } from "@/lib/excel";

export const runtime = "nodejs";

export async function GET() {
  const buffer = await workbookToBuffer([
    {
      name: "Entry Log",
      rows: [
        ["DATE", "ENTRY TITLE", "START", "END", "DURATION", "NOTES / COMMENTS / DESCRIPTION"],
        ...WORKBOOK_ENTRIES.map((entry) => [entry.date, entry.title, entry.start ?? "", entry.end ?? "", entry.hours, entry.notes]),
      ],
    },
  ]);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=balance-entry-log.xlsx",
    },
  });
}
