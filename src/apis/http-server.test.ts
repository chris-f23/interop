import { describe, expect, it } from "@jest/globals";
import axios from "axios";
import { HttpServer } from "./http-server";

describe("HttpServer", () => {
  it("Should create a server with one endpoint and call it", async () => {
    expect.hasAssertions();

    const API_KEY = "my-api-key";
    const server = new HttpServer({
      port: 3000,
      endpoints: [
        {
          path: "/hello",
          method: "get",
          handler: async (request) => {
            const apiKey = request.headers?.authorization?.trim();
            if (apiKey !== API_KEY) {
              return {
                statusCode: 401,
                body: {
                  error: {
                    message: "Unauthorized",
                  },
                },
              };
            }

            return {
              statusCode: 200,
              body: {
                data: {
                  hello: "world",
                },
              },
            };
          },
        },
      ],
    });

    await expect(server.listen()).resolves.not.toThrow();

    const response = await axios.get("http://localhost:3000/hello", {
      headers: { Authorization: API_KEY },
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      data: {
        hello: "world",
      },
    });

    await expect(server.terminate()).resolves.not.toThrow();
  });
});
