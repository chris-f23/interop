// import { afterAll, describe, expect, it } from "@jest/globals";
// import { DatabaseReader } from "./database-reader";
// import fs from "fs";

// function createReader() {
//   return new DatabaseReader({
//     driver: "sqlite",
//     connection: {
//       file: "./sqlite.db",
//     },
//     polling: {
//       scheduleType: "interval",
//       intervalInSeconds: 5,
//       unit: "seconds",
//     },

//     onInitQueries: [
//       "CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT)",
//       "INSERT INTO users (id, username) VALUES (1, 'john'), (2, 'jane')",
//     ],
//     onReadQuery: `SELECT * FROM users;`,

//     transformer: (rawMessage) => {
//       const { rows } = rawMessage;

//       return rows.map((row) => ({
//         userId: row.id as number,
//         userName: row.username as string,
//       }));
//     },
//   });
// }

// describe("sqlite-database-reader", () => {
//   it("Should initialize the reader", async () => {
//     const reader = createReader();
//     await expect(reader.init()).resolves.not.toThrow();
//     expect(reader.ready).toBe(true);
//   });

//   it("Should throw when trying to read before starting", async () => {
//     const reader = createReader();
//     await expect(reader.read()).rejects.toThrow();
//   });

//   it("Should read", async () => {
//     const reader = createReader();
//     await expect(reader.init()).resolves.not.toThrow();

//     const result = await reader.read();
//     expect(result).toBeDefined();
//     expect(result.length).toBeGreaterThan(0);
//     expect(result[0]).toMatchObject({
//       userId: expect.any(Number),
//       userName: expect.any(String),
//     });
//   });

//   afterAll(async () => {
//     await new Promise<void>((resolve) => {
//       let isTryingToUnlink = false;

//       const interval = setInterval(() => {
//         if (isTryingToUnlink) return;
//         isTryingToUnlink = true;
//         try {
//           fs.unlinkSync("./sqlite.db");
//           clearInterval(interval);
//           resolve();
//         } catch (error) {
//           isTryingToUnlink = false;
//         }
//       }, 500);
//     });
//   });
// });
