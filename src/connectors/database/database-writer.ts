// import {
//   DestinationConnector,
//   DestinationConnectorBaseConfig,
// } from "../destination-connector";

// type DBWriterRawResponse = {
//   rows: Record<string, unknown>[];
// };

// type SupportedDatabaseDriver = "sqlite" | "mssql";

// type DBWriterConfig<
//   TRawMessage,
//   TTransformedMessage,
//   TRawResponse,
//   TTransformedResponse,
//   TDatabaseDriver extends SupportedDatabaseDriver
// > = DestinationConnectorBaseConfig<DBWriterRawResponse, TTransformedMessage> & {
//   driver: TDatabaseDriver;

//   connection: TDatabaseDriver extends "sqlite"
//     ? { file: string }
//     : {
//         host: string;
//         port?: number;
//         database?: string;
//         username?: string;
//         password?: string;
//       };

//   polling: {
//     scheduleType: "interval";
//     interval: number;
//     unit: "milliseconds" | "seconds" | "minutes" | "hours";
//   };
//   onInitQueries: string[];
//   onReadQuery: string;
// };

// export class DatabaseWriter extends DestinationConnector<> {}
