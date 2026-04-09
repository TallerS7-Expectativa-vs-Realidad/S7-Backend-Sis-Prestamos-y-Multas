/**
 * Unit Tests — LoanService (returnLoan — late return + debt creation)
 * HU-04: Registrar devolución tardía y generar multa Fibonacci
 *
 * Alineado con TEST_CASES.md:
 *  - TC-HU04-01: 1 día mora → RETURNED, days_late=1, units_fib=1, amount_debt=2.00, PENDING
 *  - TC-HU04-02: 7 días mora → RETURNED, days_late=7, units_fib=1, amount_debt=2.00
 *  - TC-HU04-03: 8 días mora → RETURNED, days_late=8, units_fib=2, amount_debt=4.00
 *  - TC-HU04-04: 15 días mora → RETURNED, days_late=15, units_fib=4, amount_debt=8.00
 *  - TC-HU04-05: 22 días mora → RETURNED, days_late=22, units_fib=7, amount_debt=14.00
 *
 * Datos base (TEST_CASES.md → Datos base sugeridos HU-04):
 *  - LOAN-LATE-01D-01: loan_id=L-4001, id_book=B-1201, id_reader=R-2201, CI, ON_LOAN, date_limit=2026-04-10
 *  - LOAN-LATE-07D-01: loan_id=L-4002, id_book=B-1202, id_reader=R-2202, DNI, ON_LOAN, date_limit=2026-04-10
 *  - LOAN-LATE-08D-01: loan_id=L-4003, id_book=B-1203, id_reader=R-2203, CI, ON_LOAN, date_limit=2026-04-10
 *  - LOAN-LATE-15D-01: loan_id=L-4004, id_book=B-1204, id_reader=R-2204, CC, ON_LOAN, date_limit=2026-04-10
 *  - LOAN-LATE-22D-01: loan_id=L-4005, id_book=B-1205, id_reader=R-2205, TI, ON_LOAN, date_limit=2026-04-10
 */

const LoanService = require('../../../src/services/loanService');

// ══════════════════════════════════════════════════════════════════
// Datos base (TEST_CASES.md → Datos base sugeridos HU-04)
// ══════════════════════════════════════════════════════════════════
const makeLoan = (overrides) => ({
  loan_id: 'L-4001',
  id_book: 'B-1201',
  title: 'Libro de prueba tardío',
  type_id_reader: 'CI',
  id_reader: 'R-2201',
  name_reader: 'Lector Tardío',
  state: 'ON_LOAN',
  date_limit: '2026-04-10',
  date_return: null,
  loan_days: 7,
  ...overrides,
});

const LOAN_LATE_01D = makeLoan({ loan_id: 'L-4001', id_book: 'B-1201', id_reader: 'R-2201', type_id_reader: 'CI' });
const LOAN_LATE_07D = makeLoan({ loan_id: 'L-4002', id_book: 'B-1202', id_reader: 'R-2202', type_id_reader: 'DNI' });
const LOAN_LATE_08D = makeLoan({ loan_id: 'L-4003', id_book: 'B-1203', id_reader: 'R-2203', type_id_reader: 'CI' });
const LOAN_LATE_15D = makeLoan({ loan_id: 'L-4004', id_book: 'B-1204', id_reader: 'R-2204', type_id_reader: 'CC' });
const LOAN_LATE_22D = makeLoan({ loan_id: 'L-4005', id_book: 'B-1205', id_reader: 'R-2205', type_id_reader: 'TI' });

/**
 * Build mock debt record matching what debtService.createDebt would return
 */
const makeDebtRecord = (loan, units_fib, amount_debt) => ({
  id_debt: `D-${loan.loan_id}`,
  loan_id: loan.loan_id,
  type_id_reader: loan.type_id_reader,
  id_reader: loan.id_reader,
  name_reader: loan.name_reader,
  units_fib,
  amount_debt,
  state_debt: 'PENDING',
});

describe('LoanService — returnLoan late return (HU-04)', () => {
  let loanRepository;
  let debtService;
  let service;

  beforeEach(() => {
    loanRepository = {
      getActiveLoanByBook: jest.fn(),
      getActiveLoanByReader: jest.fn(),
      getActiveLoanByBookAndReader: jest.fn(),
      getLatestLoanByBook: jest.fn(),
      getLatestLoanByReader: jest.fn(),
      getLatestLoanByBookAndReader: jest.fn(),
      updateReturn: jest.fn(),
    };
    debtService = {
      calculateFibUnits: jest.fn(),
      createDebt: jest.fn(),
      getLatestPendingDebtByReader: jest.fn(),
    };
    service = new LoanService(loanRepository, debtService);
  });

  /**
   * Helper to arrange mocks for a late return scenario
   */
  function arrangeLateReturn(loan, dateReturn, units_fib, amount_debt) {
    const updatedLoan = { ...loan, state: 'RETURNED', date_return: dateReturn };
    const debtRecord = makeDebtRecord(loan, units_fib, amount_debt);

    loanRepository.getActiveLoanByBookAndReader.mockResolvedValue(loan);
    loanRepository.getLatestLoanByBookAndReader.mockResolvedValue(loan);
    loanRepository.updateReturn.mockResolvedValue(updatedLoan);
    debtService.calculateFibUnits.mockReturnValue({ units_fib, amount_debt });
    debtService.createDebt.mockResolvedValue(debtRecord);

    return { updatedLoan, debtRecord };
  }

  // ─── TC-HU04-01: 1 día de mora ────────────────────────────────
  test('TC-HU04-01 — 1 day late: RETURNED, days_late=1, units_fib=1, amount_debt=2.00, debt PENDING', async () => {
    const { debtRecord } = arrangeLateReturn(LOAN_LATE_01D, '2026-04-11', 1, 2.00);

    const result = await service.returnLoan({
      id_book: 'B-1201',
      id_reader: 'R-2201',
      type_id_reader: 'CI',
      date_return: '2026-04-11',
      base_fib_amount: 2.00,
    });

    expect(result.loan.state).toBe('RETURNED');
    expect(result.days_late).toBe(1);
    expect(result.debt).toEqual(debtRecord);
    expect(result.debt.units_fib).toBe(1);
    expect(result.debt.amount_debt).toBe(2.00);
    expect(result.debt.state_debt).toBe('PENDING');

    expect(debtService.calculateFibUnits).toHaveBeenCalledWith(1, 2.00);
    expect(debtService.createDebt).toHaveBeenCalledWith({
      loan_id: 'L-4001',
      type_id_reader: 'CI',
      id_reader: 'R-2201',
      name_reader: 'Lector Tardío',
      units_fib: 1,
      amount_debt: 2.00,
    });
  });

  // ─── TC-HU04-02: 7 días de mora (borde semana 1) ──────────────
  test('TC-HU04-02 — 7 days late: stays in week 1, units_fib=1, amount_debt=2.00', async () => {
    const { debtRecord } = arrangeLateReturn(LOAN_LATE_07D, '2026-04-17', 1, 2.00);

    const result = await service.returnLoan({
      id_book: 'B-1202',
      id_reader: 'R-2202',
      type_id_reader: 'DNI',
      date_return: '2026-04-17',
      base_fib_amount: 2.00,
    });

    expect(result.days_late).toBe(7);
    expect(result.debt.units_fib).toBe(1);
    expect(result.debt.amount_debt).toBe(2.00);
    expect(debtService.calculateFibUnits).toHaveBeenCalledWith(7, 2.00);
  });

  // ─── TC-HU04-03: 8 días de mora (cambio a semana 2) ───────────
  test('TC-HU04-03 — 8 days late: enters week 2, units_fib=2, amount_debt=4.00', async () => {
    const { debtRecord } = arrangeLateReturn(LOAN_LATE_08D, '2026-04-18', 2, 4.00);

    const result = await service.returnLoan({
      id_book: 'B-1203',
      id_reader: 'R-2203',
      type_id_reader: 'CI',
      date_return: '2026-04-18',
      base_fib_amount: 2.00,
    });

    expect(result.days_late).toBe(8);
    expect(result.debt.units_fib).toBe(2);
    expect(result.debt.amount_debt).toBe(4.00);
    expect(debtService.calculateFibUnits).toHaveBeenCalledWith(8, 2.00);
  });

  // ─── TC-HU04-04: 15 días de mora (semana 3) ───────────────────
  test('TC-HU04-04 — 15 days late: enters week 3, units_fib=4, amount_debt=8.00', async () => {
    const { debtRecord } = arrangeLateReturn(LOAN_LATE_15D, '2026-04-25', 4, 8.00);

    const result = await service.returnLoan({
      id_book: 'B-1204',
      id_reader: 'R-2204',
      type_id_reader: 'CC',
      date_return: '2026-04-25',
      base_fib_amount: 2.00,
    });

    expect(result.days_late).toBe(15);
    expect(result.debt.units_fib).toBe(4);
    expect(result.debt.amount_debt).toBe(8.00);
    expect(debtService.calculateFibUnits).toHaveBeenCalledWith(15, 2.00);
  });

  // ─── TC-HU04-05: 22 días de mora (semana 4) ───────────────────
  test('TC-HU04-05 — 22 days late: enters week 4, units_fib=7, amount_debt=14.00', async () => {
    const { debtRecord } = arrangeLateReturn(LOAN_LATE_22D, '2026-05-02', 7, 14.00);

    const result = await service.returnLoan({
      id_book: 'B-1205',
      id_reader: 'R-2205',
      type_id_reader: 'TI',
      date_return: '2026-05-02',
      base_fib_amount: 2.00,
    });

    expect(result.days_late).toBe(22);
    expect(result.debt.units_fib).toBe(7);
    expect(result.debt.amount_debt).toBe(14.00);
    expect(debtService.calculateFibUnits).toHaveBeenCalledWith(22, 2.00);
  });

  // ─── base_fib_amount omitido → pasa undefined al debtService ──
  test('passes undefined base_fib_amount to calculateFibUnits when not provided in payload', async () => {
    arrangeLateReturn(LOAN_LATE_01D, '2026-04-11', 1, 2.00);

    await service.returnLoan({
      id_book: 'B-1201',
      id_reader: 'R-2201',
      type_id_reader: 'CI',
      date_return: '2026-04-11',
    });

    expect(debtService.calculateFibUnits).toHaveBeenCalledWith(1, undefined);
  });

  // ─── Trazabilidad: debt record contiene loan_id, id_reader, name_reader ─
  test('debt record includes correct traceability fields (loan_id, id_reader, name_reader)', async () => {
    arrangeLateReturn(LOAN_LATE_01D, '2026-04-11', 1, 2.00);

    await service.returnLoan({
      id_book: 'B-1201',
      id_reader: 'R-2201',
      type_id_reader: 'CI',
      date_return: '2026-04-11',
      base_fib_amount: 2.00,
    });

    expect(debtService.createDebt).toHaveBeenCalledWith(
      expect.objectContaining({
        loan_id: 'L-4001',
        id_reader: 'R-2201',
        name_reader: 'Lector Tardío',
        type_id_reader: 'CI',
      })
    );
  });

  // ─── DEBT_CREATION_ERROR cuando createDebt falla ──────────────
  test('throws DEBT_CREATION_ERROR (500) when createDebt fails', async () => {
    loanRepository.getActiveLoanByBookAndReader.mockResolvedValue(LOAN_LATE_01D);
    loanRepository.getLatestLoanByBookAndReader.mockResolvedValue(LOAN_LATE_01D);
    loanRepository.updateReturn.mockResolvedValue({ ...LOAN_LATE_01D, state: 'RETURNED', date_return: '2026-04-11' });
    debtService.calculateFibUnits.mockReturnValue({ units_fib: 1, amount_debt: 2.00 });
    debtService.createDebt.mockRejectedValue(new Error('DB write failed'));

    await expect(
      service.returnLoan({
        id_book: 'B-1201',
        id_reader: 'R-2201',
        type_id_reader: 'CI',
        date_return: '2026-04-11',
        base_fib_amount: 2.00,
      })
    ).rejects.toMatchObject({
      code: 'DEBT_CREATION_ERROR',
      statusCode: 500,
    });
  });

  // ─── No crea deuda cuando la devolución es a tiempo ───────────
  test('does NOT create debt when return is on time (days_late=0)', async () => {
    const onTimeLoan = makeLoan({ date_limit: '2026-04-10' });
    const updatedLoan = { ...onTimeLoan, state: 'RETURNED', date_return: '2026-04-10' };

    loanRepository.getActiveLoanByBookAndReader.mockResolvedValue(onTimeLoan);
    loanRepository.getLatestLoanByBookAndReader.mockResolvedValue(onTimeLoan);
    loanRepository.updateReturn.mockResolvedValue(updatedLoan);

    const result = await service.returnLoan({
      id_book: 'B-1201',
      id_reader: 'R-2201',
      type_id_reader: 'CI',
      date_return: '2026-04-10',
    });

    expect(result.days_late).toBe(0);
    expect(result.debt).toBeNull();
    expect(debtService.calculateFibUnits).not.toHaveBeenCalled();
    expect(debtService.createDebt).not.toHaveBeenCalled();
  });
});
