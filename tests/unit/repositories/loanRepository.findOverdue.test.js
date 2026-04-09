/**
 * Unit Tests — LoanRepository.findOverdue
 * HU-05: Consultar préstamos vencidos y lector responsable
 *
 * Alineado con TEST_CASES.md:
 *  - TC-HU05-01 data: OVERDUE-LOAN-01 y OVERDUE-LOAN-02 (state=ON_LOAN, date_limit vencida)
 *  - TC-HU05-02: sin préstamos vencidos → array vacío
 *  - TC-HU05-03: mezcla de vencidos, vigentes y cerrados → solo vencidos
 *  - Propagación de errores de DB
 */

const LoanRepository = require('../../../src/repositories/loanRepository');

// ══════════════════════════════════════════════════════════════════
// Datos base (TEST_CASES.md → Datos base sugeridos HU-05)
// ══════════════════════════════════════════════════════════════════
const OVERDUE_LOAN_01 = {
  loan_id: 'L-5001',
  id_book: 'B-1251',
  title: 'La Odisea',
  state: 'ON_LOAN',
  id_reader: 'R-2251',
  name_reader: 'Sara Mena',
  date_limit: '2026-03-20',
  date_return: null,
};

const OVERDUE_LOAN_02 = {
  loan_id: 'L-5002',
  id_book: 'B-1252',
  title: 'El Aleph',
  state: 'ON_LOAN',
  id_reader: 'R-2252',
  name_reader: 'Bruno Paz',
  date_limit: '2026-03-24',
  date_return: null,
};

describe('LoanRepository — findOverdue (HU-05)', () => {
  let pool;
  let repo;

  beforeEach(() => {
    pool = {
      query: jest.fn(),
    };
    repo = new LoanRepository(pool);
  });

  // ─── TC-HU05-01: query returns overdue loans ──────────────────
  test('TC-HU05-01 — queries DB for overdue loans and returns results', async () => {
    pool.query.mockResolvedValue({ rows: [OVERDUE_LOAN_01, OVERDUE_LOAN_02] });

    const result = await repo.findOverdue();

    expect(pool.query).toHaveBeenCalledTimes(1);
    const [query] = pool.query.mock.calls[0];
    // Verify the query filters by state=ON_LOAN and date_limit < CURRENT_DATE
    expect(query).toMatch(/state\s*=\s*'ON_LOAN'/i);
    expect(query).toMatch(/date_limit\s*<\s*CURRENT_DATE/i);
    expect(result).toEqual([OVERDUE_LOAN_01, OVERDUE_LOAN_02]);
    expect(result).toHaveLength(2);
  });

  // ─── TC-HU05-01: result includes required fields ──────────────
  test('TC-HU05-01 — each result includes loan_id, id_book, title, state, id_reader, name_reader, date_limit, date_return', async () => {
    pool.query.mockResolvedValue({ rows: [OVERDUE_LOAN_01] });

    const result = await repo.findOverdue();

    const loan = result[0];
    expect(loan).toHaveProperty('loan_id');
    expect(loan).toHaveProperty('id_book');
    expect(loan).toHaveProperty('title');
    expect(loan).toHaveProperty('state', 'ON_LOAN');
    expect(loan).toHaveProperty('id_reader');
    expect(loan).toHaveProperty('name_reader');
    expect(loan).toHaveProperty('date_limit');
    expect(loan).toHaveProperty('date_return', null);
  });

  // ─── TC-HU05-02: no overdue loans → empty array ───────────────
  test('TC-HU05-02 — returns empty array when no overdue loans exist', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const result = await repo.findOverdue();

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  // ─── TC-HU05-03: only truly overdue rows returned by DB ───────
  test('TC-HU05-03 — SELECT filters exclude RETURNED and not-yet-due loans at DB level', async () => {
    // The repository delegates filtering to the SQL WHERE clause.
    // When the DB returns only the overdue row, the repository passes it through.
    pool.query.mockResolvedValue({ rows: [OVERDUE_LOAN_01] });

    const result = await repo.findOverdue();

    expect(result).toEqual([OVERDUE_LOAN_01]);
    expect(result).toHaveLength(1);
    // Verify the query itself enforces filtering
    const [query] = pool.query.mock.calls[0];
    expect(query).toMatch(/state\s*=\s*'ON_LOAN'/i);
    expect(query).toMatch(/date_limit\s*<\s*CURRENT_DATE/i);
  });

  // ─── Error propagation ────────────────────────────────────────
  test('throws descriptive error when DB query fails', async () => {
    pool.query.mockRejectedValue(new Error('connection refused'));

    await expect(repo.findOverdue()).rejects.toThrow(/overdue/i);
  });

  // ─── Query selects expected columns ───────────────────────────
  test('query selects the 8 required columns from loan_books', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await repo.findOverdue();

    const [query] = pool.query.mock.calls[0];
    const requiredColumns = ['loan_id', 'id_book', 'title', 'state', 'id_reader', 'name_reader', 'date_limit', 'date_return'];
    for (const col of requiredColumns) {
      expect(query).toContain(col);
    }
  });

  // ─── Query orders by date_limit ASC ───────────────────────────
  test('query orders results by date_limit ascending', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await repo.findOverdue();

    const [query] = pool.query.mock.calls[0];
    expect(query).toMatch(/ORDER BY\s+date_limit\s+ASC/i);
  });
});
