/**
 * Integration Tests — PATCH /api/v1/loans
 * HU-03: Registrar devolución de un libro dentro del plazo
 *
 * Alineado con TEST_CASES.md:
 *  - TC-HU03-01: Devolución antes de date_limit → 200, RETURNED, days_late=0, no debt
 *  - TC-HU03-02: Devolución en fecha exacta → 200, RETURNED, days_late=0, no debt
 *  - TC-HU03-03: Sin préstamo activo → 404 LOAN_NOT_FOUND
 *  - TC-HU03-04: Préstamo ya devuelto → 409 ALREADY_RETURNED
 *  - Payload inválido → 400 INVALID_PAYLOAD
 *
 * Datos base (TEST_CASES.md → Datos base sugeridos HU-03):
 *  - LOAN-ACTIVE-EARLY-01:       loan_id=L-3001, id_book=B-1101, id_reader=R-2101, CI, ON_LOAN, date_limit=2026-04-10
 *  - LOAN-ACTIVE-ON-LIMIT-01:    loan_id=L-3002, id_book=B-1102, id_reader=R-2102, DNI, ON_LOAN, date_limit=2026-04-10
 *  - BOOK-WITHOUT-ACTIVE-LOAN-01: id_book=B-1103, id_reader=R-2103
 *  - LOAN-ALREADY-RETURNED-01:   loan_id=L-3004, id_book=B-1104, id_reader=R-2104, RETURNED
 */

const request = require('supertest');
const makeApp = require('../../../src/app');

// ══════════════════════════════════════════════════════════════════
// Datos base
// ══════════════════════════════════════════════════════════════════
const ACTIVE_LOAN_ROW = {
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
  created_at: '2026-04-03T00:00:00.000Z',
  updated_at: '2026-04-03T00:00:00.000Z',
};

const RETURNED_LOAN_ROW = {
  ...ACTIVE_LOAN_ROW,
  state: 'RETURNED',
  date_return: '2026-04-08',
  updated_at: '2026-04-08T00:00:00.000Z',
};

const ALREADY_RETURNED_ROW = {
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

const VALID_RETURN_PAYLOAD = {
  id_book: 'B-1101',
  id_reader: 'R-2101',
  type_id_reader: 'CI',
  date_return: '2026-04-08',
};

describe('PATCH /api/v1/loans (HU-03)', () => {
  let app;
  let mockPool;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    app = makeApp(mockPool);
  });

  // ─── TC-HU03-01: Devolución antes de date_limit → 200 ────────
  test('TC-HU03-01 — returns 200 with RETURNED state, days_late=0, no debt for early return', async () => {
    // Query sequence for returnLoan with both id_book and id_reader:
    // 1. getActiveLoanByBookAndReader → active loan found
    // 2. getLatestLoanByBookAndReader → same active loan
    // 3. updateReturn → loan updated to RETURNED
    mockPool.query
      .mockResolvedValueOnce({ rows: [ACTIVE_LOAN_ROW] })           // getActiveLoanByBookAndReader
      .mockResolvedValueOnce({ rows: [ACTIVE_LOAN_ROW] })           // getLatestLoanByBookAndReader
      .mockResolvedValueOnce({ rows: [RETURNED_LOAN_ROW] });        // updateReturn

    const res = await request(app)
      .patch('/api/v1/loans')
      .send(VALID_RETURN_PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.loan.state).toBe('RETURNED');
    expect(res.body.data.loan.date_return).toBe('2026-04-08');
    expect(res.body.data.days_late).toBe(0);
    expect(res.body.data.debt).toBeNull();
  });

  // ─── TC-HU03-02: Devolución en fecha exacta → 200 ────────────
  test('TC-HU03-02 — returns 200 with RETURNED state, days_late=0, no debt for exact date_limit return', async () => {
    const onLimitRow = { ...ACTIVE_LOAN_ROW, id_book: 'B-1102', id_reader: 'R-2102', type_id_reader: 'DNI' };
    const returnedOnLimit = { ...onLimitRow, state: 'RETURNED', date_return: '2026-04-10' };

    mockPool.query
      .mockResolvedValueOnce({ rows: [onLimitRow] })
      .mockResolvedValueOnce({ rows: [onLimitRow] })
      .mockResolvedValueOnce({ rows: [returnedOnLimit] });

    const res = await request(app)
      .patch('/api/v1/loans')
      .send({
        id_book: 'B-1102',
        id_reader: 'R-2102',
        type_id_reader: 'DNI',
        date_return: '2026-04-10',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.loan.state).toBe('RETURNED');
    expect(res.body.data.days_late).toBe(0);
    expect(res.body.data.debt).toBeNull();
  });

  // ─── TC-HU03-03: Sin préstamo activo → 404 ────────────────────
  test('TC-HU03-03 — returns 404 LOAN_NOT_FOUND when no active loan exists', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [] })   // getActiveLoanByBookAndReader → null
      .mockResolvedValueOnce({ rows: [] });  // getLatestLoanByBookAndReader → null

    const res = await request(app)
      .patch('/api/v1/loans')
      .send({
        id_book: 'B-1103',
        id_reader: 'R-2103',
        type_id_reader: 'CI',
        date_return: '2026-04-10',
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('LOAN_NOT_FOUND');
  });

  // ─── TC-HU03-04: Préstamo ya devuelto → 409 ──────────────────
  test('TC-HU03-04 — returns 409 ALREADY_RETURNED when loan was already returned', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [] })                          // getActiveLoanByBookAndReader → null
      .mockResolvedValueOnce({ rows: [ALREADY_RETURNED_ROW] });     // getLatestLoanByBookAndReader → RETURNED

    const res = await request(app)
      .patch('/api/v1/loans')
      .send({
        id_book: 'B-1104',
        id_reader: 'R-2104',
        type_id_reader: 'CI',
        date_return: '2026-04-11',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('ALREADY_RETURNED');
  });

  // ─── Payload inválido: date_return faltante → 400 ─────────────
  test('returns 400 INVALID_PAYLOAD when date_return is missing', async () => {
    const res = await request(app)
      .patch('/api/v1/loans')
      .send({
        id_book: 'B-1101',
        type_id_reader: 'CI',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INVALID_PAYLOAD');
  });

  // ─── Payload inválido: date_return formato incorrecto → 400 ───
  test('returns 400 INVALID_PAYLOAD when date_return has invalid format', async () => {
    const res = await request(app)
      .patch('/api/v1/loans')
      .send({
        id_book: 'B-1101',
        type_id_reader: 'CI',
        date_return: '08/04/2026',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INVALID_PAYLOAD');
  });

  // ─── Payload inválido: type_id_reader faltante → 400 ──────────
  test('returns 400 INVALID_PAYLOAD when type_id_reader is missing', async () => {
    const res = await request(app)
      .patch('/api/v1/loans')
      .send({
        id_book: 'B-1101',
        date_return: '2026-04-08',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INVALID_PAYLOAD');
  });

  // ─── Payload inválido: ni id_book ni id_reader → 400 ──────────
  test('returns 400 INVALID_PAYLOAD when neither id_book nor id_reader is provided', async () => {
    const res = await request(app)
      .patch('/api/v1/loans')
      .send({
        type_id_reader: 'CI',
        date_return: '2026-04-08',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INVALID_PAYLOAD');
  });

  // ─── Payload inválido: type_id_reader valor no válido → 400 ───
  test('returns 400 INVALID_PAYLOAD when type_id_reader is not CI or DNI', async () => {
    const res = await request(app)
      .patch('/api/v1/loans')
      .send({
        id_book: 'B-1101',
        type_id_reader: 'PASSPORT',
        date_return: '2026-04-08',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INVALID_PAYLOAD');
  });

  // ─── Búsqueda solo por id_book → 200 ──────────────────────────
  test('returns 200 when searching by id_book only', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [ACTIVE_LOAN_ROW] })    // getActiveLoanByBook
      .mockResolvedValueOnce({ rows: [ACTIVE_LOAN_ROW] })    // getLatestLoanByBook
      .mockResolvedValueOnce({ rows: [RETURNED_LOAN_ROW] }); // updateReturn

    const res = await request(app)
      .patch('/api/v1/loans')
      .send({
        id_book: 'B-1101',
        type_id_reader: 'CI',
        date_return: '2026-04-08',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.loan.state).toBe('RETURNED');
  });

  // ─── Alias /api/v1/loan también funciona → 200 ────────────────
  test('returns 200 on alias /api/v1/loan', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [ACTIVE_LOAN_ROW] })
      .mockResolvedValueOnce({ rows: [ACTIVE_LOAN_ROW] })
      .mockResolvedValueOnce({ rows: [RETURNED_LOAN_ROW] });

    const res = await request(app)
      .patch('/api/v1/loan')
      .send(VALID_RETURN_PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
