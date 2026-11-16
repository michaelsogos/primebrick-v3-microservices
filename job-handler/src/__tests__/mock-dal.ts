/**
 * Shared `@primebrick/dal-pg` mock factory — intercepts BOTH consumer
 * surfaces of the DAL singleton:
 *
 *   1. `getDal()` — the bootstrap accessor (db/dal.ts re-exports it).
 *   2. `DomainService` — `this.dal` is a PROTECTED getter that internally
 *      calls `getDal()` through a relative import inside the package —
 *      mocking the package entry cannot intercept it, so the factory
 *      exports a subclass whose `dal` getter returns the stub. Services
 *      under test (`extends DomainService`) then hit the stub on every
 *      `this.dal.*` AND `this.svc.*` (svc resolves `this.dal.entityService`).
 *
 * The stub doubles as the `repo` behind `entityService`, so `svc.*` ops
 * exercise the REAL service pipeline (hooks, actor ctx, audit binding)
 * and land on the same stubbed verbs (`add`, `update`, `find`,
 * `hardDelete`, `findByPage`, …) the tests spy on. `tableAuditPort` is a
 * no-op AuditPort — audit rows are not what these tests assert.
 *
 * Usage:  vi.mock("@primebrick/dal-pg", async (importOriginal) =>
 *           dalPgMock({ findAll: h.findAll }, importOriginal));
 */
export async function dalPgMock(
  stub: Record<string, unknown>,
  importOriginal: () => Promise<typeof import("@primebrick/dal-pg")>,
) {
  const real = await importOriginal();
  const full: Record<string, unknown> = {
    tableAuditPort: () => ({ writeAudit: async () => 0n }),
    // svc.get inside hooks resolves the row via repo.find — delegate to the
    // stubbed findAll so hooks see the same row the caller enumerated.
    find: async (...args: unknown[]) => {
      const rows = await (full.findAll as (...a: unknown[]) => Promise<unknown[]>)(...args);
      return Array.isArray(rows) ? rows[0] : undefined;
    },
    entityService: (cfg: Parameters<typeof real.makeEntityService>[0]) =>
      real.makeEntityService({ ...cfg, repo: full as never }),
    ...stub,
  };
  class MockDomainService<T extends Record<string, unknown>> extends real.DomainService<T> {
    protected override get dal(): never {
      return full as never;
    }
  }
  return {
    ...real,
    getDal: () => full,
    // Cast to the real class type — the anonymous subclass can't be named
    // in the exported factory type (TS4094 on its protected members).
    DomainService: MockDomainService as unknown as typeof real.DomainService,
  };
}
