/**
 * Integration Tests — PATCH /api/v1/debts/:id_debt  &  GET /api/v1/debts/:id_reader
 * HU-06: Registrar pago total de multa y rehabilitar lector
 *
 * Alineado con TEST_CASES.md (Matriz HU-06):
 *  - TC-HU06-01: Pago total exitoso → 200, state_debt=PAID
 *  - TC-HU06-02 Variante A: Deuda inexistente → 404 DEBT_NOT_FOUND
 *  - TC-HU06-02 Variante B: Deuda ya pagada → 409 DEBT_ALREADY_PAID
 *  - Payload inválido → 400 INVALID_PAYLOAD
 *  - GET /api/v1/debts/:id_reader → 200 con lista de deudas
 *
 * Datos base (TEST_CASES.md → Datos base sugeridos HU-06):
 *  - DEBT-PENDING-01: id_debt=D-6001, state_debt=PENDING, amount_debt=14.00
 *  - DEBT-PAID-01:    id_debt=D-6002, state_debt=PAID, amount_debt=8.00
 *  - DEBT-NOT-FOUND-01: id_debt=999999
 */

const request = require('supertest');
const makeApp = require('../../../src/app');

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

const DEBT_PENDING_01_PAID = {
  ...DEBT_PENDING_01,
  state_debt: 'PAID',
  updated_at: '2026-03-25T00:00:00.000Z',
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

describe('PATCH /api/v1/debts/:id_debt (HU-06)', () => {
  let app;
  let mockPool;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    app = makeApp(mockPool);
  });

  // ─── TC-HU06-01: Pago total exitoso → 200 ─────────────────────
  test('TC-HU06-01 — returns 200 with PAID debt when payment succeeds', async () => {
    // 1st query: getDebtById → debt exists with PENDING state
    mockPool.query
      .mockResolvedValueOnce({ rows: [DEBT_PENDING_01] })
      // 2nd query: markDebtAsPaid → returns updated row
      .mockResolvedValueOnce({ rows: [DEBT_PENDING_01_PAID] });

    const res = await request(app)
      .patch('/api/v1/debts/D-6001')
      .send({ state_debt: 'PAID' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.state_debt).toBe('PAID');
    expect(res.body.data.id_debt).toBe('D-6001');
    expect(res.body.data.amount_debt).toBe(14.00);
  });

  // ─── TC-HU06-02 Variante A: Deuda inexistente → 404 ──────────
  test('TC-HU06-02A — returns 404 DEBT_NOT_FOUND when debt does not exist', async () => {
    // getDebtById → no rows
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/api/v1/debts/999999')
      .send({ state_debt: 'PAID' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('DEBT_NOT_FOUND');
  });

  // ─── TC-HU06-02 Variante B: Deuda ya pagada → 409 ────────────
  test('TC-HU06-02B — returns 409 DEBT_ALREADY_PAID when debt is already paid', async () => {
    // getDebtById → returns debt with state_debt=PAID
    mockPool.query.mockResolvedValueOnce({ rows: [DEBT_PAID_01] });

    const res = await request(app)
      .patch('/api/v1/debts/D-6002')
      .send({ state_debt: 'PAID' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('DEBT_ALREADY_PAID');
  });

  // ─── Payload inválido → 400 ───────────────────────────────────
  test('returns 400 INVALID_PAYLOAD when state_debt is missing', async () => {
    const res = await request(app)
      .patch('/api/v1/debts/D-6001')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PAYLOAD');
  });

  test('returns 400 INVALID_PAYLOAD when state_debt is not "PAID"', async () => {
    const res = await request(app)
      .patch('/api/v1/debts/D-6001')
      .send({ state_debt: 'CANCELLED' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PAYLOAD');
  });

  // ─── No side effects on error ─────────────────────────────────
  test('does not modify database when debt is not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await request(app)
      .patch('/api/v1/debts/999999')
      .send({ state_debt: 'PAID' });

    // Only 1 query to check existence, no update query
    expect(mockPool.query).toHaveBeenCalledTimes(1);
  });

  test('does not modify database when debt is already paid', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [DEBT_PAID_01] });

    await request(app)
      .patch('/api/v1/debts/D-6002')
      .send({ state_debt: 'PAID' });

    // Only 1 query to check existence, no update query
    expect(mockPool.query).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/v1/debts/:id_reader (HU-06)', () => {
  let app;
  let mockPool;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    app = makeApp(mockPool);
  });

  test('returns 200 with pending debts for reader', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [DEBT_PENDING_01],
    });

    const res = await request(app).get('/api/v1/debts/R-2301');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id_reader).toBe('R-2301');
    expect(res.body.data[0].state_debt).toBe('PENDING');
  });

  test('returns 200 with empty array when reader has no pending debts', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/v1/debts/R-9999');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });
});
