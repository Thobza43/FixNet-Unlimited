import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";

const dataDir = process.env.PGLITE_DATA_DIR || "./pgdata";

const client = new PGlite(dataDir);

export const db = drizzle(client, { schema });

export async function initDb(): Promise<void> {
  await client.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      phone TEXT NOT NULL,
      network TEXT NOT NULL,
      voucher_type TEXT NOT NULL,
      voucher_pin TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS bundles (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      data_amount TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT true
    );
  `);
}

export * from "./schema";
