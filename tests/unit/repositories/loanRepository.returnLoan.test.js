/**
 * Unit Tests — LoanRepository (returnLoan-related queries)
 * HU-03: Registrar devolución de un libro dentro del plazo
 *
 * Alineado con TEST_CASES.md:
 *  - TC-HU03-01/02: getActiveLoanByBook, getActiveLoanByBookAndReader, updateReturn
 *  - TC-HU03-03: getActiveLoanByBookAndReader → null (no active loan)
 *  - TC-HU03-04: getLatestLoanByBookAndReader → RETURNED
 *
 * Datos base (TEST_CASES.md → Datos base sugeridos HU-03):
 *  - LOAN-ACTIVE-EARLY-01:       loan_id=L-3001, id_book=B-1101, id_reader=R-2101
 *  - LOAN-ACTIVE-ON-LIMIT-01:    loan_id=L-3002, id_book=B-1102, id_reader=R-2102
 *  - BOOK-WITHOUT-ACTIVE-LOAN-01: id_book=B-1103, id_reader=R-2103
 *  - LOAN-ALREADY-RETURNED-01:   loan_id=L-3004, id_book=B-1104, id_reader=R-2104
 */

const LoanRepository = require('../../../src/repositories/loanRepository');

describe('LoanRepository — returnLoan queries (HU-03)', () => {
  let pool;
  let repo;

  beforeEach(() => {
    pool = { query: jest.fn() };
    repo = new LoanRepository(pool);
  });

  // ═══════════════════════════════════════════════════════════════
  // getActiveLoanByBook
  // ═══════════════════════════════════════════════════════════════
  describe('getActiveLoanByBook', () => {
    test('returns active loan when ON_LOAN record exists for id_book', async () => {
      const row = {
        loan_id: 'L-3001',
        id_book: 'B-1101',
        id_reader: 'R-2101',
        state: 'ON_LOAN',
        date_limit: '2026-04-10',
        date_return: null,
      };
      pool.query.mockResolvedValue({ rows: [row] });

      const result = await repo.getActiveLoanByBook('B-1101');

      expect(result).toEqual(row);
      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      expect(params).toEqual(['B-1101']);
      expect(sql).toContain("state = 'ON_LOAN'");
    });

    test('returns null when no active loan exists for id_book', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await repo.getActiveLoanByBook('B-1103');

      expect(result).toBeNull();
    });

    test('throws error when query fails', async () => {
      pool.query.mockRejectedValue(new Error('Connection lost'));

      await expect(repo.getActiveLoanByBook('B-1101')).rejects.toThrow(
        'Error getting active loan by book'
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getActiveLoanByReader
  // ═══════════════════════════════════════════════════════════════
  describe('getActiveLoanByReader', () => {
    test('returns active loan when ON_LOAN record exists for id_reader', async () => {
      const row = {
        loan_id: 'L-3001',
        id_book: 'B-1101',
        id_reader: 'R-2101',
        state: 'ON_LOAN',
        date_limit: '2026-04-10',
      };
      pool.query.mockResolvedValue({ rows: [row] });

      const result = await repo.getActiveLoanByReader('R-2101');

      expect(result).toEqual(row);
      expect(pool.query.mock.calls[0][1]).toEqual(['R-2101']);
    });

    test('returns null when no active loan exists for id_reader', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await repo.getActiveLoanByReader('R-2103');

      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getActiveLoanByBookAndReader
  // ═══════════════════════════════════════════════════════════════
  describe('getActiveLoanByBookAndReader', () => {
    test('returns active loan matching both id_book and id_reader', async () => {
      const row = {
        loan_id: 'L-3001',
        id_book: 'B-1101',
        id_reader: 'R-2101',
        state: 'ON_LOAN',
        date_limit: '2026-04-10',
      };
      pool.query.mockResolvedValue({ rows: [row] });

      const result = await repo.getActiveLoanByBookAndReader('B-1101', 'R-2101');

      expect(result).toEqual(row);
      expect(pool.query.mock.calls[0][1]).toEqual(['B-1101', 'R-2101']);
    });

    test('TC-HU03-03 — returns null when no active loan for book+reader combination', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await repo.getActiveLoanByBookAndReader('B-1103', 'R-2103');

      expect(result).toBeNull();
    });

    test('throws error when query fails', async () => {
      pool.query.mockRejectedValue(new Error('Timeout'));

      await expect(
        repo.getActiveLoanByBookAndReader('B-1101', 'R-2101')
      ).rejects.toThrow('Error getting active loan by book and reader');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getLatestLoanByBookAndReader
  // ═══════════════════════════════════════════════════════════════
  describe('getLatestLoanByBookAndReader', () => {
    test('TC-HU03-04 — returns latest loan with RETURNED state', async () => {
      const row = {
        loan_id: 'L-3004',
        id_book: 'B-1104',
        id_reader: 'R-2104',
        state: 'RETURNED',
        date_return: '2026-04-04',
      };
      pool.query.mockResolvedValue({ rows: [row] });

      const result = await repo.getLatestLoanByBookAndReader('B-1104', 'R-2104');

      expect(result).toEqual(row);
      expect(result.state).toBe('RETURNED');
    });

    test('returns null when no loan history exists', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await repo.getLatestLoanByBookAndReader('B-9999', 'R-9999');

      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getLatestLoanByBook
  // ═══════════════════════════════════════════════════════════════
  describe('getLatestLoanByBook', () => {
    test('returns most recent loan for id_book regardless of state', async () => {
      const row = {
        loan_id: 'L-3004',
        id_book: 'B-1104',
        state: 'RETURNED',
        date_return: '2026-04-04',
      };
      pool.query.mockResolvedValue({ rows: [row] });

      const result = await repo.getLatestLoanByBook('B-1104');

      expect(result).toEqual(row);
      expect(pool.query.mock.calls[0][1]).toEqual(['B-1104']);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getLatestLoanByReader
  // ═══════════════════════════════════════════════════════════════
  describe('getLatestLoanByReader', () => {
    test('returns most recent loan for id_reader regardless of state', async () => {
      const row = {
        loan_id: 'L-3004',
        id_reader: 'R-2104',
        state: 'RETURNED',
      };
      pool.query.mockResolvedValue({ rows: [row] });

      const result = await repo.getLatestLoanByReader('R-2104');

      expect(result).toEqual(row);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // updateReturn
  // ═══════════════════════════════════════════════════════════════
  describe('updateReturn', () => {
    test('TC-HU03-01/02 — updates loan to RETURNED with date_return', async () => {
      const updatedRow = {
        loan_id: 'L-3001',
        id_book: 'B-1101',
        state: 'RETURNED',
        date_return: '2026-04-08',
      };
      pool.query.mockResolvedValue({ rows: [updatedRow] });

      const result = await repo.updateReturn('L-3001', '2026-04-08');

      expect(result).toEqual(updatedRow);
      expect(result.state).toBe('RETURNED');
      expect(result.date_return).toBe('2026-04-08');
      const [sql, params] = pool.query.mock.calls[0];
      expect(params).toEqual(['2026-04-08', 'L-3001']);
      expect(sql).toContain("state = 'RETURNED'");
    });

    test('returns null when loan_id does not exist', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await repo.updateReturn('L-9999', '2026-04-08');

      expect(result).toBeNull();
    });

    test('throws error when query fails', async () => {
      pool.query.mockRejectedValue(new Error('Write failed'));

      await expect(repo.updateReturn('L-3001', '2026-04-08')).rejects.toThrow(
        'Error updating loan return'
      );
    });
  });
});
