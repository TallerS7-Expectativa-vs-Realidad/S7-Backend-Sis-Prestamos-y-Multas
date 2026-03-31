/**
 * Unit Tests — DebtService.payDebt
 * HU-06: Registrar pago total de multa y rehabilitar lector
 *
 * Alineado con TEST_CASES.md (Matriz HU-06):
 *  - TC-HU06-01: Pago total exitoso → state_debt=PAID
 *  - TC-HU06-02 Variante A: Deuda inexistente → 404 DEBT_NOT_FOUND
 *  - TC-HU06-02 Variante B: Deuda ya pagada → 409 DEBT_ALREADY_PAID
 *
 * Datos base (TEST_CASES.md → Datos base sugeridos HU-06):
 *  - DEBT-PENDING-01: id_debt=D-6001, state_debt=PENDING, amount_debt=14.00
 *  - DEBT-PAID-01:    id_debt=D-6002, state_debt=PAID, amount_debt=8.00
 *  - DEBT-NOT-FOUND-01: id_debt=999999, no existe en debt_reader
 */

const DebtService = require('../../../src/services/DebtService');

// ══════════════════════════════════════════════════════════════════
// Datos base
// ══════════════════════════════════════════════════════════════════
const DEBT_PENDING_01 = {
  id_debt: 'D-6001',
  loan_id: 'L-6001',
  type_id_reader: 'CI',
  id_reader: 'R-2301',
  name_reader: 'María León',
  amount_debt: 14.00,
  state_debt: 'PENDING',
  created_at: '2026-03-20T00:00:00.000Z',
  updated_at: '2026-03-20T00:00:00.000Z',
};

const DEBT_PAID_01 = {
  id_debt: 'D-6002',
  loan_id: 'L-6002',
  type_id_reader: 'DNI',
  id_reader: 'R-2302',
  name_reader: 'Luis Pardo',
  amount_debt: 8.00,
  state_debt: 'PAID',
  created_at: '2026-03-18T00:00:00.000Z',
  updated_at: '2026-03-22T00:00:00.000Z',
};

const DEBT_PENDING_01_AFTER_PAYMENT = {
  ...DEBT_PENDING_01,
  state_debt: 'PAID',
  updated_at: '2026-03-25T00:00:00.000Z',
};

describe('DebtService — payDebt (HU-06)', () => {
  let debtService;
  let mockDebtRepository;

  beforeEach(() => {
    mockDebtRepository = {
      getDebtById: jest.fn(),
      markDebtAsPaid: jest.fn(),
      getLatestPendingDebtByReader: jest.fn(),
      getAllPendingDebtsByReader: jest.fn(),
      createDebt: jest.fn(),
      getDebtByReaderWithFilters: jest.fn(),
    };
    debtService = new DebtService(mockDebtRepository);
  });

  // ═══════════════════════════════════════════════════════════════
  // TC-HU06-01: Pago total exitoso
  // ═══════════════════════════════════════════════════════════════
  describe('TC-HU06-01 — Successful full payment', () => {
    test('marks debt as PAID when debt exists and is PENDING', async () => {
      mockDebtRepository.getDebtById.mockResolvedValue(DEBT_PENDING_01);
      mockDebtRepository.markDebtAsPaid.mockResolvedValue(DEBT_PENDING_01_AFTER_PAYMENT);

      const result = await debtService.payDebt('D-6001');

      expect(result.state_debt).toBe('PAID');
      expect(result.id_debt).toBe('D-6001');
      expect(result.amount_debt).toBe(14.00);
    });

    test('calls getDebtById first to verify debt exists', async () => {
      mockDebtRepository.getDebtById.mockResolvedValue(DEBT_PENDING_01);
      mockDebtRepository.markDebtAsPaid.mockResolvedValue(DEBT_PENDING_01_AFTER_PAYMENT);

      await debtService.payDebt('D-6001');

      expect(mockDebtRepository.getDebtById).toHaveBeenCalledWith('D-6001');
      expect(mockDebtRepository.getDebtById).toHaveBeenCalledTimes(1);
    });

    test('calls markDebtAsPaid after successful validation', async () => {
      mockDebtRepository.getDebtById.mockResolvedValue(DEBT_PENDING_01);
      mockDebtRepository.markDebtAsPaid.mockResolvedValue(DEBT_PENDING_01_AFTER_PAYMENT);

      await debtService.payDebt('D-6001');

      expect(mockDebtRepository.markDebtAsPaid).toHaveBeenCalledWith('D-6001');
      expect(mockDebtRepository.markDebtAsPaid).toHaveBeenCalledTimes(1);
    });

    test('preserves amount_debt as historical value (no residual balance)', async () => {
      mockDebtRepository.getDebtById.mockResolvedValue(DEBT_PENDING_01);
      mockDebtRepository.markDebtAsPaid.mockResolvedValue(DEBT_PENDING_01_AFTER_PAYMENT);

      const result = await debtService.payDebt('D-6001');

      // amount_debt se conserva como valor histórico pagado
      expect(result.amount_debt).toBe(14.00);
      expect(result.state_debt).toBe('PAID');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TC-HU06-02 Variante A: Deuda inexistente → 404
  // ═══════════════════════════════════════════════════════════════
  describe('TC-HU06-02 Variante A — Debt not found', () => {
    test('throws 404 DEBT_NOT_FOUND when debt does not exist', async () => {
      mockDebtRepository.getDebtById.mockResolvedValue(null);

      await expect(debtService.payDebt(999999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'DEBT_NOT_FOUND',
      });
    });

    test('does not call markDebtAsPaid when debt is not found', async () => {
      mockDebtRepository.getDebtById.mockResolvedValue(null);

      try {
        await debtService.payDebt(999999);
      } catch (e) {
        // expected
      }

      expect(mockDebtRepository.markDebtAsPaid).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TC-HU06-02 Variante B: Deuda ya pagada → 409
  // ═══════════════════════════════════════════════════════════════
  describe('TC-HU06-02 Variante B — Debt already paid', () => {
    test('throws 409 DEBT_ALREADY_PAID when debt state is PAID', async () => {
      mockDebtRepository.getDebtById.mockResolvedValue(DEBT_PAID_01);

      await expect(debtService.payDebt('D-6002')).rejects.toMatchObject({
        statusCode: 409,
        code: 'DEBT_ALREADY_PAID',
      });
    });

    test('does not call markDebtAsPaid when debt is already paid', async () => {
      mockDebtRepository.getDebtById.mockResolvedValue(DEBT_PAID_01);

      try {
        await debtService.payDebt('D-6002');
      } catch (e) {
        // expected
      }

      expect(mockDebtRepository.markDebtAsPaid).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getDebtByReaderWithFilters — validation
  // ═══════════════════════════════════════════════════════════════
  describe('getDebtByReaderWithFilters — validation', () => {
    test('throws 400 INVALID_QUERY when id_reader is missing', async () => {
      await expect(debtService.getDebtByReaderWithFilters({})).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_QUERY',
      });
    });

    test('throws 404 DEBT_NOT_FOUND when no debt found for reader', async () => {
      mockDebtRepository.getDebtByReaderWithFilters.mockResolvedValue(null);

      await expect(
        debtService.getDebtByReaderWithFilters({ id_reader: 'R-9999' })
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'DEBT_NOT_FOUND',
      });
    });

    test('returns debt when found for reader', async () => {
      mockDebtRepository.getDebtByReaderWithFilters.mockResolvedValue(DEBT_PENDING_01);

      const result = await debtService.getDebtByReaderWithFilters({ id_reader: 'R-2301' });

      expect(result).toEqual(DEBT_PENDING_01);
      expect(mockDebtRepository.getDebtByReaderWithFilters).toHaveBeenCalledWith({
        id_reader: 'R-2301',
      });
    });
  });
});
