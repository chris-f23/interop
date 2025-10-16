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
      expect.hasAssertions();

      // 1. Arrange
      const db = new DatabaseConnection({
        driver: "mssql",
        host: String(process.env.MSSQL_DB_HOST),
        port: Number(process.env.MSSQL_DB_PORT),
        user: String(process.env.MSSQL_DB_USER),
        password: String(process.env.MSSQL_DB_PASSWORD),
        applicationName: "interop",
      });
      await db.connect();

      // 2. Act
      const result = await db.query({
        sql: "SELECT 1 as Id;",
        rowMapper: (row: any) => ({ id: row.Id }),
      });

      // 3. Assert
      expect(result).toContainEqual({
        id: 1,
      });
      await expect(db.terminate()).resolves.not.toThrow();
    });
  });
});
