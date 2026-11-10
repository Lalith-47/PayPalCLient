import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "";

// Initialize sql client with Neon serverless driver
const sql = connectionString ? neon(connectionString) : null;

export const db = sql ? drizzle(sql, { schema }) : null;

/**
 * Neon Wake-up Ping.
 * Sends a lightweight query to wake up a sleeping Neon serverless compute instance.
 */
export async function pingDatabase(): Promise<{ ok: boolean; latencyMs: number; message: string }> {
  if (!sql) {
    return { ok: false, latencyMs: 0, message: "DATABASE_URL not configured yet" };
  }

  const start = Date.now();
  try {
    await sql`SELECT 1 as ping`;
    const latencyMs = Date.now() - start;
    return { ok: true, latencyMs, message: "Neon DB awakened successfully" };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      message: (err as Error).message,
    };
  }
}

