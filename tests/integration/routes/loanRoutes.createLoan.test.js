/**
 * Integration Tests — POST /api/v1/loans
 * HU-02: Registrar préstamo de un libro a un lector habilitado
 *
 * Alineado con TEST_CASES.md:
 *  - TC-HU02-01: POST válido → 201, loan creado con state=ON_LOAN
 *  - TC-HU02-02: Libro ya prestado → 409 BOOK_NOT_AVAILABLE
 *  - TC-HU02-03: Lector con deuda pendiente → 409 READER_HAS_DEBT
 *  - TC-HU02-04: Plazo inválido → 400 INVALID_LOAN_DAYS
 *  - Validación de payload → 400 INVALID_PAYLOAD
 *
 * Datos base (TEST_CASES.md → Datos base sugeridos HU-02):
 *  - BOOK-AVAILABLE-01: id_book=B-1001, title=Cien años de soledad
 *  - BOOK-ON-LOAN-01:   id_book=B-1002, title=1984
 *  - BOOK-AVAILABLE-02: id_book=B-1003, title=El principito
 *  - BOOK-AVAILABLE-03: id_book=B-1004, title=Rayuela
 *  - READER-ENABLED-01: CI, R-2001, Ana Torres
 *  - READER-ENABLED-02: DNI, R-2002, Carlos Rojas
 *  - READER-BLOCKED-01: CI, R-2003, Laura Díaz
 */

const request = require('supertest');
const makeApp = require('../../../src/app');

// ══════════════════════════════════════════════════════════════════
// Datos base
// ══════════════════════════════════════════════════════════════════
const VALID_LOAN_PAYLOAD = {
  id_book: 'B-1001',
  title: 'Cien años de soledad',
  type_id_reader: 'CI',
  id_reader: 'R-2001',
  name_reader: 'Ana Torres',
  loan_days: 7,
};

const LOAN_CREATED_ROW = {
  loan_id: 1,
  id_book: 'B-1001',
  title: 'Cien años de soledad',
  type_id_reader: 'CI',
  id_reader: 'R-2001',
  name_reader: 'Ana Torres',
  loan_days: 7,
  state: 'ON_LOAN',
  date_limit: '2026-04-07',
  date_return: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('POST /api/v1/loans (HU-02)', () => {
  let app;
  let mockPool;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    app = makeApp(mockPool, { ready: true });
  });

  // ─── TC-HU02-01: Préstamo exitoso → 201 ───────────────────────
  test('TC-HU02-01 — returns 201 with created loan when all validations pass', async () => {
    // 1st query: isBookAvailable → no records (book available)
    mockPool.query
      .mockResolvedValueOnce({ rows: [] })
      // 2nd query: getLatestPendingDebtByReader → no pending debt
      .mockResolvedValueOnce({ rows: [] })
      // 3rd query: insertLoan → loan created
      .mockResolvedValueOnce({ rows: [LOAN_CREATED_ROW] });

    const res = await request(app)
      .post('/api/v1/loans')
      .send(VALID_LOAN_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Loan created successfully');
    expect(res.body.data).toMatchObject({
      state: 'ON_LOAN',
      id_book: 'B-1001',
      loan_days: 7,
    });
  });

  // ─── TC-HU02-01 variante: loan_days=14 → 201 ──────────────────
  test('TC-HU02-01 — returns 201 with loan_days=14', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ ...LOAN_CREATED_ROW, loan_days: 14 }],
      });

    const res = await request(app)
      .post('/api/v1/loans')
      .send({ ...VALID_LOAN_PAYLOAD, loan_days: 14 });

    expect(res.status).toBe(201);
    expect(res.body.data.loan_days).toBe(14);
  });

  // ─── TC-HU02-01 variante: loan_days=21 → 201 ──────────────────
  test('TC-HU02-01 — returns 201 with loan_days=21', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ ...LOAN_CREATED_ROW, loan_days: 21 }],
      });

    const res = await request(app)
      .post('/api/v1/loans')
      .send({ ...VALID_LOAN_PAYLOAD, loan_days: 21 });

    expect(res.status).toBe(201);
    expect(res.body.data.loan_days).toBe(21);
  });

  // ─── TC-HU02-02: Libro ya prestado → 409 ──────────────────────
  test('TC-HU02-02 — returns 409 BOOK_NOT_AVAILABLE when book is on loan', async () => {
    // isBookAvailable → latest state is ON_LOAN
    mockPool.query.mockResolvedValueOnce({
      rows: [{ state: 'ON_LOAN' }],
    });
    // debt check should not be needed but mock just in case
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/v1/loans')
      .send({
        id_book: 'B-1002',
        title: '1984',
        type_id_reader: 'DNI',
        id_reader: 'R-2002',
        name_reader: 'Carlos Rojas',
        loan_days: 14,
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('BOOK_NOT_AVAILABLE');
    expect(res.body.success).toBe(false);
  });

  // ─── TC-HU02-03: Lector con deuda → 409 ───────────────────────
  test('TC-HU02-03 — returns 409 READER_HAS_DEBT when reader has pending debt', async () => {
    // isBookAvailable → no records (available)
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    // getLatestPendingDebtByReader → has pending debt
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        id_debt: 'D-9999',
        id_reader: 'R-2003',
        state_debt: 'PENDING',
        amount_debt: 14.00,
      }],
    });

    const res = await request(app)
      .post('/api/v1/loans')
      .send({
        id_book: 'B-1003',
        title: 'El principito',
        type_id_reader: 'CI',
        id_reader: 'R-2003',
        name_reader: 'Laura Díaz',
        loan_days: 21,
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('READER_HAS_DEBT');
    expect(res.body.success).toBe(false);
  });

  // ─── TC-HU02-04: Plazo no permitido → 400 ─────────────────────
  test('TC-HU02-04 — returns 400 INVALID_LOAN_DAYS when loan_days=10', async () => {
    const res = await request(app)
      .post('/api/v1/loans')
      .send({
        id_book: 'B-1004',
        title: 'Rayuela',
        type_id_reader: 'CI',
        id_reader: 'R-2001',
        name_reader: 'Ana Torres',
        loan_days: 10,
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_LOAN_DAYS');
    expect(res.body.success).toBe(false);
  });

  // ─── Payload inválido: campo faltante → 400 INVALID_PAYLOAD ───
  test('returns 400 INVALID_PAYLOAD when required field is missing', async () => {
    const res = await request(app)
      .post('/api/v1/loans')
      .send({
        id_book: 'B-1001',
        // Missing: title, type_id_reader, id_reader, name_reader, loan_days
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PAYLOAD');
    expect(res.body.success).toBe(false);
  });

  // ─── Payload inválido: type_id_reader no válido → 400 ────────
  test('returns 400 INVALID_PAYLOAD when type_id_reader is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/loans')
      .send({
        ...VALID_LOAN_PAYLOAD,
        type_id_reader: 'INVALID',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PAYLOAD');
  });

  // ─── Payload inválido: body vacío → 400 ───────────────────────
  test('returns 400 INVALID_PAYLOAD when body is empty', async () => {
    const res = await request(app)
      .post('/api/v1/loans')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PAYLOAD');
  });

  // ─── Error interno de DB → 500 ────────────────────────────────
  test('returns 500 when database error occurs during insert', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [] }) // isBookAvailable
      .mockResolvedValueOnce({ rows: [] }) // debt check
      .mockRejectedValueOnce(new Error('DB connection lost')); // insertLoan

    const res = await request(app)
      .post('/api/v1/loans')
      .send(VALID_LOAN_PAYLOAD);

    expect(res.status).toBe(500);
  });
});
