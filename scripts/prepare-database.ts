import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { isPoolerUrl, isPostgresUrl, resolveDatabase, withoutChannelBinding } from "../lib/database-url";

loadEnvFile(resolve(process.cwd(), ".env"));

const generateOnly = process.argv.includes("--generate-only");
const prismaBin = resolve(process.cwd(), "node_modules", ".bin", "prisma");
const schemaPath = resolve(process.cwd(), "prisma", "schema.prisma");
const sqliteSchemaPath = resolve(process.cwd(), "prisma", "schema.sqlite.prisma");

try {
  const resolved = resolveDatabase();
  if (resolved.provider === "sqlite") {
    process.env.DATABASE_URL = resolved.databaseUrl;
    writeFileSync(sqliteSchemaPath, toSqliteSchema(readFileSync(schemaPath, "utf8")));
    run(prismaBin, ["generate", "--schema", sqliteSchemaPath]);
    if (!generateOnly) {
      run(prismaBin, ["db", "push", "--skip-generate", "--schema", sqliteSchemaPath]);
      run(resolve(process.cwd(), "node_modules", ".bin", "tsx"), ["prisma/seed.ts"]);
    }
  } else {
    if (!resolved.directUrl) throw new Error("Postgres requires DATABASE_URL_UNPOOLED for migrations.");
    if (!isPostgresEnv(process.env.DATABASE_URL)) process.env.DATABASE_URL = stripClientParams(resolved.databaseUrl);
    process.env.DATABASE_URL = withoutChannelBinding(process.env.DATABASE_URL ?? resolved.directUrl);
    process.env.DATABASE_URL_UNPOOLED = resolved.directUrl;
    if (isPoolerUrl(resolved.directUrl)) {
      console.warn(
        "DATABASE_URL_UNPOOLED points at a pooled host. prisma migrate deploy needs the direct Neon URL (hostname without -pooler).",
      );
    }
    run(prismaBin, ["generate", "--schema", schemaPath]);
    if (!generateOnly) {
      run(prismaBin, ["migrate", "deploy", "--schema", schemaPath]);
      run(resolve(process.cwd(), "node_modules", ".bin", "tsx"), ["prisma/seed.ts"]);
    }
  }
} catch (error) {
  if (generateOnly && process.env.VERCEL === "1") {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(message);
    console.warn("Generating the Postgres client with a placeholder URL. The build stops until a real DATABASE_URL is set.");
    process.env.DATABASE_URL = "postgresql://placeholder:placeholder@127.0.0.1:5432/balance";
    process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL;
    run(prismaBin, ["generate", "--schema", schemaPath]);
    process.exit(0);
  }
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

function toSqliteSchema(source: string) {
  return source
    .replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"')
    .replace(/^[ \t]*directUrl\s*=\s*env\("DATABASE_URL_UNPOOLED"\)\r?\n/m, "");
}

function isPostgresEnv(url: string | undefined) {
  return isPostgresUrl(url);
}

function stripClientParams(url: string) {
  try {
    const parsed = new URL(url);
    for (const key of ["connection_limit", "pool_timeout", "connect_timeout", "pgbouncer"]) {
      parsed.searchParams.delete(key);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function loadEnvFile(path: string) {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
