import { getDal } from "../db/dal.js";

/**
 * Registers the emailsender microservice in `public.service_registry` and
 * maintains a heartbeat.
 *
 * `public.service_registry` is a shared table in the `public` schema, not
 * owned by this microservice. All four statements are routed through
 * `dal.rawSql` so there is a single DB-access surface (`getDal()`), while
 * preserving the SQL strings verbatim. Forcing a `ServiceRegistryEntity`
 * would be a cross-cutting decision (shared entity in a common package) and
 * is out of scope.
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
      // Check if service already exists
      const existingRows = await dal.rawSql<{ code: string }>(
        "SELECT * FROM public.service_registry WHERE code = $1",
        [this.serviceCode]
      );

      if (existingRows.length > 0) {
        // Update existing service
        await dal.rawSql(
          `UPDATE public.service_registry
           SET base_url = $1, endpoints = $2, updated_at = NOW(), updated_by = 'system', version = version + 1
           WHERE code = $3`,
          [this.baseUrl, JSON.stringify(this.endpoints), this.serviceCode]
        );
        console.log(`Updated service registration: ${this.serviceCode}`);
      } else {
        // Insert new service
        await dal.rawSql(
          `INSERT INTO public.service_registry (code, base_url, endpoints, created_at, created_by, updated_at, updated_by, version)
           VALUES ($1, $2, $3, NOW(), 'system', NOW(), 'system', 1)`,
          [this.serviceCode, this.baseUrl, JSON.stringify(this.endpoints)]
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
      await dal.rawSql(
        `UPDATE public.service_registry
         SET updated_at = NOW(), updated_by = 'system'
         WHERE code = $1`,
        [this.serviceCode]
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
