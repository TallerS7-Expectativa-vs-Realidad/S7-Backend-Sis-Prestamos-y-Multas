/**
 * Unit Tests — LoanRepository.findByName
 * HU-01: Consultar estado y disponibilidad de un libro
 *
 * Alineado con TEST_CASES.md:
 *  - TC-HU01-01 data: id=B-0901, name=Don Quijote, status=RETURNED
 *  - TC-HU01-02 data: id=B-0902, name=La vorágine, status=ON_LOAN
 *  - TC-HU01-03: sin coincidencias → array vacío
 *  - Búsqueda case-insensitive (ILIKE)
 *  - Propagación de errores de DB
 */

const LoanRepository = require('../../../src/repositories/loanRepository');

// ══════════════════════════════════════════════════════════════════
// Datos base (TEST_CASES.md → Datos base sugeridos HU-01)
// ══════════════════════════════════════════════════════════════════
const BOOK_AVAILABLE_HISTORY_01 = {
  id: 'B-0901', name: 'Don Quijote', status: 'RETURNED',
};
const BOOK_ON_LOAN_HISTORY_01 = {
  id: 'B-0902', name: 'La vorágine', status: 'ON_LOAN',
};

describe('LoanRepository — findByName (HU-01)', () => {
  let pool;
  let repo;

  beforeEach(() => {
    pool = {
      query: jest.fn(),
    };
    repo = new LoanRepository(pool);
  });

  // ─── TC-HU01-01: query returns RETURNED book ──────────────────
  test('TC-HU01-01 — queries DB with ILIKE and returns RETURNED book', async () => {
    pool.query.mockResolvedValue({ rows: [BOOK_AVAILABLE_HISTORY_01] });

    const result = await repo.findByName('Don Quijote');

    expect(pool.query).toHaveBeenCalledTimes(1);
    const [query, params] = pool.query.mock.calls[0];
    expect(params[0]).toBe('%Don Quijote%');
    expect(query.toLowerCase()).toMatch(/ilike|lower/);
    expect(result).toEqual([BOOK_AVAILABLE_HISTORY_01]);
  });

  // ─── TC-HU01-02: query returns ON_LOAN book ──────────────────
  test('TC-HU01-02 — queries DB with ILIKE and returns ON_LOAN book', async () => {
    pool.query.mockResolvedValue({ rows: [BOOK_ON_LOAN_HISTORY_01] });

    const result = await repo.findByName('La vorágine');

    const [query, params] = pool.query.mock.calls[0];
    expect(params[0]).toBe('%La vorágine%');
    expect(result).toEqual([BOOK_ON_LOAN_HISTORY_01]);
  });

  // ─── TC-HU01-03: no matches → empty array ─────────────────────
  test('TC-HU01-03 — returns empty array when no records match', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const result = await repo.findByName('Manual de estanterías invisibles');

    expect(pool.query).toHaveBeenCalledTimes(1);
    const [, params] = pool.query.mock.calls[0];
    expect(params[0]).toBe('%Manual de estanterías invisibles%');
    expect(result).toEqual([]);
  });

  // ─── Case-insensitive: búsqueda en minúsculas ────────────────
  test('uses case-insensitive search (ILIKE)', async () => {
    pool.query.mockResolvedValue({ rows: [BOOK_AVAILABLE_HISTORY_01] });

    await repo.findByName('don quijote');

    const [query, params] = pool.query.mock.calls[0];
    expect(query.toLowerCase()).toMatch(/ilike|lower/);
    expect(params[0]).toBe('%don quijote%');
  });

  // ─── Propagación de errores de DB ─────────────────────────────
  test('propagates database errors', async () => {
    pool.query.mockRejectedValue(new Error('Connection refused'));

    await expect(repo.findByName('Don Quijote')).rejects.toThrow(/Connection refused/);
  });

  // ─── Validación delegada al service ───────────────────────────
  test('executes query even with empty title (service validates)', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const result = await repo.findByName('');

    expect(pool.query).toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
