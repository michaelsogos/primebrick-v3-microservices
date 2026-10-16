/**
 * Auth port implementations for the emailsender microservice.
 *
 * The microservice uses GATEWAY-RESOLVED mode — the BE already resolved the
 * user and forwards the full AuthUser in headers. The microservice does NOT
 * implement UserResolverPort or RoleMappingPort.
 *
 * - EmailSenderAuthConfigPort: reads auth config from the microservice's own `config` table
 * - ApiKeyPort: NOT implemented here — `index.ts` wires the shared
 *   `CachingApiKeyPort(NatsApiKeyPort, getSdkCachePort)` directly, since
 *   `api_keys` lives in the BE-owned `public` schema and resolution always
 *   goes through the governed `auth.apikey.byHash` route.
 */

import {
  type AuthConfig,
  type AuthConfigPort,
  AuthMode,
} from "@primebrick/sdk";
import { ConfigLoader } from "@primebrick/sdk";
import type { ConfigRepositoryPort } from "@primebrick/sdk";

// ─── AuthConfigPort ───────────────────────────────────────────────────────────

export class EmailSenderAuthConfigPort implements AuthConfigPort {
  constructor(private configLoader: ConfigLoader) {}

  async load(): Promise<AuthConfig> {
    // Read auth-related keys from the microservice's own config table
    const mode = (this.configLoader.get("auth_mode") as string) || "GATEWAY";
    const rolesPath = (this.configLoader.get("auth_roles_path") as string) || "roles";
    const clientShieldSecret = this.configLoader.get("service_client_shield_secret") as string | undefined;
    const clientShieldSecretHeader = this.configLoader.get("service_client_shield_secret_header") as string | undefined;
    const clientShieldPublicSecret = this.configLoader.get("gateway_public_secret") as string | undefined;
    const clientShieldPublicSecretHeader = this.configLoader.get("gateway_public_secret_header") as string | undefined;

    return {
      mode: mode.toUpperCase() as AuthMode,
      roles_path: rolesPath,
      oidc: {},
      gateway: {
        secret: clientShieldSecret,
        secret_header_name: clientShieldSecretHeader,
        public_secret: clientShieldPublicSecret,
        public_secret_header_name: clientShieldPublicSecretHeader,
        headers: {
          user_id: "x-user-id",
          email: "x-user-email",
          name: "x-user-name",
          roles: "x-user-roles",
          idp_code: "x-user-idp-code",
          idp_org: "x-user-idp-org",
          idp_username: "x-user-idp-username",
          permissions: "x-user-permissions",
          is_admin: "x-user-is-admin",
          is_system: "x-user-is-system",
        },
      },
      enable_email_verification_check: false,
      // The microservice uses GATEWAY-RESOLVED mode — these BE-only auth-method
      // flags are irrelevant here. They exist on AuthConfig only because the SDK
      // type is shared with the BE. Set to false; the BE enforces the real values.
      enable_webauthn: false,
      passkey_required: false,
      enable_mfa: false,
    };
  }
}

