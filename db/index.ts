import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

// DB file disimpan di /d/mina-ui/data/mina-ui.db (gitignored)
const dbPath = path.join(process.cwd(), "data", "mina-ui.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
export { schema, sqlite };
