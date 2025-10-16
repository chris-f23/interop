import { Sequelize, Options as SequelizeOptions } from "sequelize";

type QueryExecution<
  TRecordsetRow extends Record<string, unknown>,
  TReplacements extends Record<string, unknown> | undefined = undefined
> = (params: TReplacements) => Promise<TRecordsetRow[]>;

export class Query<
  TRecordsetRow extends Record<string, unknown>,
  TReplacements extends Record<string, unknown> | undefined = undefined
> {
  constructor(public readonly sql: string) {}

  generate(conn: Sequelize): QueryExecution<TRecordsetRow, TReplacements> {
    return async (params: TReplacements) => {
      const [rows] = await conn.query(this.sql, { replacements: params });
      return rows as TRecordsetRow[];
    };
  }
}

type DatabaseConnectionConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  driver: "mssql";
  applicationName: string;
};

export class DatabaseConnection {
  private conn?: Sequelize;
  private sequelizeOptions: SequelizeOptions;

  constructor(public readonly config: DatabaseConnectionConfig) {
    this.sequelizeOptions = {
      dialect: this.config.driver,
      host: this.config.host,
      port: this.config.port,
      username: this.config.user,
      password: this.config.password,
      dialectOptions: {
        options: {
          appName: this.config.applicationName,
        },
      },
      logging: false,
    };
  }

  async connect(): Promise<DatabaseConnection> {
    this.conn = new Sequelize(this.sequelizeOptions);
    await this.conn.authenticate();
    return this;
  }

  // Sin rowMapper devuelve void
  async query<
    TReplacements extends Record<string, unknown>,
    TMappedRow extends Record<string, unknown>
  >(params: { sql: string; replacements?: TReplacements }): Promise<void>;

  // Con rowMapper devuelve un la fila mapeada
  async query<
    TReplacements extends Record<string, unknown>,
    TMappedRow extends Record<string, unknown>
  >(params: {
    sql: string;
    replacements?: TReplacements;
    rowMapper: (row: any) => TMappedRow;
  }): Promise<TMappedRow[]>;

  async query<
    TReplacements extends Record<string, unknown>,
    TMappedRow extends Record<string, unknown>
  >(params: {
    sql: string;
    replacements?: TReplacements;
    rowMapper?: (row: any) => TMappedRow;
  }): Promise<void | TMappedRow[]> {
    if (!this.conn) {
      throw new Error("Database connection not initialized");
    }
    const [rows] = await this.conn.query(params.sql, {
      replacements: params.replacements,
    });

    if (!params.rowMapper) {
      return;
    }

    return rows.map((row: any) => params.rowMapper!(row));
  }

  async terminate(): Promise<void> {
    if (!this.conn) {
      throw new Error("Database connection not initialized");
    }
    await this.conn.close();
  }
}
