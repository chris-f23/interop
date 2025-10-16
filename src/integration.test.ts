import { config as configDotenv } from "dotenv";
import { describe, expect, it } from "@jest/globals";
import { DatabaseConnection, Query } from "./apis/database-connection";
import { Integration } from "./integration";
import { HttpServer } from "./apis/http-server";
import axios from "axios";

configDotenv({
  quiet: true,
  path: "./.env.test",
});

function setupMSSQLDatabase() {
  return new DatabaseConnection({
    driver: "mssql",
    host: String(process.env.MSSQL_DB_HOST),
    port: Number(process.env.MSSQL_DB_PORT),
    user: String(process.env.MSSQL_DB_USER),
    password: String(process.env.MSSQL_DB_PASSWORD),
    applicationName: "interop",
  }).connect();
}

function setupHTTPServer(apiKey: string, db: DatabaseConnection) {
  const server = new HttpServer({
    port: 3000,
  });

  server.addEndpoint("patch", "/citas/:id", async (request, response) => {
    // TODO: Mejorar la lógica de validación (zod)
    if (request.headers?.authorization !== apiKey) {
      return response.unauthorized({
        message: "La API key es incorrecta",
      });
    }

    if (!request.path?.id) {
      return response.badRequest({
        message: "El identificador de la cita es requerido (path.id)",
      });
    }

    if (!request.body?.estado) {
      return response.badRequest({
        message: "El estado de la cita es requerido (body.estado)",
      });
    }

    const [cita] = await db.query({
      sql: `
          SELECT TOP (1) * FROM [BD_ENTI_CORPORATIVA].[dbo].[KEIRON_Cita] WHERE Id = :id
          `,
      replacements: { id: request.path.id },
      rowMapper: (row: any) => {
        return {
          id: row.Id,
          referenciaCitaOrigen: row.ReferenciaCitaOrigen,
          referenciaDealKeiron: row.ReferenciaDealKeiron,
          correoPaciente: row.CorreoPaciente,
          telefonoPaciente: row.TelefonoPaciente,
          rutPaciente: row.RutPaciente,
          nombrePaciente: row.NombrePaciente,
          nombreProfesional: row.NombreProfesional,
          nombreEspecialidad: row.NombreEspecialidad,
          fechaCita: row.FechaCita,
        };
      },
    });

    if (cita === undefined) {
      return response.notFound({
        message: "La cita no fue encontrada",
      });
    }

    // TODO: Implementar la lógica de actualización de la cita

    return response.ok({
      message: "La cita ha sido actualizada",
    });
  });

  return server.listen();
}

describe("Integration", () => {
  it("Should create a MSSQL Database to HTTP Server integration", async () => {
    // 1. Arrange
    const API_KEY = "my-api-key";
    const db = await setupMSSQLDatabase();
    const server = await setupHTTPServer(API_KEY, db);

    // 2. Act
    const idCita = "5277AC5F-6DED-4C52-AB11-D9AF809994D2";
    const response = await axios.patch(
      `http://localhost:3000/citas/${idCita}`,
      { estado: "CONFIRMADA" },
      { headers: { Authorization: API_KEY } }
    );

    // 3. Assert
    expect(response.status).toBe(200);
    await expect(server.terminate()).resolves.not.toThrow();
    await expect(db.terminate()).resolves.not.toThrow();
  });
});
