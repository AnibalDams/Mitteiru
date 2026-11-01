import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { SourceHttpClient } from "../http";
import { SourceBlockedError, SourceInvalidRequestError, SourceNotFoundError } from "../errors";

let server: ReturnType<typeof Bun.serve>;
let baseUrl = "";
let hits = 0;

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    async fetch(request) {
      const url = new URL(request.url);

      if (url.pathname === "/ok") {
        hits += 1;
        return Response.json({ message: "ok", items: [1, 2, 3] });
      }

      if (url.pathname === "/cf") {
        return new Response("<html><title>Attention Required! | Cloudflare</title></html>", {
          status: 403,
          headers: { server: "cloudflare", "content-type": "text/html" },
        });
      }

      if (url.pathname === "/notfound") {
        return new Response("missing", { status: 404 });
      }

      if (url.pathname === "/set-cookie") {
        return new Response("ok", {
          headers: {
            "Set-Cookie": "ao.session=abc123; Path=/; SameSite=Strict",
            "content-type": "text/plain",
          },
        });
      }

      if (url.pathname === "/echo-json") {
        const body = await request.json().catch(() => null);
        return Response.json({ received: body });
      }

      return new Response("not found", { status: 404 });
    },
  });

  baseUrl = `http://127.0.0.1:${server.port}`;
});

afterAll(async () => {
  await server.stop(true);
});

function client(sourceId: string): SourceHttpClient {
  return new SourceHttpClient({ sourceId, baseUrl, allowPrivateHosts: true });
}

describe("SourceHttpClient", () => {
  test("obtiene JSON y respeta la caché", async () => {
    hits = 0;
    const http = client("cache-test");
    const first = await http.getJson<{ message: string }>("/ok?cache=1");
    const second = await http.getJson<{ message: string }>("/ok?cache=1");

    expect(first.message).toBe("ok");
    expect(second.message).toBe("ok");
    expect(hits).toBe(1);
  });

  test("detecta Cloudflare y lanza blocked si no hay solver", async () => {
    const http = client("cf-test");
    await expect(http.getText("/cf?x=1")).rejects.toBeInstanceOf(SourceBlockedError);
  });

  test("traduce 404 a not_found", async () => {
    const http = client("404-test");
    await expect(http.getText("/notfound?x=1")).rejects.toBeInstanceOf(SourceNotFoundError);
  });

  test("bloquea dominios fuera de la allowlist (anti-SSRF)", async () => {
    const http = client("ssrf-test");
    await expect(http.getText("http://evil.example/secret")).rejects.toBeInstanceOf(
      SourceInvalidRequestError,
    );
  });

  test("lee cookies de sesión del jar (AnimeOnsen)", async () => {
    const http = client("cookie-test");
    await http.getText("/set-cookie?x=1");
    expect(http.getCookie("ao.session")).toBe("abc123");
  });

  test("envía cuerpos JSON (Meilisearch)", async () => {
    const http = client("json-body-test");
    const data = await http.postJsonBody<{ received: { hello: string } }>(
      "/echo-json",
      { hello: "world" },
    );
    expect(data.received.hello).toBe("world");
  });
});
