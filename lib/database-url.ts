const POSTGRES_PREFIXES = ["postgres://", "postgresql://"];

export type DatabaseProvider = "postgresql" | "sqlite";

export type ResolvedDatabase = {
  provider: DatabaseProvider;
  /** URL passed to Prisma Client. Postgres URLs include serverless pool settings. */
  databaseUrl: string;
  /** Direct URL for Prisma migrations. Unset for SQLite. */
  directUrl?: string;
};

function read(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key];
  return value && value.trim() ? value.trim() : undefined;
}

export function isPostgresUrl(url: string | undefined): url is string {
  return !!url && POSTGRES_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export function isSqliteUrl(url: string | undefined): url is string {
  return !!url && url.startsWith("file:");
}

function firstPostgres(values: Array<string | undefined>) {
  return values.find(isPostgresUrl);
}

export function isPoolerUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("pooler") || parsed.searchParams.get("pgbouncer") === "true";
  } catch {
    return url.includes("pooler") || url.includes("pgbouncer=true");
  }
}

/** Extra params keep a serverless function from exhausting Neon’s pooler. */
export function withServerlessParams(url: string) {
  try {
    const parsed = new URL(url);
    const pooled = parsed.hostname.includes("pooler");
    if (pooled && !parsed.searchParams.has("pgbouncer")) parsed.searchParams.set("pgbouncer", "true");
    if (!parsed.searchParams.has("connection_limit")) parsed.searchParams.set("connection_limit", "1");
    if (!parsed.searchParams.has("pool_timeout")) parsed.searchParams.set("pool_timeout", "20");
    if (!parsed.searchParams.has("connect_timeout")) parsed.searchParams.set("connect_timeout", "15");
    if (!parsed.searchParams.has("sslmode")) parsed.searchParams.set("sslmode", "require");
    return parsed.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}connection_limit=1&pool_timeout=20&connect_timeout=15`;
  }
}

export function productionDatabaseError(databaseUrl: string | undefined) {
  const found = !databaseUrl
    ? "DATABASE_URL is not set."
    : isSqliteUrl(databaseUrl)
      ? "Current DATABASE_URL is a SQLite file URL."
      : "Current DATABASE_URL is not a Postgres URL.";
  return [
    "Balance cannot use a SQLite file on Vercel, so /login returns 500.",
    found,
    "Delete the file: DATABASE_URL, connect Neon Postgres (free), and redeploy.",
    "Required: DATABASE_URL (pooled) and DATABASE_URL_UNPOOLED or DIRECT_URL (direct, for migrations).",
    "Also set NEXT_PUBLIC_APP_URL=https://balance-woad-six.vercel.app.",
  ].join(" ");
}

export function resolveDatabase(env: NodeJS.ProcessEnv = process.env): ResolvedDatabase {
  const databaseUrl = read(env, "DATABASE_URL");
  const postgresFallback = firstPostgres([read(env, "POSTGRES_PRISMA_URL"), read(env, "POSTGRES_URL")]);
  const direct = firstPostgres([
    read(env, "DIRECT_URL"),
    read(env, "DATABASE_URL_UNPOOLED"),
    read(env, "POSTGRES_URL_NON_POOLING"),
  ]);
  const onVercel = env.VERCEL === "1";
  const forceSqlite = read(env, "DATABASE_PROVIDER") === "sqlite";
  const forcePostgres = read(env, "DATABASE_PROVIDER") === "postgresql";

  if (onVercel && forceSqlite) {
    throw new Error("DATABASE_PROVIDER=sqlite is not supported on Vercel. Use a hosted Postgres DATABASE_URL.");
  }

  const preferSqlite =
    !onVercel &&
    (forceSqlite || isSqliteUrl(databaseUrl) || (!databaseUrl && !postgresFallback && !forcePostgres));

  if (preferSqlite) {
    return { provider: "sqlite", databaseUrl: isSqliteUrl(databaseUrl) ? databaseUrl : "file:./dev.db" };
  }

  const postgresUrl = isPostgresUrl(databaseUrl) ? databaseUrl : postgresFallback;
  if (!postgresUrl) {
    throw new Error(productionDatabaseError(databaseUrl));
  }

  return {
    provider: "postgresql",
    databaseUrl: withServerlessParams(postgresUrl),
    directUrl: direct ?? postgresUrl,
  };
}
