/**
 * Unit Tests — LoanRepository (isBookAvailable, insertLoan)
 * HU-02: Registrar préstamo de un libro a un lector habilitado
 *
 * Alineado con TEST_CASES.md:
 *  - TC-HU02-01: Libro disponible → isBookAvailable returns true
 *  - TC-HU02-02: Libro ON_LOAN → isBookAvailable returns false
 *  - TC-HU02-01: insertLoan con datos correctos → loan creado
 *
 * Datos base (TEST_CASES.md → Datos base sugeridos HU-02):
 *  - BOOK-AVAILABLE-01: id_book=B-1001, sin préstamo activo
 *  - BOOK-ON-LOAN-01:   id_book=B-1002, último estado ON_LOAN
 */

const LoanRepository = require('../../../src/repositories/loanRepository');

// ══════════════════════════════════════════════════════════════════
// Datos base
// ══════════════════════════════════════════════════════════════════
const LOAN_INSERTED = {
  loan_id: 1,
  id_book: 'B-1001',
  title: 'Cien años de soledad',
  type_id_reader: 'CI',
  id_reader: 'R-2001',
  name_reader: 'Ana Torres',
  loan_days: 7,
  state: 'ON_LOAN',
  date_limit: '2026-04-07',
  date_return: null,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('LoanRepository — isBookAvailable (HU-02)', () => {
  let mockPool;
  let repo;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    repo = new LoanRepository(mockPool);
  });

  // ─── TC-HU02-01: Libro sin historial → disponible ─────────────
  test('TC-HU02-01 — returns true when no loan records exist for book', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    const result = await repo.isBookAvailable('B-1001');

    expect(result).toBe(true);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id_book = $1'),
      ['B-1001']
    );
  });

  // ─── TC-HU02-01 variante: último estado RETURNED → disponible ─
  test('returns true when latest loan state is RETURNED', async () => {
    mockPool.query.mockResolvedValue({
      rows: [{ state: 'RETURNED' }],
    });

    const result = await repo.isBookAvailable('B-1001');

    expect(result).toBe(true);
  });

  // ─── TC-HU02-02: último estado ON_LOAN → no disponible ────────
  test('TC-HU02-02 — returns false when latest loan state is ON_LOAN', async () => {
    mockPool.query.mockResolvedValue({
      rows: [{ state: 'ON_LOAN' }],
    });

    const result = await repo.isBookAvailable('B-1002');

    expect(result).toBe(false);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id_book = $1'),
      ['B-1002']
    );
  });

  // ─── Propagación de error de DB ────────────────────────────────
  test('throws error when database query fails', async () => {
    mockPool.query.mockRejectedValue(new Error('Connection refused'));

    await expect(repo.isBookAvailable('B-1001')).rejects.toThrow(
      'Error checking book availability'
    );
  });
});

describe('LoanRepository — insertLoan (HU-02)', () => {
  let mockPool;
  let repo;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    repo = new LoanRepository(mockPool);
  });

  // ─── TC-HU02-01: Insert exitoso con datos completos ───────────
  test('TC-HU02-01 — inserts loan with correct parameters and returns created record', async () => {
    mockPool.query.mockResolvedValue({ rows: [LOAN_INSERTED] });

    const loanData = {
      id_book: 'B-1001',
      title: 'Cien años de soledad',
      type_id_reader: 'CI',
      id_reader: 'R-2001',
      name_reader: 'Ana Torres',
      loan_days: 7,
      date_limit: new Date('2026-04-07'),
    };

    const result = await repo.insertLoan(loanData);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO loan_books'),
      expect.arrayContaining([
        'B-1001',
        'Cien años de soledad',
        'CI',
        'R-2001',
        'Ana Torres',
        7,
        'ON_LOAN',
      ])
    );
    expect(result).toEqual(LOAN_INSERTED);
    expect(result.state).toBe('ON_LOAN');
    expect(result.loan_id).toBe(1);
  });

  // ─── Verify RETURNING * is used ────────────────────────────────
  test('uses RETURNING * to get created record', async () => {
    mockPool.query.mockResolvedValue({ rows: [LOAN_INSERTED] });

    await repo.insertLoan({
      id_book: 'B-1001',
      title: 'Test',
      type_id_reader: 'CI',
      id_reader: 'R-2001',
      name_reader: 'Test',
      loan_days: 7,
      date_limit: new Date(),
    });

    const queryString = mockPool.query.mock.calls[0][0];
    expect(queryString).toContain('RETURNING *');
  });

  // ─── Propagación de error de DB en insert ──────────────────────
  test('throws error when insert query fails', async () => {
    mockPool.query.mockRejectedValue(new Error('Unique constraint violated'));

    await expect(
      repo.insertLoan({
        id_book: 'B-1001',
        title: 'Test',
        type_id_reader: 'CI',
        id_reader: 'R-2001',
        name_reader: 'Test',
        loan_days: 7,
        date_limit: new Date(),
      })
    ).rejects.toThrow('Error inserting loan');
  });
});
