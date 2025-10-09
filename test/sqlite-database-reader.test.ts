import { describe, expect, it } from "@jest/globals";
import { DatabaseReader } from "../src/source-connectors/database-reader";

const createReader = () => {
  return new DatabaseReader({
    driver: "sqlite",
    connection: { file: ":memory:" },
    polling: {
      type: "interval",
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
  it("Should create the reader", async () => {
    const reader = createReader();
    expect(reader).toBeDefined();
  });

  it("Should execute the onStart query", async () => {
    const reader = createReader();
    await expect(reader.start()).resolves.not.toThrow();
  });
});
