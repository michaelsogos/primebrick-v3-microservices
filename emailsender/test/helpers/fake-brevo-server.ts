/**
 * Fake Brevo HTTP server — a REAL http.createServer, NOT a vitest mock.
 *
 * Listens on a random port (127.0.0.1:0). The BrevoClient is constructed with
 * apiEndpoint = http://127.0.0.1:<port>, so the fetch() call in sendEmail()
 * hits a real TCP connection, real HTTP request, real HTTP response parsing.
 * The only thing that's "fake" is the response content.
 *
 * This tests the full BrevoClient.sendEmail() code path including header
 * construction, body serialization, response parsing, and error handling.
 */
import { createServer, type Server } from "http";

export interface FakeBrevoConfig {
  /** HTTP status to return. Default: 200. */
  responseStatus?: number;
  /** JSON body to return on success. Default: { messageId: "fake-msg-id-123" }. */
  responseBody?: object;
  /** If set, return this error status + body instead of the success response. */
  errorStatus?: number;
  errorBody?: object;
}

export interface FakeBrevoServer {
  server: Server;
  port: number;
  url: string;
  close: () => Promise<void>;
  /** All requests received by the server, in order. */
  receivedRequests: Array<{ headers: Record<string, string>; body: unknown }>;
}

/**
 * Start a fake Brevo HTTP server on a random port.
 */
export async function startFakeBrevoServer(config: FakeBrevoConfig = {}): Promise<FakeBrevoServer> {
  const receivedRequests: Array<{ headers: Record<string, string>; body: unknown }> = [];

  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      receivedRequests.push({
        headers: req.headers as Record<string, string>,
        body: body ? JSON.parse(body) : null,
      });

      if (config.errorStatus) {
        res.writeHead(config.errorStatus, { "Content-Type": "application/json" });
        res.end(JSON.stringify(config.errorBody ?? { code: "error", message: "brevo down" }));
        return;
      }

      res.writeHead(config.responseStatus ?? 200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(config.responseBody ?? { messageId: "fake-msg-id-123" }));
    });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({
        server,
        port,
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise<void>((r) => server.close(() => r())),
        receivedRequests,
      });
    });
  });
}
