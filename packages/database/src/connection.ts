import pg from "pg";

/**
 * Create a configured PostgreSQL pool from a validated database URL.
 *
 * The caller is responsible for validating the URL before passing it here.
 * This module owns pool lifecycle but not environment parsing or business policy.
 */
export const createPool = (databaseUrl: string): pg.Pool => {
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 4_000,
    query_timeout: 4_000,
    statement_timeout: 4_000,
  });

  // node-postgres emits pool-level errors when an idle client loses its
  // connection. Readiness owns dependency reporting; consuming this event
  // prevents a dependency outage from terminating the service process.
  pool.on("error", () => undefined);

  return pool;
};

/**
 * Gracefully end the pool. Call during process shutdown.
 */
export const endPool = async (pool: pg.Pool): Promise<void> => {
  await pool.end();
};

/**
 * Acquire a single client from the pool for bounded operations.
 * The caller must release it.
 */
export const withClient = async <T>(
  pool: pg.Pool,
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
};
