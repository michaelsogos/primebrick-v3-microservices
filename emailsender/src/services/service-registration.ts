import { getPool } from "../db/pool.js";

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
    const pool = getPool();
    
    try {
      // Check if service already exists
      const existingResult = await pool.query(
        "SELECT * FROM public.service_registry WHERE code = $1",
        [this.serviceCode]
      );
      
      if (existingResult.rows.length > 0) {
        // Update existing service
        await pool.query(
          `UPDATE public.service_registry 
           SET base_url = $1, endpoints = $2, updated_at = NOW(), updated_by = 'system', version = version + 1
           WHERE code = $3`,
          [this.baseUrl, JSON.stringify(this.endpoints), this.serviceCode]
        );
        console.log(`Updated service registration: ${this.serviceCode}`);
      } else {
        // Insert new service
        await pool.query(
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
    const pool = getPool();
    
    try {
      await pool.query(
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
