import { config as configDotenv } from "dotenv";
import { describe, expect, it } from "@jest/globals";
import { DatabaseConnection } from "./database-connection";

configDotenv({
  quiet: true,
  path: "./.env.test",
});

describe("DatabaseConnection", () => {
  describe("MSSQL", () => {
    it("Should execute a SELECT query", async () => {
      const db = new DatabaseConnection({
        driver: "mssql",
        host: String(process.env.MSSQL_DB_HOST),
        port: Number(process.env.MSSQL_DB_PORT),
        user: String(process.env.MSSQL_DB_USER),
        password: String(process.env.MSSQL_DB_PASSWORD),
        applicationName: "interop",
      });

      await expect(db.check()).resolves.not.toThrow();
      await expect(db.query("SELECT 1 as id;")).resolves.toContainEqual({
        id: 1,
      });
      await expect(db.terminate()).resolves.not.toThrow();
    });
  });
});
