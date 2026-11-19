/**
 * test-actions-route — the boilerplate's example RPC surface, declared as
 * RpcRoute[] and served exclusively through makeRpcRouter:
 *
 *   GET  /api/v1/actions/test-ping   — hello-world liveness probe
 *   POST /api/v1/actions/test-echo   — body-validated echo (write shape)
 *
 * Non-entity business endpoints live under /api/v1/actions/<action>
 * (api-path-conventions). Replace both routes with your domain actions on
 * clone — they exist to prove the cloned service serves for real the
 * moment the index.ts guard is removed.
 */

import {
  Permission,
  ValidationError,
  type RpcRoute,
} from "@primebrick/sdk";

interface TestEchoBody {
  message: string;
}

export const testActionRoutes: RpcRoute[] = [
  {
    method: "GET",
    path: "/api/v1/actions/test-ping",
    auth: "user",
    permissions: [Permission.AUTHENTICATED_USER],
    openapi: {
      summary: "Ping the service",
      description:
        "Hello-world probe — proves the service route surface is live after a clone. Replace on clone.",
      tags: ["test"],
      responseSchema: {
        type: "object",
        properties: {
          pong: { type: "boolean" },
          service: { type: "string" },
          at: { type: "string", format: "date-time" },
        },
      },
    },
    handler: async () => ({
      pong: true,
      service: "boilerplate",
      at: new Date().toISOString(),
    }),
  },
  {
    method: "POST",
    path: "/api/v1/actions/test-echo",
    auth: "user",
    permissions: [Permission.AUTHENTICATED_USER],
    openapi: {
      summary: "Echo a message back",
      description:
        "Example write RPC — validates the body envelope and echoes it. Replace on clone.",
      tags: ["test"],
      requestSchema: {
        type: "object",
        required: ["message"],
        properties: { message: { type: "string" } },
      },
    },
    body: (raw): TestEchoBody => {
      const body = raw as Record<string, unknown>;
      if (typeof body?.message !== "string" || body.message.length === 0) {
        throw new ValidationError("Request body must be { message: string }");
      }
      return { message: body.message };
    },
    handler: async (ctx) => ({ echo: (ctx.body as TestEchoBody).message }),
  },
];
