import { Sequelize, Options as SequelizeOptions } from "sequelize";
import {
  DestinationConnector,
  DestinationConnectorBaseConfig,
} from "../destination-connector";

type DatabaseWriterRawResponse = {
  status: "SENT" | "ERROR";
};

type DatabaseWriterRequest<
  TTransformedMessage extends Record<string, unknown>
> = {
  replacements: TTransformedMessage;
};

type SupportedDatabaseDriver = "sqlite" | "mssql";

type DatabaseWriterConfig<
  TRawMessage,
  TTransformedMessage,
  TTransformedResponse,
  TDatabaseDriver extends SupportedDatabaseDriver
> = DestinationConnectorBaseConfig<
  TRawMessage,
  TTransformedMessage,
  DatabaseWriterRawResponse,
  TTransformedResponse
> & {
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
  onWriteQuery: string;
};

export class DatabaseWriter<
  TRawMessage,
  TTransformedMessage extends Record<string, unknown>,
  TTransformedResponse,
  TDatabaseDriver extends SupportedDatabaseDriver
> extends DestinationConnector<
  TRawMessage,
  DatabaseWriterRequest<TTransformedMessage>,
  DatabaseWriterRawResponse,
  TTransformedResponse
> {
  client: Sequelize | null = null;

  constructor(
    public readonly config: DatabaseWriterConfig<
      TRawMessage,
      DatabaseWriterRequest<TTransformedMessage>,
      TTransformedResponse,
      TDatabaseDriver
    >
  ) {
    super({
      filter: config.filter,
      transformer: config.transformer,
      responseTransformer: config.responseTransformer,
    });
  }

  protected async _init(): Promise<void> {
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

  protected async _write(
    rawMessage: TRawMessage
  ): Promise<TTransformedResponse> {
    if (!this.client) {
      throw new Error("Writer has not been initialized");
    }

    const transformedMessage = this.config.transformer(rawMessage);
    try {
      await this.client.query(this.config.onWriteQuery, transformedMessage);

      const transformedResponse = this.config.responseTransformer({
        status: "SENT",
      });
      return transformedResponse;
    } catch (error) {
      const transformedResponse = this.config.responseTransformer({
        status: "ERROR",
      });
      return transformedResponse;
    }
  }

  protected async _halt(): Promise<void> {
    await this.client?.close();
    this.client = null;
  }
}
