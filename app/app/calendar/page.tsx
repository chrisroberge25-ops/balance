import { pasteCalendar, setGoogleConnected } from "@/app/actions/calendar";
import { Button, Card, Notice, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Calendar" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; note?: string; oauth?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const configured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <div>
      <PageHeader
        eyebrow="Calendar sync"
        title="Keys ride along in the title."
        description="Prefix an event with its category, like W:J Standup or L:F + H:P Family hike. Balance reads the keys, files the hours once, and keeps the second label."
      />
      {params.error ? <div className="mb-4"><Notice tone="warn">{params.error}</Notice></div> : null}
      {params.note ? <div className="mb-4"><Notice tone="good">{params.note}</Notice></div> : null}
      {params.oauth === "missing" ? <div className="mb-4"><Notice tone="warn">Google credentials are not set. Use paste-sync, or add the env vars below.</Notice></div> : null}
      {params.oauth === "stub-connected" ? <div className="mb-4"><Notice tone="good">Calendar marked connected. Token exchange is stubbed, so events still arrive through paste-sync or a workbook import.</Notice></div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-2xl">Paste events</h2>
          <p className="mt-2 text-sm leading-6 text-muted">One event per line: date, title, start, end. Separate columns with a vertical bar.</p>
          <form action={pasteCalendar} className="mt-4 space-y-3">
            <textarea
              name="events"
              rows={8}
              className="w-full rounded-2xl border border-line bg-white px-3 py-2 font-mono text-xs"
              placeholder={"2026-09-22 | W:J Standup | 09:00 | 09:30\n2026-09-22 | L:F + H:P Family hike | 16:00 | 17:30"}
            />
            <Button type="submit">Import lines</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-serif text-2xl">Google OAuth</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Status: {user.googleConnected ? "connected (stub)" : "not connected"}.
            {user.calendarId ? ` Calendar id on file: ${user.calendarId}.` : " No calendar id saved yet."}
            {" "}Plan: {user.plan === "PRO" ? "Pro" : "Free"}.
          </p>
          {user.plan !== "PRO" ? (
            <p className="mt-3 text-sm text-muted">Google connection is a Pro feature. Paste-sync works on Free.</p>
          ) : configured ? (
            <a href="/api/calendar/google/start" className="mt-4 inline-flex rounded-full bg-ink px-4 py-2 text-sm text-cream">Continue to Google</a>
          ) : (
            <form action={setGoogleConnected} className="mt-4">
              <input type="hidden" name="connected" value={user.googleConnected ? "0" : "1"} />
              <Button type="submit">{user.googleConnected ? "Disconnect stub" : "Mark connected (stub)"}</Button>
            </form>
          )}
          <ol className="mt-5 list-decimal space-y-2 pl-4 text-sm leading-6 text-muted">
            <li>Create an OAuth client in Google Cloud. Scope: <code>calendar.readonly</code>.</li>
            <li>Set <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code>, and <code>GOOGLE_REDIRECT_URI</code>.</li>
            <li>Redirect URI: <code>/api/calendar/google/callback</code>.</li>
            <li>Start sends the user to Google’s consent screen. The callback records the connection and does not exchange the code for a token in this build.</li>
            <li>Put keys in event titles. A nightly fetch is unnecessary: totals are computed when you open the day.</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
