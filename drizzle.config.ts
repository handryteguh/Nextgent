import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  out: "./drizzle",
  schema: "./db/schema.ts",
  dbCredentials: {
    url: "./data/mina-ui.db",
  },
  verbose: true,
  strict: true,
});