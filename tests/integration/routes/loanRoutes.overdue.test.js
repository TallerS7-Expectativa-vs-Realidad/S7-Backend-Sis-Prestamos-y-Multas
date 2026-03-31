/**
 * Integration Tests — GET /api/v1/loans/outTime
 * HU-05: Consultar préstamos vencidos y lector responsable
 *
 * Alineado con TEST_CASES.md:
 *  - TC-HU05-01: GET /api/v1/loans/outTime → 200, data con L-5001 y L-5002, count=2
 *  - TC-HU05-02: GET /api/v1/loans/outTime → 200, data=[], count=0
 *  - TC-HU05-03: GET /api/v1/loans/outTime → 200, solo vencidos en data
 *  - 500: error de base de datos
 *
 * Datos base (TEST_CASES.md → Datos base sugeridos HU-05):
 *  - OVERDUE-LOAN-01: L-5001, B-1251, La Odisea, Sara Mena, ON_LOAN, date_limit=2026-03-20
 *  - OVERDUE-LOAN-02: L-5002, B-1252, El Aleph, Bruno Paz, ON_LOAN, date_limit=2026-03-24
 */

const request = require('supertest');
const makeApp = require('../../../src/app');

// ══════════════════════════════════════════════════════════════════
// Datos base (TEST_CASES.md → Datos base sugeridos HU-05)
// ══════════════════════════════════════════════════════════════════
const OVERDUE_LOAN_01 = {
  loan_id: 'L-5001',
  id_book: 'B-1251',
  title: 'La Odisea',
  state: 'ON_LOAN',
  id_reader: 'R-2251',
  name_reader: 'Sara Mena',
  date_limit: '2026-03-20',
  date_return: null,
};

const OVERDUE_LOAN_02 = {
  loan_id: 'L-5002',
  id_book: 'B-1252',
  title: 'El Aleph',
  state: 'ON_LOAN',
  id_reader: 'R-2252',
  name_reader: 'Bruno Paz',
  date_limit: '2026-03-24',
  date_return: null,
};

describe('GET /api/v1/loans/outTime (HU-05)', () => {
  let app;
  let mockPool;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };
    app = makeApp(mockPool);
  });

  // ─── TC-HU05-01: préstamos vencidos existentes ────────────────
  test('TC-HU05-01 — returns 200 with data containing overdue loans and count', async () => {
    mockPool.query.mockResolvedValue({
      rows: [OVERDUE_LOAN_01, OVERDUE_LOAN_02],
    });

    const res = await request(app).get('/api/v1/loans/outTime');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.count).toBe(2);
  });

  // ─── TC-HU05-01: each loan exposes required fields ────────────
  test('TC-HU05-01 — each result includes loan_id, id_book, title, state, id_reader, name_reader, date_limit, date_return', async () => {
    mockPool.query.mockResolvedValue({
      rows: [OVERDUE_LOAN_01],
    });

    const res = await request(app).get('/api/v1/loans/outTime');

    expect(res.status).toBe(200);
    const loan = res.body.data[0];
    expect(loan).toMatchObject({
      loan_id: 'L-5001',
      id_book: 'B-1251',
      title: 'La Odisea',
      state: 'ON_LOAN',
      id_reader: 'R-2251',
      name_reader: 'Sara Mena',
      date_limit: '2026-03-20',
      date_return: null,
    });
  });

  // ─── TC-HU05-01: date_return is null for active overdue loans ─
  test('TC-HU05-01 — date_return arrives as null for active overdue loans', async () => {
    mockPool.query.mockResolvedValue({
      rows: [OVERDUE_LOAN_01, OVERDUE_LOAN_02],
    });

    const res = await request(app).get('/api/v1/loans/outTime');

    for (const loan of res.body.data) {
      expect(loan.date_return).toBeNull();
      expect(loan.state).toBe('ON_LOAN');
    }
  });

  // ─── TC-HU05-02: sin préstamos vencidos → data=[], count=0 ───
  test('TC-HU05-02 — returns 200 with empty data and count=0 when no overdue loans', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    const res = await request(app).get('/api/v1/loans/outTime');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.count).toBe(0);
  });

  // ─── TC-HU05-03: only overdue loans in response ──────────────
  test('TC-HU05-03 — results contain only overdue loans (filtering by DB query)', async () => {
    // Mock returns only OVERDUE-LOAN-01 (ACTIVE-NOT-DUE-01 and RETURNED-PAST-LIMIT-01 excluded by query)
    mockPool.query.mockResolvedValue({
      rows: [OVERDUE_LOAN_01],
    });

    const res = await request(app).get('/api/v1/loans/outTime');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].loan_id).toBe('L-5001');
    // ACTIVE-NOT-DUE-01 (L-5003) and RETURNED-PAST-LIMIT-01 (L-5004) must not appear
    const loanIds = res.body.data.map(l => l.loan_id);
    expect(loanIds).not.toContain('L-5003');
    expect(loanIds).not.toContain('L-5004');
  });

  // ─── 500: error de base de datos ──────────────────────────────
  test('returns 500 when database query fails', async () => {
    mockPool.query.mockRejectedValue(new Error('connection refused'));

    const res = await request(app).get('/api/v1/loans/outTime');

    expect(res.status).toBe(500);
  });
});
