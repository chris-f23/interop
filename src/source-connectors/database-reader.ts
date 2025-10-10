import { Sequelize, Options as SequelizeOptions } from "sequelize";

type DatabaseReaderQueryResult = {
  rows: Record<string, unknown>[];
};

export class DatabaseReader<
  TDatabaseDriver extends "sqlite" | "mssql",
  TPollingScheduleType extends "interval",
  TRawMessage extends DatabaseReaderQueryResult,
  TTransformedMessage
> implements ISourceConnector<TRawMessage, TTransformedMessage>
{
  private started = false;
  private reading = false;
  public readonly client: Sequelize;

  public constructor(
    public readonly config: {
      driver: TDatabaseDriver;
      connection: TDatabaseDriver extends "sqlite"
        ? {
            file: string;
          }
        : {
            host: string;
            port?: number;
            database?: string;
            username?: string;
            password?: string;
          };

      polling: {
        scheduleType: TPollingScheduleType;
        pollOnStart: boolean;
      } & (TPollingScheduleType extends "interval"
        ? {
            interval: number;
            unit: "milliseconds" | "seconds" | "minutes" | "hours";
          }
        : {});

      queries: {
        onStart?: string;
        onRead: string;
      };
      transformer: (raw: TRawMessage) => TTransformedMessage;
    }
  ) {
    const sequelizeOptions: SequelizeOptions = {
      dialect: this.config.driver,
    };

    if ("file" in this.config.connection) {
      sequelizeOptions.storage = this.config.connection.file;
    } else {
      sequelizeOptions.port = this.config.connection.port;
      sequelizeOptions.database = this.config.connection.database;
      sequelizeOptions.username = this.config.connection.username;
      sequelizeOptions.password = this.config.connection.password;
      sequelizeOptions.host = this.config.connection.host;
    }

    this.client = new Sequelize(sequelizeOptions);
  }

  async start(): Promise<void> {
    if (this.started === true) {
      throw new Error("Reader has already been started");
    }
    this.started = true;
    await this.client.query(this.config.queries.onStart ?? "SELECT 1;");

    if (this.config.polling.pollOnStart === true) {
      await this.read();
    }
  }

  async read(): Promise<TTransformedMessage> {
    if (this.started === false) {
      throw new Error("Reader has not been started");
    }

    if (this.reading === true) {
      throw new Error("Reader is already reading");
    }

    this.reading = true;
    const [rows] = await this.client.query(this.config.queries.onRead);
    const transformedResult = this.config.transformer({
      rows: rows,
    } as TRawMessage);
    return transformedResult;
  }
}
