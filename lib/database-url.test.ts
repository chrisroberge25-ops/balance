import assert from "node:assert/strict";
import test from "node:test";
import { isPoolerUrl, resolveDatabase, withServerlessParams } from "./database-url";

const POOLED = "postgresql://user:secret@ep-example-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";
const DIRECT = "postgresql://user:secret@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require";

test("local file URL stays on sqlite", () => {
  const resolved = resolveDatabase({ DATABASE_URL: "file:./dev.db" });
  assert.equal(resolved.provider, "sqlite");
  assert.equal(resolved.databaseUrl, "file:./dev.db");
  assert.equal(resolved.directUrl, undefined);
});

test("missing URL defaults to local sqlite", () => {
  const resolved = resolveDatabase({});
  assert.equal(resolved.provider, "sqlite");
  assert.equal(resolved.databaseUrl, "file:./dev.db");
});

test("explicit postgres URL is used locally", () => {
  const resolved = resolveDatabase({ DATABASE_URL: DIRECT, DIRECT_URL: DIRECT });
  assert.equal(resolved.provider, "postgresql");
  assert.equal(resolved.directUrl, DIRECT);
  assert.match(resolved.databaseUrl, /connection_limit=1/);
  assert.match(resolved.databaseUrl, /connect_timeout=15/);
  assert.doesNotMatch(resolved.databaseUrl, /pgbouncer=true/);
});

test("vercel ignores a stale sqlite DATABASE_URL when Neon vars exist", () => {
  const resolved = resolveDatabase({
    VERCEL: "1",
    DATABASE_URL: "file:./dev.db",
    POSTGRES_PRISMA_URL: POOLED,
    DATABASE_URL_UNPOOLED: DIRECT,
  });
  assert.equal(resolved.provider, "postgresql");
  assert.equal(resolved.directUrl, DIRECT);
  assert.match(resolved.databaseUrl, /pgbouncer=true/);
  assert.match(resolved.databaseUrl, /connection_limit=1/);
});

test("vercel rejects sqlite when no postgres URL exists", () => {
  assert.throws(
    () => resolveDatabase({ VERCEL: "1", DATABASE_URL: "file:./dev.db" }),
    /cannot use a SQLite file on Vercel/,
  );
});

test("pooler URLs are marked for pgbouncer", () => {
  const url = withServerlessParams(POOLED);
  assert.equal(isPoolerUrl(url), true);
  assert.match(url, /pgbouncer=true/);
  assert.match(url, /sslmode=require/);
});
