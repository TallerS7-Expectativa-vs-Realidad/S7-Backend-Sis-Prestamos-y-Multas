/**
 * Unit Tests — LoanService (createLoan)
 * HU-02: Registrar préstamo de un libro a un lector habilitado
 *
 * Alineado con TEST_CASES.md:
 *  - TC-HU02-01: Préstamo válido → loan creado con state=ON_LOAN, date_limit calculada
 *  - TC-HU02-02: Libro ya prestado → BOOK_NOT_AVAILABLE (409)
 *  - TC-HU02-03: Lector con deuda pendiente → READER_HAS_DEBT (409)
 *  - TC-HU02-04: Plazo no permitido → INVALID_LOAN_DAYS (400)
 *
 * Datos base (TEST_CASES.md → Datos base sugeridos HU-02):
 *  - BOOK-AVAILABLE-01: id_book=B-1001, title=Cien años de soledad
 *  - BOOK-ON-LOAN-01:   id_book=B-1002, title=1984, último estado ON_LOAN
 *  - BOOK-AVAILABLE-02: id_book=B-1003, title=El principito
 *  - BOOK-AVAILABLE-03: id_book=B-1004, title=Rayuela
 *  - READER-ENABLED-01: CI, R-2001, Ana Torres, sin deuda PENDING
 *  - READER-ENABLED-02: DNI, R-2002, Carlos Rojas, sin deuda PENDING
 *  - READER-BLOCKED-01: CI, R-2003, Laura Díaz, deuda más reciente PENDING
 */

const LoanService = require('../../../src/services/loanService');

// ══════════════════════════════════════════════════════════════════
// Datos base (TEST_CASES.md → Datos base sugeridos HU-02)
// ══════════════════════════════════════════════════════════════════
const BOOK_AVAILABLE_01 = {
  id_book: 'B-1001',
  title: 'Cien años de soledad',
};
const BOOK_ON_LOAN_01 = {
  id_book: 'B-1002',
  title: '1984',
};
const BOOK_AVAILABLE_02 = {
  id_book: 'B-1003',
  title: 'El principito',
};
const BOOK_AVAILABLE_03 = {
  id_book: 'B-1004',
  title: 'Rayuela',
};
const READER_ENABLED_01 = {
  type_id_reader: 'CI',
  id_reader: 'R-2001',
  name_reader: 'Ana Torres',
};
const READER_ENABLED_02 = {
  type_id_reader: 'DNI',
  id_reader: 'R-2002',
  name_reader: 'Carlos Rojas',
};
const READER_BLOCKED_01 = {
  type_id_reader: 'CI',
  id_reader: 'R-2003',
  name_reader: 'Laura Díaz',
};

describe('LoanService — createLoan (HU-02)', () => {
  let loanRepository;
  let debtService;
  let service;

  beforeEach(() => {
    loanRepository = {
      isBookAvailable: jest.fn(),
      insertLoan: jest.fn(),
      findByName: jest.fn(),
    };
    debtService = {
      getLatestPendingDebtByReader: jest.fn(),
    };
    service = new LoanService(loanRepository, debtService);
  });

  // ─── TC-HU02-01: Préstamo válido con loan_days=7 ──────────────
  test('TC-HU02-01 — creates loan successfully with loan_days=7, state=ON_LOAN and date_limit=today+7', async () => {
    loanRepository.isBookAvailable.mockResolvedValue(true);
    debtService.getLatestPendingDebtByReader.mockResolvedValue(null);

    const insertedLoan = {
      loan_id: 1,
      ...BOOK_AVAILABLE_01,
      ...READER_ENABLED_01,
      loan_days: 7,
      state: 'ON_LOAN',
      date_return: null,
      date_limit: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      created_at: new Date(),
      updated_at: new Date(),
    };
    loanRepository.insertLoan.mockResolvedValue(insertedLoan);

    const loanData = {
      ...BOOK_AVAILABLE_01,
      ...READER_ENABLED_01,
      loan_days: 7,
    };

    const result = await service.createLoan(loanData);

    // Verify book availability was checked
    expect(loanRepository.isBookAvailable).toHaveBeenCalledWith('B-1001');
    // Verify debt check for reader
    expect(debtService.getLatestPendingDebtByReader).toHaveBeenCalledWith('R-2001');
    // Verify loan was inserted with correct data
    expect(loanRepository.insertLoan).toHaveBeenCalledWith(
      expect.objectContaining({
        id_book: 'B-1001',
        title: 'Cien años de soledad',
        type_id_reader: 'CI',
        id_reader: 'R-2001',
        name_reader: 'Ana Torres',
        loan_days: 7,
        date_limit: expect.any(Date),
      })
    );
    // Verify result
    expect(result.state).toBe('ON_LOAN');
    expect(result.date_return).toBeNull();
    expect(result.loan_days).toBe(7);
  });

  // ─── TC-HU02-01 variante: Préstamo válido con loan_days=14 ────
  test('TC-HU02-01 — creates loan successfully with loan_days=14', async () => {
    loanRepository.isBookAvailable.mockResolvedValue(true);
    debtService.getLatestPendingDebtByReader.mockResolvedValue(null);

    const insertedLoan = {
      loan_id: 2,
      ...BOOK_AVAILABLE_01,
      ...READER_ENABLED_01,
      loan_days: 14,
      state: 'ON_LOAN',
      date_return: null,
      date_limit: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    };
    loanRepository.insertLoan.mockResolvedValue(insertedLoan);

    const result = await service.createLoan({
      ...BOOK_AVAILABLE_01,
      ...READER_ENABLED_01,
      loan_days: 14,
    });

    expect(loanRepository.insertLoan).toHaveBeenCalledWith(
      expect.objectContaining({ loan_days: 14 })
    );
    expect(result.state).toBe('ON_LOAN');
    expect(result.loan_days).toBe(14);
  });

  // ─── TC-HU02-01 variante: Préstamo válido con loan_days=21 ────
  test('TC-HU02-01 — creates loan successfully with loan_days=21', async () => {
    loanRepository.isBookAvailable.mockResolvedValue(true);
    debtService.getLatestPendingDebtByReader.mockResolvedValue(null);

    const insertedLoan = {
      loan_id: 3,
      ...BOOK_AVAILABLE_01,
      ...READER_ENABLED_01,
      loan_days: 21,
      state: 'ON_LOAN',
      date_return: null,
      date_limit: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    };
    loanRepository.insertLoan.mockResolvedValue(insertedLoan);

    const result = await service.createLoan({
      ...BOOK_AVAILABLE_01,
      ...READER_ENABLED_01,
      loan_days: 21,
    });

    expect(loanRepository.insertLoan).toHaveBeenCalledWith(
      expect.objectContaining({ loan_days: 21 })
    );
    expect(result.state).toBe('ON_LOAN');
    expect(result.loan_days).toBe(21);
  });

  // ─── TC-HU02-01: date_limit se calcula como today + loan_days ──
  test('TC-HU02-01 — date_limit is calculated as today + loan_days', async () => {
    loanRepository.isBookAvailable.mockResolvedValue(true);
    debtService.getLatestPendingDebtByReader.mockResolvedValue(null);
    loanRepository.insertLoan.mockImplementation(async (data) => ({
      loan_id: 10,
      ...data,
      state: 'ON_LOAN',
      date_return: null,
    }));

    const beforeCall = new Date();
    await service.createLoan({
      ...BOOK_AVAILABLE_01,
      ...READER_ENABLED_01,
      loan_days: 7,
    });
    const afterCall = new Date();

    const insertCalls = loanRepository.insertLoan.mock.calls[0][0];
    const dateLimit = new Date(insertCalls.date_limit);

    // date_limit should be between (beforeCall + 7 days) and (afterCall + 7 days)
    const minExpected = new Date(beforeCall);
    minExpected.setDate(minExpected.getDate() + 7);
    const maxExpected = new Date(afterCall);
    maxExpected.setDate(maxExpected.getDate() + 7);

    expect(dateLimit.getTime()).toBeGreaterThanOrEqual(minExpected.getTime() - 1000);
    expect(dateLimit.getTime()).toBeLessThanOrEqual(maxExpected.getTime() + 1000);
  });

  // ─── TC-HU02-02: Libro ya prestado → BOOK_NOT_AVAILABLE ───────
  test('TC-HU02-02 — rejects with BOOK_NOT_AVAILABLE (409) when book is on loan', async () => {
    loanRepository.isBookAvailable.mockResolvedValue(false);

    const loanData = {
      ...BOOK_ON_LOAN_01,
      ...READER_ENABLED_02,
      loan_days: 14,
    };

    await expect(service.createLoan(loanData)).rejects.toMatchObject({
      code: 'BOOK_NOT_AVAILABLE',
      statusCode: 409,
    });

    expect(loanRepository.isBookAvailable).toHaveBeenCalledWith('B-1002');
    // Should NOT check debt or insert loan
    expect(debtService.getLatestPendingDebtByReader).not.toHaveBeenCalled();
    expect(loanRepository.insertLoan).not.toHaveBeenCalled();
  });

  // ─── TC-HU02-03: Lector con deuda pendiente → READER_HAS_DEBT ─
  test('TC-HU02-03 — rejects with READER_HAS_DEBT (409) when reader has pending debt', async () => {
    loanRepository.isBookAvailable.mockResolvedValue(true);
    debtService.getLatestPendingDebtByReader.mockResolvedValue({
      id_debt: 'D-9999',
      id_reader: 'R-2003',
      state_debt: 'PENDING',
      amount_debt: 14.00,
    });

    const loanData = {
      ...BOOK_AVAILABLE_02,
      ...READER_BLOCKED_01,
      loan_days: 21,
    };

    await expect(service.createLoan(loanData)).rejects.toMatchObject({
      code: 'READER_HAS_DEBT',
      statusCode: 409,
    });

    expect(loanRepository.isBookAvailable).toHaveBeenCalledWith('B-1003');
    expect(debtService.getLatestPendingDebtByReader).toHaveBeenCalledWith('R-2003');
    // Should NOT insert loan
    expect(loanRepository.insertLoan).not.toHaveBeenCalled();
  });

  // ─── TC-HU02-04: Plazo no permitido → INVALID_LOAN_DAYS ───────
  test('TC-HU02-04 — rejects with INVALID_LOAN_DAYS (400) when loan_days=10', async () => {
    const loanData = {
      ...BOOK_AVAILABLE_03,
      ...READER_ENABLED_01,
      loan_days: 10,
    };

    await expect(service.createLoan(loanData)).rejects.toMatchObject({
      code: 'INVALID_LOAN_DAYS',
      statusCode: 400,
    });

    // Should NOT check availability, debt, or insert
    expect(loanRepository.isBookAvailable).not.toHaveBeenCalled();
    expect(debtService.getLatestPendingDebtByReader).not.toHaveBeenCalled();
    expect(loanRepository.insertLoan).not.toHaveBeenCalled();
  });

  // ─── Variante: loan_days=0 → INVALID_LOAN_DAYS ────────────────
  test('rejects with INVALID_LOAN_DAYS for loan_days=0', async () => {
    await expect(
      service.createLoan({
        ...BOOK_AVAILABLE_01,
        ...READER_ENABLED_01,
        loan_days: 0,
      })
    ).rejects.toMatchObject({
      code: 'INVALID_LOAN_DAYS',
      statusCode: 400,
    });
    expect(loanRepository.insertLoan).not.toHaveBeenCalled();
  });

  // ─── Variante: loan_days negativo → INVALID_LOAN_DAYS ─────────
  test('rejects with INVALID_LOAN_DAYS for negative loan_days', async () => {
    await expect(
      service.createLoan({
        ...BOOK_AVAILABLE_01,
        ...READER_ENABLED_01,
        loan_days: -7,
      })
    ).rejects.toMatchObject({
      code: 'INVALID_LOAN_DAYS',
      statusCode: 400,
    });
    expect(loanRepository.insertLoan).not.toHaveBeenCalled();
  });

  // ─── Variante: loan_days como string "7" (coerción) ────────────
  test('accepts loan_days as string "7" via Number coercion', async () => {
    loanRepository.isBookAvailable.mockResolvedValue(true);
    debtService.getLatestPendingDebtByReader.mockResolvedValue(null);
    loanRepository.insertLoan.mockResolvedValue({
      loan_id: 5,
      state: 'ON_LOAN',
      loan_days: 7,
    });

    const result = await service.createLoan({
      ...BOOK_AVAILABLE_01,
      ...READER_ENABLED_01,
      loan_days: '7',
    });

    expect(result.state).toBe('ON_LOAN');
    expect(loanRepository.insertLoan).toHaveBeenCalledWith(
      expect.objectContaining({ loan_days: 7 })
    );
  });

  // ─── Validación de orden: loan_days primero, luego disponibilidad, luego deuda
  test('validates loan_days before checking availability or debt', async () => {
    await expect(
      service.createLoan({
        ...BOOK_AVAILABLE_01,
        ...READER_ENABLED_01,
        loan_days: 5,
      })
    ).rejects.toMatchObject({ code: 'INVALID_LOAN_DAYS' });

    expect(loanRepository.isBookAvailable).not.toHaveBeenCalled();
    expect(debtService.getLatestPendingDebtByReader).not.toHaveBeenCalled();
  });

  // ─── Propagación de error de repository ────────────────────────
  test('propagates repository errors on insertLoan failure', async () => {
    loanRepository.isBookAvailable.mockResolvedValue(true);
    debtService.getLatestPendingDebtByReader.mockResolvedValue(null);
    loanRepository.insertLoan.mockRejectedValue(new Error('DB connection lost'));

    await expect(
      service.createLoan({
        ...BOOK_AVAILABLE_01,
        ...READER_ENABLED_01,
        loan_days: 7,
      })
    ).rejects.toThrow();
  });

  // ─── Propagación de error de debtService ───────────────────────
  test('propagates debtService errors when checking reader debt', async () => {
    loanRepository.isBookAvailable.mockResolvedValue(true);
    debtService.getLatestPendingDebtByReader.mockRejectedValue(
      new Error('Debt service error')
    );

    await expect(
      service.createLoan({
        ...BOOK_AVAILABLE_01,
        ...READER_ENABLED_01,
        loan_days: 7,
      })
    ).rejects.toThrow();
    expect(loanRepository.insertLoan).not.toHaveBeenCalled();
  });
});
