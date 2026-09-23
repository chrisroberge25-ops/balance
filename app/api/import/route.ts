import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readEntryWorkbook } from "@/lib/excel";
import { importDrafts } from "@/lib/entries";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/app/import?error=Choose an xlsx file.");
  }
  if (file.size > 8_000_000) redirect("/app/import?error=That file is larger than 8MB.");
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await readEntryWorkbook(buffer);
  if (parsed.entries.length === 0) {
    redirect("/app/import?error=No dated rows with a title were found. Use an Entry Log sheet.");
  }
  const result = await importDrafts(user.id, parsed.entries, "import", user.plan);
  revalidatePath("/app", "layout");
  const note = `${parsed.sheetName}: ${result.created} added, ${result.skipped} already imported, ${result.errors} without a matching key.`;
  redirect(`/app/import?saved=1&note=${encodeURIComponent(note)}`);
}
