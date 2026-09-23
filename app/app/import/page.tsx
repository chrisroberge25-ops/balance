import Link from "next/link";
import { Card, Notice, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = { title: "Import" };

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; note?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const errors = await prisma.importError.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <div>
      <PageHeader
        eyebrow="Spreadsheet"
        title="Bring the workbook with you."
        description="Upload an xlsx with an Entry Log sheet, or any sheet whose first row has Date and Title. Duration can come from a column or from start and end. A second key in the title is stored, and the hours count once."
      />
      {params.error ? <div className="mb-4"><Notice tone="warn">{params.error}</Notice></div> : null}
      {params.saved ? <div className="mb-4"><Notice tone="good">{params.note ?? "Import finished."}</Notice></div> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-2xl">Upload</h2>
          <form action="/api/import" method="post" encType="multipart/form-data" className="mt-4 space-y-3">
            <input name="file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required className="block w-full text-sm" />
            <button className="rounded-full bg-ink px-4 py-2 text-sm text-cream">Import workbook</button>
          </form>
          <p className="mt-4 text-sm text-muted">
            Need a file to try? <Link className="underline" href="/api/sample">Download the sanitized Entry Log sample</Link>.
          </p>
        </Card>
        <Card>
          <h2 className="font-serif text-2xl">What gets recognized</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
            <li>Headers: Date, Entry Title, Start, End, Duration, Notes.</li>
            <li>Keys such as W:J, L:F, H:P, S:S, and the spare X:X.</li>
            <li>L:F + H:P keeps health as a secondary label.</li>
            <li>Rows with no known key are saved as uncategorized and written to the error log.</li>
            <li>The same row will not import twice.</li>
          </ul>
        </Card>
      </div>
      <Card className="mt-4">
        <h2 className="font-serif text-2xl">Error log</h2>
        {errors.length === 0 ? <p className="mt-3 text-sm text-muted">No import errors yet.</p> : null}
        <ul className="mt-3 divide-y divide-line">
          {errors.map((error) => (
            <li key={error.id} className="py-3 text-sm">
              <p className="font-medium">{error.eventTitle}</p>
              <p className="text-muted">{error.message}</p>
              <p className="text-xs text-muted">{error.functionName}{error.context ? ` · ${error.context}` : ""}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
