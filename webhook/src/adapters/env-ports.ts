/**
 * Environment-backed ports for the `webhook` service — no database.
 *
 * createMicroservice requires ConfigRepositoryPort / AuthConfigPort /
 * HealthCheckPort. The webhook service is intentionally DB-less (dumb
 * router), so all three are satisfied from env vars / constants:
 *
 * - EnvConfigPort      → serves the config keys the SDK boot needs
 *                        (`nats_url`, `service_code`) from process.env
 * - EnvAuthConfigPort  → GATEWAY-shaped config; the gateway secret comes
 *                        from env (services don't own auth config here)
 * - NoopHealthCheckPort→ the service has no DB; health = process up
 *                        (NATS connectivity is reported separately by
 *                        the registrar health check)
 */

import {
  AuthMode,
  type AuthConfig,
  type AuthConfigPort,
  type ConfigRepositoryPort,
  type HealthCheckPort,
} from "@primebrick/sdk";

export class EnvConfigPort implements ConfigRepositoryPort {
  async findAll(): Promise<Array<{ key: string; value: string | null }>> {
    return [
      { key: "nats_url", value: process.env.NATS_URL ?? "nats://127.0.0.1:4222" },
      { key: "service_code", value: "webhook" },
    ];
  }
}

export class EnvAuthConfigPort implements AuthConfigPort {
  async load(): Promise<AuthConfig> {
    return {
      mode: AuthMode.GATEWAY,
      roles_path: "roles",
      oidc: {},
      gateway: {
        secret: process.env.GATEWAY_SECRET,
        headers: {},
      },
      enable_email_verification_check: false,
      enable_webauthn: false,
      passkey_required: false,
      enable_mfa: false,
    };
  }
}

export class NoopHealthCheckPort implements HealthCheckPort {
  async ping(): Promise<boolean> {
    return true;
  }
}
