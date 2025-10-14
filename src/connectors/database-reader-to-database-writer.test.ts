import { describe, expect, it, jest } from "@jest/globals";
import { Channel } from "./channel";
import { DatabaseReader } from "./database/database-reader";
import { DatabaseWriter } from "./database/database-writer";

describe("database-reader-to-database-writer", () => {
  it("Should process messages between two sqlite databases", async () => {
    jest.useFakeTimers();

    const source = new DatabaseReader({
      driver: "sqlite",
      connection: { file: ":memory:" },
      onInitQueries: [
        `CREATE TABLE appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient TEXT,
        doctor TEXT,
        date TEXT,
        notified BOOLEAN DEFAULT FALSE,
        status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'confirmed', 'cancelled')))`,
        `INSERT INTO appointments (patient, doctor, date) VALUES
        ('John', 'Dr. Smith', '2025-11-25'),
        ('Jane', 'Dr. Johnson', '2025-12-01'),
        ('Alice', 'Dr. Davis', '2025-12-03'),
        ('Mark', 'Dr. Wilson', '2025-12-04'),
        ('Sara', 'Dr. Taylor', '2025-12-05'),
        ('Emily', 'Dr. Anderson', '2025-12-06'),
        ('Michael', 'Dr. Martinez', '2025-12-07'),
        ('Jessica', 'Dr. Robinson', '2025-12-08'),
        ('Bob', 'Dr. Brown', '2025-12-05');`,
      ],
      onReadQuery: `SELECT * FROM appointments WHERE status = 'booked' AND notified = FALSE LIMIT 5`,
      transformer: (rawMessage) => {
        return {
          id: rawMessage.id as number,
          patientName: rawMessage.patient as string,
          doctorName: rawMessage.doctor as string,
          date: rawMessage.date as string,
        };
      },

      polling: { scheduleType: "interval", intervalInSeconds: 5 },
    });

    const destination = new DatabaseWriter({
      driver: "sqlite",
      connection: { file: ":memory:" },
      onInitQueries: [
        `
        CREATE TABLE received_appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        external_id TEXT,
        description TEXT,
        date TEXT,
        status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'confirmed', 'cancelled')))
        `,
      ],
      onWriteQuery: `INSERT INTO received_appointments (external_id, description, date, status) VALUES (:id, :patientName, :date, :status)`,
      transformer: (rawMessage: {
        id: number;
        patientName: string;
        doctorName: string;
        date: string;
      }) => {
        return {
          replacements: {
            id: rawMessage.id,
            patientName: rawMessage.patientName,
            date: rawMessage.date,
            status: "booked",
          },
        };
      },
      responseTransformer: (rawResponse) => rawResponse,
    });

    const channel = new Channel({
      name: "channel1",
      source: source,
      destinations: [destination],
    });

    const finishProcessingPromise = new Promise<string[]>((resolve) => {
      channel.emitter.on("messageSent", ({ destinationIds }) => {
        return resolve(destinationIds);
      });
    });

    jest.spyOn(channel, "processMessage");
    jest.spyOn(source, "read");
    jest.spyOn(destination, "write");

    await channel.init();
    jest.advanceTimersByTime(5000);
    const destinationIds = await finishProcessingPromise;

    expect(channel.processMessage).toHaveBeenCalledTimes(5);
    expect(source.read).toHaveBeenCalledTimes(1);
    expect(destination.write).toHaveBeenCalledTimes(5);
    expect(destinationIds).toEqual([destination.id]);
  });
});
