/**
 * Integration Tests — PATCH /api/v1/loans (late return)
 * HU-04: Registrar devolución tardía y generar multa Fibonacci
 *
 * Alineado con TEST_CASES.md:
 *  - TC-HU04-01: 1 día mora → 200, RETURNED, days_late=1, debt created with PENDING
 *  - TC-HU04-02: 7 días mora → 200, days_late=7, units_fib=1, amount_debt=2.00
 *  - TC-HU04-03: 8 días mora → 200, days_late=8, units_fib=2, amount_debt=4.00
 *  - TC-HU04-04: 15 días mora → 200, days_late=15, units_fib=4, amount_debt=8.00
 *  - TC-HU04-05: 22 días mora → 200, days_late=22, units_fib=7, amount_debt=14.00
 *
 * Datos base (TEST_CASES.md → Datos base sugeridos HU-04):
 *  date_limit=2026-04-10 para todos los préstamos de mora
 */

const request = require('supertest');
const makeApp = require('../../../src/app');

// ══════════════════════════════════════════════════════════════════
// Factories
// ══════════════════════════════════════════════════════════════════
const makeActiveLoanRow = (overrides = {}) => ({
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
  created_at: '2026-04-03T00:00:00.000Z',
  updated_at: '2026-04-03T00:00:00.000Z',
  ...overrides,
});

const makeReturnedLoanRow = (activeLoan, dateReturn) => ({
  ...activeLoan,
  state: 'RETURNED',
  date_return: dateReturn,
  updated_at: `${dateReturn}T00:00:00.000Z`,
});

const makeDebtRow = (overrides = {}) => ({
  id_debt: 1,
  loan_id: 'L-4001',
  type_id_reader: 'CI',
  id_reader: 'R-2201',
  name_reader: 'Lector Tardío',
  units_fib: 1,
  amount_debt: 2.00,
  state_debt: 'PENDING',
  created_at: '2026-04-11T00:00:00.000Z',
  updated_at: '2026-04-11T00:00:00.000Z',
  ...overrides,
});

describe('PATCH /api/v1/loans — late return (HU-04)', () => {
  let app;
  let mockPool;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    app = makeApp(mockPool, { ready: true });
  });

  /**
   * Helper: set up mock pool queries for a late return scenario
   * Query sequence when both id_book and id_reader are provided:
   *  1. getActiveLoanByBookAndReader → active loan
   *  2. getLatestLoanByBookAndReader → same active loan
   *  3. updateReturn → returned loan
   *  4. createDebt → debt record
   */
  function setupLateReturnMocks(activeLoan, dateReturn, debtRow) {
    const returnedLoan = makeReturnedLoanRow(activeLoan, dateReturn);
    mockPool.query
      .mockResolvedValueOnce({ rows: [activeLoan] })    // getActiveLoanByBookAndReader
      .mockResolvedValueOnce({ rows: [activeLoan] })    // getLatestLoanByBookAndReader
      .mockResolvedValueOnce({ rows: [returnedLoan] })  // updateReturn
      .mockResolvedValueOnce({ rows: [debtRow] });       // createDebt
  }

  // ─── TC-HU04-01: 1 día de mora → 200 con debt PENDING ────────
  test('TC-HU04-01 — 1 day late: returns 200, RETURNED, days_late=1, debt with units_fib=1, amount_debt=2.00', async () => {
    const activeLoan = makeActiveLoanRow();
    const debtRow = makeDebtRow({ units_fib: 1, amount_debt: 2.00 });
    setupLateReturnMocks(activeLoan, '2026-04-11', debtRow);

    const res = await request(app)
      .patch('/api/v1/loans')
      .send({
        id_book: 'B-1201',
        id_reader: 'R-2201',
        type_id_reader: 'CI',
        date_return: '2026-04-11',
        base_fib_amount: 2.00,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.loan.state).toBe('RETURNED');
    expect(res.body.data.days_late).toBe(1);
    expect(res.body.data.debt).not.toBeNull();
    expect(res.body.data.debt.state_debt).toBe('PENDING');
    expect(res.body.data.debt.units_fib).toBe(1);
    expect(res.body.data.debt.amount_debt).toBe(2.00);
  });

  // ─── TC-HU04-02: 7 días de mora → 200 (borde semana 1) ──────
  test('TC-HU04-02 — 7 days late: returns 200, days_late=7, units_fib=1, amount_debt=2.00', async () => {
    const activeLoan = makeActiveLoanRow({ loan_id: 'L-4002', id_book: 'B-1202', id_reader: 'R-2202', type_id_reader: 'DNI' });
    const debtRow = makeDebtRow({ loan_id: 'L-4002', id_reader: 'R-2202', type_id_reader: 'DNI', units_fib: 1, amount_debt: 2.00 });
    setupLateReturnMocks(activeLoan, '2026-04-17', debtRow);

    const res = await request(app)
      .patch('/api/v1/loans')
      .send({
        id_book: 'B-1202',
        id_reader: 'R-2202',
        type_id_reader: 'DNI',
        date_return: '2026-04-17',
        base_fib_amount: 2.00,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.days_late).toBe(7);
    expect(res.body.data.debt.units_fib).toBe(1);
    expect(res.body.data.debt.amount_debt).toBe(2.00);
  });

  // ─── TC-HU04-03: 8 días de mora → 200 (cambio semana 2) ─────
  test('TC-HU04-03 — 8 days late: returns 200, days_late=8, units_fib=2, amount_debt=4.00', async () => {
    const activeLoan = makeActiveLoanRow({ loan_id: 'L-4003', id_book: 'B-1203', id_reader: 'R-2203' });
    const debtRow = makeDebtRow({ loan_id: 'L-4003', id_reader: 'R-2203', units_fib: 2, amount_debt: 4.00 });
    setupLateReturnMocks(activeLoan, '2026-04-18', debtRow);

    const res = await request(app)
      .patch('/api/v1/loans')
      .send({
        id_book: 'B-1203',
        id_reader: 'R-2203',
        type_id_reader: 'CI',
        date_return: '2026-04-18',
        base_fib_amount: 2.00,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.days_late).toBe(8);
    expect(res.body.data.debt.units_fib).toBe(2);
    expect(res.body.data.debt.amount_debt).toBe(4.00);
  });

  // ─── TC-HU04-04: 15 días de mora → 200 (semana 3) ────────────
  test('TC-HU04-04 — 15 days late: returns 200, days_late=15, units_fib=4, amount_debt=8.00', async () => {
    const activeLoan = makeActiveLoanRow({ loan_id: 'L-4004', id_book: 'B-1204', id_reader: 'R-2204', type_id_reader: 'CC' });
    const debtRow = makeDebtRow({ loan_id: 'L-4004', id_reader: 'R-2204', type_id_reader: 'CC', units_fib: 4, amount_debt: 8.00 });
    setupLateReturnMocks(activeLoan, '2026-04-25', debtRow);

    const res = await request(app)
      .patch('/api/v1/loans')
      .send({
        id_book: 'B-1204',
        id_reader: 'R-2204',
        type_id_reader: 'CI',
        date_return: '2026-04-25',
        base_fib_amount: 2.00,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.days_late).toBe(15);
    expect(res.body.data.debt.units_fib).toBe(4);
    expect(res.body.data.debt.amount_debt).toBe(8.00);
  });

  // ─── TC-HU04-05: 22 días de mora → 200 (semana 4) ────────────
  test('TC-HU04-05 — 22 days late: returns 200, days_late=22, units_fib=7, amount_debt=14.00', async () => {
    const activeLoan = makeActiveLoanRow({ loan_id: 'L-4005', id_book: 'B-1205', id_reader: 'R-2205', type_id_reader: 'TI' });
    const debtRow = makeDebtRow({ loan_id: 'L-4005', id_reader: 'R-2205', type_id_reader: 'TI', units_fib: 7, amount_debt: 14.00 });
    setupLateReturnMocks(activeLoan, '2026-05-02', debtRow);

    const res = await request(app)
      .patch('/api/v1/loans')
      .send({
        id_book: 'B-1205',
        id_reader: 'R-2205',
        type_id_reader: 'CI',
        date_return: '2026-05-02',
        base_fib_amount: 2.00,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.days_late).toBe(22);
    expect(res.body.data.debt.units_fib).toBe(7);
    expect(res.body.data.debt.amount_debt).toBe(14.00);
  });

  // ─── Response message indica devolución tardía con deuda ──────
  test('response message indicates late return with debt created', async () => {
    const activeLoan = makeActiveLoanRow();
    const debtRow = makeDebtRow();
    setupLateReturnMocks(activeLoan, '2026-04-11', debtRow);

    const res = await request(app)
      .patch('/api/v1/loans')
      .send({
        id_book: 'B-1201',
        id_reader: 'R-2201',
        type_id_reader: 'CI',
        date_return: '2026-04-11',
        base_fib_amount: 2.00,
      });

    expect(res.body.data.message).toContain('Debt created');
  });

  // ─── base_fib_amount opcional: funciona sin enviarlo ──────────
  test('works without base_fib_amount (uses backend default)', async () => {
    const activeLoan = makeActiveLoanRow();
    const debtRow = makeDebtRow({ units_fib: 1, amount_debt: 2.00 });
    setupLateReturnMocks(activeLoan, '2026-04-11', debtRow);

    const res = await request(app)
      .patch('/api/v1/loans')
      .send({
        id_book: 'B-1201',
        id_reader: 'R-2201',
        type_id_reader: 'CI',
        date_return: '2026-04-11',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.debt).not.toBeNull();
  });

  // ─── Payload inválido: base_fib_amount negativo → 400 ────────
  test('returns 400 INVALID_PAYLOAD when base_fib_amount is negative', async () => {
    const res = await request(app)
      .patch('/api/v1/loans')
      .send({
        id_book: 'B-1201',
        id_reader: 'R-2201',
        type_id_reader: 'CI',
        date_return: '2026-04-11',
        base_fib_amount: -1,
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PAYLOAD');
  });
});
