import { Sequelize } from "sequelize";

export class DatabaseConnection {
  private conn: Sequelize;

  constructor(
    public readonly config: {
      host: string;
      port: number;
      user: string;
      password: string;
      driver: "mssql";
      applicationName: string;
    }
  ) {
    this.conn = new Sequelize({
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
    });
  }

  async check(): Promise<void> {
    await this.conn.authenticate();
  }

  async query<
    TRecordsetRow extends Record<string, unknown>,
    TReplacements extends Record<string, unknown> | undefined = undefined
  >(sql: string, replacements?: TReplacements): Promise<TRecordsetRow[]> {
    const [rows] = await this.conn.query(sql, { replacements });
    return rows as TRecordsetRow[];
  }

  async terminate(): Promise<void> {
    await this.conn.close();
  }
}
