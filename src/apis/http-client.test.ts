import { describe, expect, it } from "@jest/globals";
import { HttpClient } from "./http-client";

describe("HttpClient", () => {
  describe("GET", () => {
    it("Should call a GET endpoint with an array query parameter in repeat mode", async () => {
      expect.hasAssertions();
      const baseUrl = "https://api.restful-api.dev";

      const client = new HttpClient({
        arrayQueryParameterSerializationMode: "repeat",
      });

      type GetObjectsResponseBody = Array<{
        id: string;
        name: string;
        data: Record<string, unknown>;
      }>;

      const response = await client.get<GetObjectsResponseBody>(
        `${baseUrl}/objects`,
        { query: { id: [1, 2, 3] } }
      );

      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(3);
      expect(response.body[0]).toEqual({
        id: expect.any(String),
        name: expect.any(String),
        data: expect.any(Object),
      });
    });
  });
});
