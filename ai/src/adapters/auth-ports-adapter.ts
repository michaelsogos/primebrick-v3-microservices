/**
 * Auth port implementations for the AI microservice.
 *
 * The microservice uses GATEWAY-RESOLVED mode — the BE already resolved the
 * user and forwards the full AuthUser in headers. The microservice does NOT
 * implement UserResolverPort or RoleMappingPort.
 */

import {
  type AuthConfig,
  type AuthConfigPort,
  AuthMode,
} from "@primebrick/sdk";
import type { ConfigLoader } from "@primebrick/sdk";

// ─── AuthConfigPort ───────────────────────────────────────────────────────────

export class AiAuthConfigPort implements AuthConfigPort {
  constructor(private configLoader: ConfigLoader) {}

  async load(): Promise<AuthConfig> {
    const mode = (this.configLoader.get("auth_mode") as string) || "GATEWAY";
    const rolesPath = (this.configLoader.get("auth_roles_path") as string) || "roles";
    const gatewaySecret = this.configLoader.get("gateway_secret") as string | undefined;
    const gatewaySecretHeader = this.configLoader.get("gateway_secret_header") as string | undefined;
    const gatewayPublicSecret = this.configLoader.get("gateway_public_secret") as string | undefined;
    const gatewayPublicSecretHeader = this.configLoader.get("gateway_public_secret_header") as string | undefined;

    return {
      mode: mode.toUpperCase() as AuthMode,
      roles_path: rolesPath,
      oidc: {},
      gateway: {
        secret: gatewaySecret,
        secret_header_name: gatewaySecretHeader,
        public_secret: gatewayPublicSecret,
        public_secret_header_name: gatewayPublicSecretHeader,
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
