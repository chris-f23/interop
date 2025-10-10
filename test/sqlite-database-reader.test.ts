import { describe, expect, it } from "@jest/globals";
import { DatabaseReader } from "../src/source-connectors/database-reader";

const createReader = () => {
  return new DatabaseReader({
    driver: "sqlite",
    connection: { file: ":memory:" },
    polling: {
      scheduleType: "interval",
      interval: 5,
      unit: "seconds",
      pollOnStart: false,
    },

    queries: {
      onStart: `CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT
            );`,
      onRead: `SELECT * FROM users;`,
    },

    transformer: ({ rows }) => {
      return rows.map((row) => ({
        userId: row.id as number,
        userName: row.username as string,
      }));
    },
  });
};

describe("sqlite-database-reader", () => {
  it("Should start the reader", async () => {
    const reader = createReader();
    await expect(reader.start()).resolves.not.toThrow();
  });

  it("Should throw when trying to read before starting", async () => {
    const reader = createReader();
    await expect(reader.read()).rejects.toThrow();
  });

  it("Should read", async () => {
    const reader = createReader();
    await reader.start();
    await expect(reader.read()).resolves.not.toThrow();
  });
});
