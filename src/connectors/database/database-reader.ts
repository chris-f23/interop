import { Sequelize, Options as SequelizeOptions, QueryTypes } from "sequelize";
import {
  SourceConnector,
  SourceConnectorBaseConfig,
} from "../source-connector";
import mitt, { Emitter } from "mitt";

type SupportedDatabaseDriver = "sqlite" | "mssql";

type DatabaseReaderConfig<
  TRawMessage extends Record<string, unknown>,
  TTransformedMessage,
  TDatabaseDriver extends SupportedDatabaseDriver
> = SourceConnectorBaseConfig<TRawMessage, TTransformedMessage> & {
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
  onInitQueries: string[];
  onReadQuery: string;
} & ReaderConfig;

export class DatabaseReader<
  TRawMessage extends Record<string, unknown>,
  TTransformedMessage,
  TDatabaseDriver extends SupportedDatabaseDriver
> extends SourceConnector<TRawMessage, TTransformedMessage> {
  db: Sequelize | null = null;

  pollingInterval: NodeJS.Timeout | null = null;
  isRunningInterval: boolean = false;

  public constructor(
    public config: DatabaseReaderConfig<
      TRawMessage,
      TTransformedMessage,
      TDatabaseDriver
    >
  ) {
    super({
      transformer: config.transformer,
      filter: config.filter,
    });
  }

  protected async _init(
    onNewMessage: (message: TTransformedMessage) => void
  ): Promise<void> {
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

    this.db = new Sequelize({
      ...sequelizeOptions,
      logging: false,
    });

    if ("onInitQueries" in this.config) {
      for (const initQuery of this.config.onInitQueries) {
        await this.db.query(initQuery);
      }
    }

    if (this.config.polling.scheduleType === "interval") {
      this.pollingInterval = setInterval(async () => {
        if (this.isRunningInterval) {
          return;
        }

        this.isRunningInterval = true;

        try {
          this.read(onNewMessage);
        } catch (error) {}

        this.isRunningInterval = false;
      }, this.config.polling.intervalInSeconds * 1000);
    }
  }

  protected async _read(
    onNewMessage: (message: TTransformedMessage) => void
  ): Promise<void> {
    if (!this.db) {
      throw new Error("Reader has not been initialized");
    }

    const [rows] = await this.db.query(this.config.onReadQuery);
    for (const rawMessage of rows) {
      let filteredRawMessage;

      if (this.config.filter) {
        filteredRawMessage = this.config.filter(rawMessage as TRawMessage);
      }

      const transformedMessage = this.config.transformer(
        filteredRawMessage ?? (rawMessage as TRawMessage)
      );

      onNewMessage(transformedMessage);
    }
  }

  protected async _halt(): Promise<void> {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    await this.db?.close();
    this.db = null;
  }
}
