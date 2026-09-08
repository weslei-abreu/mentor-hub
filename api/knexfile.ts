import "dotenv/config";
import type { Knex } from "knex";

const config: Knex.Config = {
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "weslei",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "mentor_db",
    typeCast: (
      field: { type: string; length: number; string: () => string | null },
      next: () => unknown,
    ) => {
      if (field.type === "TINY" && field.length === 1) {
        const value = field.string();
        return value === null ? null : value === "1";
      }
      return next();
    },
  },
  pool: { min: 0, max: 10 },
  migrations: {
    directory: "./src/db/migrations",
    extension: "ts",
    tableName: "knex_migrations",
  },
  seeds: {
    directory: "./src/db/seeds",
    extension: "ts",
  },
};

export default config;
