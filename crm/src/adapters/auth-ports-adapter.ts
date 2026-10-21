/**
 * Auth port implementations for the crm microservice.
 * AuthConfig is read from the service's own config table (never env).
 */

import {
  AuthMode,
  type AuthConfig,
  type AuthConfigPort,
  type ConfigLoader,
} from "@primebrick/sdk";

export class CrmAuthConfigPort implements AuthConfigPort {
  constructor(private configLoader: ConfigLoader) {}

  async load(): Promise<AuthConfig> {
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
      enable_webauthn: false,
      passkey_required: false,
      enable_mfa: false,
    };
  }
}
