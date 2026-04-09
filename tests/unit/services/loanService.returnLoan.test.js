/**
 * Unit Tests — LoanService (returnLoan)
 * HU-03: Registrar devolución de un libro dentro del plazo
 *
 * Alineado con TEST_CASES.md:
 *  - TC-HU03-01: Devolución antes de date_limit → RETURNED, days_late=0, sin deuda
 *  - TC-HU03-02: Devolución en fecha exacta de date_limit → RETURNED, days_late=0, sin deuda
 *  - TC-HU03-03: No existe préstamo activo → LOAN_NOT_FOUND (404)
 *  - TC-HU03-04: Préstamo ya devuelto → ALREADY_RETURNED (409)
 *
 * Datos base (TEST_CASES.md → Datos base sugeridos HU-03):
 *  - LOAN-ACTIVE-EARLY-01:       loan_id=L-3001, id_book=B-1101, id_reader=R-2101, CI, ON_LOAN, date_limit=2026-04-10
 *  - LOAN-ACTIVE-ON-LIMIT-01:    loan_id=L-3002, id_book=B-1102, id_reader=R-2102, DNI, ON_LOAN, date_limit=2026-04-10
 *  - BOOK-WITHOUT-ACTIVE-LOAN-01: id_book=B-1103, id_reader=R-2103, sin fila ON_LOAN
 *  - LOAN-ALREADY-RETURNED-01:   loan_id=L-3004, id_book=B-1104, id_reader=R-2104, RETURNED
 */

const LoanService = require('../../../src/services/loanService');

// ══════════════════════════════════════════════════════════════════
// Datos base (TEST_CASES.md → Datos base sugeridos HU-03)
// ══════════════════════════════════════════════════════════════════
const LOAN_ACTIVE_EARLY_01 = {
  loan_id: 'L-3001',
  id_book: 'B-1101',
  title: 'Libro de prueba 1',
  type_id_reader: 'CI',
  id_reader: 'R-2101',
  name_reader: 'Lector Uno',
  state: 'ON_LOAN',
  date_limit: '2026-04-10',
  date_return: null,
  loan_days: 7,
};

const LOAN_ACTIVE_ON_LIMIT_01 = {
  loan_id: 'L-3002',
  id_book: 'B-1102',
  title: 'Libro de prueba 2',
  type_id_reader: 'DNI',
  id_reader: 'R-2102',
  name_reader: 'Lector Dos',
  state: 'ON_LOAN',
  date_limit: '2026-04-10',
  date_return: null,
  loan_days: 14,
};

const LOAN_ALREADY_RETURNED_01 = {
  loan_id: 'L-3004',
  id_book: 'B-1104',
  title: 'Libro de prueba 4',
  type_id_reader: 'CI',
  id_reader: 'R-2104',
  name_reader: 'Lector Cuatro',
  state: 'RETURNED',
  date_limit: '2026-04-05',
  date_return: '2026-04-04',
  loan_days: 7,
};

describe('LoanService — returnLoan (HU-03)', () => {
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
    };
    service = new LoanService(loanRepository, debtService);
  });

  // ─── TC-HU03-01: Devolución antes de date_limit ────────────────
  test('TC-HU03-01 — returns loan with RETURNED state, days_late=0, no debt when returned before date_limit', async () => {
    const updatedLoan = { ...LOAN_ACTIVE_EARLY_01, state: 'RETURNED', date_return: '2026-04-08' };

    loanRepository.getActiveLoanByBookAndReader.mockResolvedValue(LOAN_ACTIVE_EARLY_01);
    loanRepository.getLatestLoanByBookAndReader.mockResolvedValue(LOAN_ACTIVE_EARLY_01);
    loanRepository.updateReturn.mockResolvedValue(updatedLoan);

    const result = await service.returnLoan({
      id_book: 'B-1101',
      id_reader: 'R-2101',
      type_id_reader: 'CI',
      date_return: '2026-04-08',
    });

    expect(result.loan.state).toBe('RETURNED');
    expect(result.loan.date_return).toBe('2026-04-08');
    expect(result.days_late).toBe(0);
    expect(result.debt).toBeNull();
    expect(loanRepository.updateReturn).toHaveBeenCalledWith('L-3001', '2026-04-08');
    expect(debtService.createDebt).not.toHaveBeenCalled();
  });

  // ─── TC-HU03-02: Devolución en fecha exacta de date_limit ─────
  test('TC-HU03-02 — returns loan with RETURNED state, days_late=0, no debt when returned on exact date_limit', async () => {
    const updatedLoan = { ...LOAN_ACTIVE_ON_LIMIT_01, state: 'RETURNED', date_return: '2026-04-10' };

    loanRepository.getActiveLoanByBookAndReader.mockResolvedValue(LOAN_ACTIVE_ON_LIMIT_01);
    loanRepository.getLatestLoanByBookAndReader.mockResolvedValue(LOAN_ACTIVE_ON_LIMIT_01);
    loanRepository.updateReturn.mockResolvedValue(updatedLoan);

    const result = await service.returnLoan({
      id_book: 'B-1102',
      id_reader: 'R-2102',
      type_id_reader: 'DNI',
      date_return: '2026-04-10',
    });

    expect(result.loan.state).toBe('RETURNED');
    expect(result.loan.date_return).toBe('2026-04-10');
    expect(result.days_late).toBe(0);
    expect(result.debt).toBeNull();
    expect(loanRepository.updateReturn).toHaveBeenCalledWith('L-3002', '2026-04-10');
    expect(debtService.createDebt).not.toHaveBeenCalled();
  });

  // ─── TC-HU03-03: No existe préstamo activo → LOAN_NOT_FOUND ───
  test('TC-HU03-03 — throws LOAN_NOT_FOUND (404) when no active loan exists', async () => {
    loanRepository.getActiveLoanByBookAndReader.mockResolvedValue(null);
    loanRepository.getLatestLoanByBookAndReader.mockResolvedValue(null);

    await expect(
      service.returnLoan({
        id_book: 'B-1103',
        id_reader: 'R-2103',
        type_id_reader: 'CI',
        date_return: '2026-04-10',
      })
    ).rejects.toMatchObject({
      code: 'LOAN_NOT_FOUND',
      statusCode: 404,
    });

    expect(loanRepository.updateReturn).not.toHaveBeenCalled();
    expect(debtService.createDebt).not.toHaveBeenCalled();
  });

  // ─── TC-HU03-04: Préstamo ya devuelto → ALREADY_RETURNED ──────
  test('TC-HU03-04 — throws ALREADY_RETURNED (409) when loan is already returned', async () => {
    loanRepository.getActiveLoanByBookAndReader.mockResolvedValue(null);
    loanRepository.getLatestLoanByBookAndReader.mockResolvedValue(LOAN_ALREADY_RETURNED_01);

    await expect(
      service.returnLoan({
        id_book: 'B-1104',
        id_reader: 'R-2104',
        type_id_reader: 'CI',
        date_return: '2026-04-11',
      })
    ).rejects.toMatchObject({
      code: 'ALREADY_RETURNED',
      statusCode: 409,
    });

    expect(loanRepository.updateReturn).not.toHaveBeenCalled();
    expect(debtService.createDebt).not.toHaveBeenCalled();
  });

  // ─── Búsqueda solo por id_book ─────────────────────────────────
  test('TC-HU03-01 variant — searches by id_book only when id_reader is not provided', async () => {
    const updatedLoan = { ...LOAN_ACTIVE_EARLY_01, state: 'RETURNED', date_return: '2026-04-08' };

    loanRepository.getActiveLoanByBook.mockResolvedValue(LOAN_ACTIVE_EARLY_01);
    loanRepository.getLatestLoanByBook.mockResolvedValue(LOAN_ACTIVE_EARLY_01);
    loanRepository.updateReturn.mockResolvedValue(updatedLoan);

    const result = await service.returnLoan({
      id_book: 'B-1101',
      type_id_reader: 'CI',
      date_return: '2026-04-08',
    });

    expect(result.loan.state).toBe('RETURNED');
    expect(result.days_late).toBe(0);
    expect(result.debt).toBeNull();
    expect(loanRepository.getActiveLoanByBook).toHaveBeenCalledWith('B-1101');
    expect(loanRepository.getActiveLoanByBookAndReader).not.toHaveBeenCalled();
  });

  // ─── Búsqueda solo por id_reader ───────────────────────────────
  test('TC-HU03-01 variant — searches by id_reader only when id_book is not provided', async () => {
    const updatedLoan = { ...LOAN_ACTIVE_EARLY_01, state: 'RETURNED', date_return: '2026-04-08' };

    loanRepository.getActiveLoanByReader.mockResolvedValue(LOAN_ACTIVE_EARLY_01);
    loanRepository.getLatestLoanByReader.mockResolvedValue(LOAN_ACTIVE_EARLY_01);
    loanRepository.updateReturn.mockResolvedValue(updatedLoan);

    const result = await service.returnLoan({
      id_reader: 'R-2101',
      type_id_reader: 'CI',
      date_return: '2026-04-08',
    });

    expect(result.loan.state).toBe('RETURNED');
    expect(result.days_late).toBe(0);
    expect(result.debt).toBeNull();
    expect(loanRepository.getActiveLoanByReader).toHaveBeenCalledWith('R-2101');
    expect(loanRepository.getActiveLoanByBookAndReader).not.toHaveBeenCalled();
  });

  // ─── SEARCH_ERROR → 500 si repo falla en búsqueda ─────────────
  test('throws SEARCH_ERROR (500) when repository search fails', async () => {
    loanRepository.getActiveLoanByBookAndReader.mockRejectedValue(new Error('DB connection error'));

    await expect(
      service.returnLoan({
        id_book: 'B-1101',
        id_reader: 'R-2101',
        type_id_reader: 'CI',
        date_return: '2026-04-08',
      })
    ).rejects.toMatchObject({
      code: 'SEARCH_ERROR',
      statusCode: 500,
    });
  });

  // ─── UPDATE_ERROR → 500 si repo falla al actualizar ───────────
  test('throws UPDATE_ERROR (500) when repository update fails', async () => {
    loanRepository.getActiveLoanByBookAndReader.mockResolvedValue(LOAN_ACTIVE_EARLY_01);
    loanRepository.getLatestLoanByBookAndReader.mockResolvedValue(LOAN_ACTIVE_EARLY_01);
    loanRepository.updateReturn.mockRejectedValue(new Error('DB write error'));

    await expect(
      service.returnLoan({
        id_book: 'B-1101',
        id_reader: 'R-2101',
        type_id_reader: 'CI',
        date_return: '2026-04-08',
      })
    ).rejects.toMatchObject({
      code: 'UPDATE_ERROR',
      statusCode: 500,
    });
  });
});
