import { describe, expect, it } from "@jest/globals";
import axios from "axios";
import { HttpServer } from "./http-server";

describe("HttpServer", () => {
  it("Should create a server with one endpoint and call it", async () => {
    expect.hasAssertions();

    // 1. Arrange
    const API_KEY = "my-api-key";
    const server = new HttpServer({ port: 3000 });

    server.addEndpoint("get", "/hello", async (request, helper) => {
      if (request.headers?.authorization !== API_KEY) {
        return helper.unauthorized({
          message: "Unauthorized",
        });
      }
      return helper.ok({
        data: {
          hello: "world",
        },
      });
    });

    await server.listen();

    // 2. Act
    const response = await axios.get("http://localhost:3000/hello", {
      headers: { Authorization: API_KEY },
    });

    // 3. Assert
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      data: {
        hello: "world",
      },
    });

    await expect(server.terminate()).resolves.not.toThrow();
  });
});
