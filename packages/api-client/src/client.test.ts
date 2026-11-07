import { describe, expect, it } from "vitest";
import { ApiClientError, createClient } from "./index";

describe("api client", () => {
  it("sends the client header and surfaces field errors", async () => {
    const calls: RequestInit[] = [];
    const client = createClient({
      baseUrl: "http://api.test",
      fetch: (async (_url, init) => {
        calls.push(init ?? {});
        return new Response(
          JSON.stringify({
            error: { code: "validation", message: "Check the form.", fields: { email: "invalid" } },
          }),
          {
            status: 422,
            headers: { "Content-Type": "application/json" },
          },
        );
      }) as typeof fetch,
    });
    await expect(
      client.request("/api/v1/auth/login", { method: "POST", body: "{}" }),
    ).rejects.toBeInstanceOf(ApiClientError);
    const headers = new Headers(calls[0]?.headers);
    expect(headers.get("X-Triunder-Client")).toBe("web");
  });
});
