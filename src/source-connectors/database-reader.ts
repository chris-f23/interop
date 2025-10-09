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
        type: TPollingScheduleType;
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
    await this.client.query(this.config.queries.onStart ?? "SELECT 1;");
  }

  read(): Promise<TTransformedMessage> {
    return Promise.resolve(this.config.transformer({} as TRawMessage));
  }
}
