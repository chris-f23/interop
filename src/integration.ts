import { DatabaseConnection } from "./apis/database-connection";

type IntegrationConfig = {};

export class Integration {
  constructor(public readonly config: IntegrationConfig) {}
}
