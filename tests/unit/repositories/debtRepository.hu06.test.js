/**
 * Unit Tests — DebtRepository (HU-06 specific methods)
 * HU-06: Registrar pago total de multa y rehabilitar lector
 *
 * Cobertura:
 *  - markDebtAsPaid: actualiza state_debt=PAID y retorna fila actualizada
 *  - markDebtAsPaid: error de BD lanza excepción
 *  - getAllPendingDebtsByReader: retorna lista de deudas PENDING
 *  - getAllPendingDebtsByReader: retorna array vacío si no hay deudas
 *  - getDebtByReaderWithFilters: filtra por id_reader, typeId, name_reader
 *
 * Datos base (TEST_CASES.md → Datos base sugeridos HU-06):
 *  - DEBT-PENDING-01: id_debt=D-6001, state_debt=PENDING
 *  - DEBT-PAID-01:    id_debt=D-6002, state_debt=PAID
 */

const DebtRepository = require('../../../src/repositories/debtRepository');

describe('DebtRepository — HU-06 methods', () => {
  let pool;
  let repo;

  beforeEach(() => {
    pool = { query: jest.fn() };
    repo = new DebtRepository(pool);
  });

  // ═══════════════════════════════════════════════════════════════
  // markDebtAsPaid
  // ═══════════════════════════════════════════════════════════════
  describe('markDebtAsPaid', () => {
    const paidRow = {
      id_debt: 'D-6001',
      loan_id: 'L-6001',
      type_id_reader: 'CI',
      id_reader: 'R-2301',
      name_reader: 'María León',
      amount_debt: 14.00,
      state_debt: 'PAID',
      updated_at: '2026-03-25T00:00:00.000Z',
    };

    test('updates debt to PAID and returns the updated row', async () => {
      pool.query.mockResolvedValue({ rows: [paidRow] });

      const result = await repo.markDebtAsPaid('D-6001');

      expect(result).toEqual(paidRow);
      expect(result.state_debt).toBe('PAID');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    test('sends UPDATE query with correct id_debt parameter', async () => {
      pool.query.mockResolvedValue({ rows: [paidRow] });

      await repo.markDebtAsPaid('D-6001');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('UPDATE debt_reader');
      expect(sql).toContain("state_debt = 'PAID'");
      expect(params).toEqual(['D-6001']);
    });

    test('throws error when database update fails', async () => {
      pool.query.mockRejectedValue(new Error('Connection refused'));

      await expect(repo.markDebtAsPaid('D-6001')).rejects.toThrow(
        'Error marking debt as paid'
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getAllPendingDebtsByReader
  // ═══════════════════════════════════════════════════════════════
  describe('getAllPendingDebtsByReader', () => {
    test('returns array of PENDING debts for reader', async () => {
      const rows = [
        { id_debt: 'D-6001', id_reader: 'R-2301', state_debt: 'PENDING', amount_debt: 14.00 },
        { id_debt: 'D-6003', id_reader: 'R-2301', state_debt: 'PENDING', amount_debt: 4.00 },
      ];
      pool.query.mockResolvedValue({ rows });

      const result = await repo.getAllPendingDebtsByReader('R-2301');

      expect(result).toHaveLength(2);
      expect(result[0].state_debt).toBe('PENDING');
      expect(result[1].state_debt).toBe('PENDING');
    });

    test('returns empty array when reader has no pending debts', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await repo.getAllPendingDebtsByReader('R-9999');

      expect(result).toEqual([]);
    });

    test('filters only PENDING debts in query', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await repo.getAllPendingDebtsByReader('R-2301');

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("state_debt = 'PENDING'");
      expect(params).toEqual(['R-2301']);
    });

    test('throws error when query fails', async () => {
      pool.query.mockRejectedValue(new Error('Timeout'));

      await expect(repo.getAllPendingDebtsByReader('R-2301')).rejects.toThrow(
        'Error getting all debts by reader'
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getDebtByReaderWithFilters
  // ═══════════════════════════════════════════════════════════════
  describe('getDebtByReaderWithFilters', () => {
    const debtRow = {
      id_debt: 'D-6001',
      loan_id: 'L-6001',
      type_id_reader: 'CI',
      id_reader: 'R-2301',
      name_reader: 'María León',
      amount_debt: 14.00,
      state_debt: 'PENDING',
    };

    test('returns latest PENDING debt for reader filtered by id_reader only', async () => {
      pool.query.mockResolvedValue({ rows: [debtRow] });

      const result = await repo.getDebtByReaderWithFilters({ id_reader: 'R-2301' });

      expect(result).toEqual(debtRow);
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("state_debt = 'PENDING'");
      expect(sql).toContain('id_reader');
      expect(params).toContain('R-2301');
    });

    test('includes typeId in filter when provided', async () => {
      pool.query.mockResolvedValue({ rows: [debtRow] });

      await repo.getDebtByReaderWithFilters({ id_reader: 'R-2301', typeId: 'CI' });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('type_id_reader');
      expect(params).toContain('CI');
    });

    test('includes name_reader in filter when provided', async () => {
      pool.query.mockResolvedValue({ rows: [debtRow] });

      await repo.getDebtByReaderWithFilters({
        id_reader: 'R-2301',
        name_reader: 'María León',
      });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('name_reader');
      expect(params).toContain('María León');
    });

    test('returns null when no debt found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await repo.getDebtByReaderWithFilters({ id_reader: 'R-9999' });

      expect(result).toBeNull();
    });

    test('throws error when query fails', async () => {
      pool.query.mockRejectedValue(new Error('DB error'));

      await expect(
        repo.getDebtByReaderWithFilters({ id_reader: 'R-2301' })
      ).rejects.toThrow('Error getting debt by reader with filters');
    });
  });
});
