import { getDal } from "../db/dal.js";
import { field, Filter } from "@primebrick/dal-pg";
import { ServiceRegistryEntity } from "../domain/entities/service_registry_entity.js";

/**
 * Registers the emailsender microservice in `public.service_registry` and
 * maintains a heartbeat.
 *
 * `ServiceRegistryEntity` is decorated with `@Entity("service_registry", "public")`
 * so the DAL generates schema-qualified SQL (`public.service_registry`)
 * regardless of the Dal gateway's `search_path` setting.
 */
export class ServiceRegistration {
  private serviceCode: string;
  private baseUrl: string;
  private endpoints: Record<string, unknown>;

  constructor() {
    this.serviceCode = process.env.SERVICE_CODE || "EMAILSENDER";
    this.baseUrl = process.env.SERVICE_BASE_URL || "http://localhost:3003";
    this.endpoints = {
      webhook: `${this.baseUrl}/webhook`,
      health: `${this.baseUrl}/health`,
    };
  }

  async register(): Promise<void> {
    const dal = getDal();

    try {
      // Check if service already exists (find by code, don't throw if not found)
      let existing: ServiceRegistryEntity | null = null;
      try {
        existing = await dal.find(ServiceRegistryEntity, null, {
          filters: [Filter.fieldValue(field(ServiceRegistryEntity, "code"), "=", this.serviceCode)],
        });
      } catch {
        // NotFoundError → no existing row
        existing = null;
      }

      if (existing) {
        // Update existing service — matchBy "code", auditable entity so actor required
        await dal.update(
          ServiceRegistryEntity,
          {
            code: this.serviceCode,
            base_url: this.baseUrl,
            endpoints: this.endpoints,
          },
          { actor: "system", matchBy: "code" },
        );
        console.log(`Updated service registration: ${this.serviceCode}`);
      } else {
        // Insert new service — auditable entity so actor required
        await dal.add(
          ServiceRegistryEntity,
          {
            code: this.serviceCode,
            base_url: this.baseUrl,
            endpoints: this.endpoints,
          },
          { actor: "system" },
        );
        console.log(`Registered new service: ${this.serviceCode}`);
      }
    } catch (error) {
      console.error("Error registering service:", error);
      throw error;
    }
  }

  async updateHeartbeat(): Promise<void> {
    const dal = getDal();

    try {
      // Heartbeat: just stamp updated_at + updated_by.
      // dal.update stamps updated_at, updated_by, version automatically for
      // auditable entities. We need at least one SET column besides the
      // match key — but the audit stamping handles that.
      // However, dal.update requires at least one user-provided SET column.
      // We use a no-op SET on base_url (same value) to satisfy this.
      await dal.update(
        ServiceRegistryEntity,
        {
          code: this.serviceCode,
          base_url: this.baseUrl,
        },
        { actor: "system", matchBy: "code" },
      );
    } catch (error) {
      console.error("Error updating heartbeat:", error);
    }
  }

  async startHeartbeat(intervalMs: number = 60000): Promise<ReturnType<typeof setInterval>> {
    return setInterval(() => {
      this.updateHeartbeat();
    }, intervalMs);
  }
}
