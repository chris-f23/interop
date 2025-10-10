import { Sequelize, Options as SequelizeOptions, QueryTypes } from "sequelize";
import {
  SourceConnector,
  SourceConnectorBaseConfig,
} from "../source-connector";

type DBReaderRawMessage = {
  rows: Record<string, unknown>[];
};

type SupportedDatabaseDriver = "sqlite" | "mssql";

type DBReaderConfig<
  TTransformedMessage,
  TDatabaseDriver extends SupportedDatabaseDriver
> = SourceConnectorBaseConfig<DBReaderRawMessage, TTransformedMessage> & {
  driver: TDatabaseDriver;

  connection: TDatabaseDriver extends "sqlite"
    ? { file: string }
    : {
        host: string;
        port?: number;
        database?: string;
        username?: string;
        password?: string;
      };

  polling: {
    scheduleType: "interval";
    interval: number;
    unit: "milliseconds" | "seconds" | "minutes" | "hours";
  };
  onInitQueries: string[];
  onReadQuery: string;
};

export class DatabaseReader<
  TTransformedMessage,
  TDatabaseDriver extends SupportedDatabaseDriver
> extends SourceConnector<DBReaderRawMessage, TTransformedMessage> {
  public constructor(
    public config: DBReaderConfig<TTransformedMessage, TDatabaseDriver>
  ) {
    super({
      transformer: config.transformer,
      filter: config.filter,
    });
  }

  client: Sequelize | null = null;

  protected async onInit(): Promise<void> {
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

    this.client = new Sequelize({
      ...sequelizeOptions,
      logging: false,
    });

    if ("onInitQueries" in this.config) {
      for (const initQuery of this.config.onInitQueries) {
        await this.client.query(initQuery);
      }
    }
  }

  protected async onRead(): Promise<TTransformedMessage> {
    if (!this.client) {
      throw new Error("Reader has not been initialized");
    }

    const [rows] = await this.client.query(this.config.onReadQuery);
    const rawMessage = { rows: rows } as DBReaderRawMessage;
    let filteredRawMessage;
    let transformedMessage;

    if (this.config.filter) {
      filteredRawMessage = this.config.filter(rawMessage);
    }

    transformedMessage = this.config.transformer(
      filteredRawMessage ?? rawMessage
    );

    return transformedMessage;
  }
}
