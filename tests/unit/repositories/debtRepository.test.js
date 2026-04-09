/**
 * Unit Tests — DebtRepository
 * HU-04: Registrar devolución tardía y generar multa Fibonacci (createDebt)
 *
 * Cobertura:
 *  - createDebt: inserta deuda con campos correctos y state_debt=PENDING
 *  - createDebt: error de BD lanza excepción
 *  - getDebtById: busca deuda por ID
 *  - getLatestPendingDebtByReader: busca última deuda PENDING del lector
 */

const DebtRepository = require('../../../src/repositories/debtRepository');

describe('DebtRepository — HU-04 related queries', () => {
  let pool;
  let repo;

  beforeEach(() => {
    pool = { query: jest.fn() };
    repo = new DebtRepository(pool);
  });

  // ═══════════════════════════════════════════════════════════════
  // createDebt
  // ═══════════════════════════════════════════════════════════════
  describe('createDebt', () => {
    const debtData = {
      loan_id: 'L-4001',
      type_id_reader: 'CI',
      id_reader: 'R-2201',
      name_reader: 'Lector Tardío',
      units_fib: 1,
      amount_debt: 2.00,
    };

    test('inserts debt record with PENDING state and returns created row', async () => {
      const createdRow = {
        id_debt: 'D-001',
        ...debtData,
        state_debt: 'PENDING',
        created_at: '2026-04-11T00:00:00.000Z',
        updated_at: '2026-04-11T00:00:00.000Z',
      };
      pool.query.mockResolvedValue({ rows: [createdRow] });

      const result = await repo.createDebt(debtData);

      expect(result).toEqual(createdRow);
      expect(result.state_debt).toBe('PENDING');
      expect(pool.query).toHaveBeenCalledTimes(1);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO debt_reader');
      expect(sql).toContain("'PENDING'");
      expect(params).toEqual([
        debtData.loan_id,
        debtData.type_id_reader,
        debtData.id_reader,
        debtData.name_reader,
        debtData.units_fib,
        debtData.amount_debt,
      ]);
    });

    test('passes all traceability fields to the insert query', async () => {
      pool.query.mockResolvedValue({ rows: [{ id_debt: 'D-002', ...debtData, state_debt: 'PENDING' }] });

      await repo.createDebt(debtData);

      const [, params] = pool.query.mock.calls[0];
      expect(params[0]).toBe('L-4001');    // loan_id
      expect(params[1]).toBe('CI');         // type_id_reader
      expect(params[2]).toBe('R-2201');     // id_reader
      expect(params[3]).toBe('Lector Tardío'); // name_reader
      expect(params[4]).toBe(1);            // units_fib
      expect(params[5]).toBe(2.00);         // amount_debt
    });

    test('throws error when database insert fails', async () => {
      pool.query.mockRejectedValue(new Error('Unique constraint violation'));

      await expect(repo.createDebt(debtData)).rejects.toThrow('Error creating debt');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getDebtById
  // ═══════════════════════════════════════════════════════════════
  describe('getDebtById', () => {
    test('returns debt record when found by id_debt', async () => {
      const row = {
        id_debt: 'D-001',
        loan_id: 'L-4001',
        id_reader: 'R-2201',
        state_debt: 'PENDING',
        amount_debt: 2.00,
      };
      pool.query.mockResolvedValue({ rows: [row] });

      const result = await repo.getDebtById('D-001');

      expect(result).toEqual(row);
      expect(pool.query.mock.calls[0][1]).toEqual(['D-001']);
    });

    test('returns null when debt not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await repo.getDebtById('D-999');

      expect(result).toBeNull();
    });

    test('throws error when query fails', async () => {
      pool.query.mockRejectedValue(new Error('Connection lost'));

      await expect(repo.getDebtById('D-001')).rejects.toThrow('Error getting debt by ID');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getLatestPendingDebtByReader
  // ═══════════════════════════════════════════════════════════════
  describe('getLatestPendingDebtByReader', () => {
    test('returns latest PENDING debt for reader', async () => {
      const row = {
        id_debt: 'D-001',
        loan_id: 'L-4001',
        id_reader: 'R-2201',
        state_debt: 'PENDING',
        amount_debt: 2.00,
      };
      pool.query.mockResolvedValue({ rows: [row] });

      const result = await repo.getLatestPendingDebtByReader('R-2201');

      expect(result).toEqual(row);
      expect(result.state_debt).toBe('PENDING');
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("state_debt = 'PENDING'");
      expect(params).toEqual(['R-2201']);
    });

    test('returns null when reader has no pending debts', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await repo.getLatestPendingDebtByReader('R-9999');

      expect(result).toBeNull();
    });

    test('throws error when query fails', async () => {
      pool.query.mockRejectedValue(new Error('Timeout'));

      await expect(repo.getLatestPendingDebtByReader('R-2201')).rejects.toThrow(
        'Error getting debt by reader'
      );
    });
  });
});
