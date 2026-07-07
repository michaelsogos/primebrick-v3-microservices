import { getDal, field, Filter, NotFoundError } from "@primebrick/dal-pg";
import type { ServiceRegistryPort, IServiceRegistry } from "@primebrick/sdk";
import { ServiceRegistryEntity } from "../domain/entities/service_registry_entity.js";

/**
 * Adapts @primebrick/dal-pg's Dal gateway to the SDK's ServiceRegistryPort.
 * Used by ServiceRegistrar to register the microservice and maintain heartbeats.
 */
export class ServiceRegistryAdapter implements ServiceRegistryPort<IServiceRegistry> {
  async findByCode(code: string): Promise<IServiceRegistry | null> {
    const dal = getDal();
    try {
      const row = await dal.find<ServiceRegistryEntity>(ServiceRegistryEntity, null, {
        filters: [
          Filter.fieldValue(field(ServiceRegistryEntity, "code"), "=", code),
        ],
      });
      if (!row) return null;
      return {
        code: row.code,
        base_url: row.base_url,
        endpoints: row.endpoints,
      };
    } catch (e) {
      if (e instanceof NotFoundError) return null;
      throw e;
    }
  }

  async insert(row: IServiceRegistry): Promise<void> {
    const dal = getDal();
    await dal.add(
      ServiceRegistryEntity,
      { code: row.code, base_url: row.base_url, endpoints: row.endpoints },
      { actor: "system" },
    );
  }

  async updateByCode(code: string, row: Partial<IServiceRegistry>): Promise<void> {
    const dal = getDal();
    await dal.update(
      ServiceRegistryEntity,
      { ...row, code } as Record<string, unknown>,
      { actor: "system", matchBy: "code" },
    );
  }
}
