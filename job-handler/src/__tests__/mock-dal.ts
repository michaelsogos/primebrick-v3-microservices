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
 * Usage:  vi.mock("@primebrick/dal-pg", async (importOriginal) =>
 *           dalPgMock({ findAll: h.findAll }, importOriginal));
 */
export async function dalPgMock(
  stub: Record<string, unknown>,
  importOriginal: () => Promise<typeof import("@primebrick/dal-pg")>,
) {
  const real = await importOriginal();
  class MockDomainService<T extends Record<string, unknown>> extends real.DomainService<T> {
    protected override get dal(): never {
      return stub as never;
    }
  }
  return {
    ...real,
    getDal: () => stub,
    // Cast to the real class type — the anonymous subclass can't be named
    // in the exported factory type (TS4094 on its protected members).
    DomainService: MockDomainService as unknown as typeof real.DomainService,
  };
}
