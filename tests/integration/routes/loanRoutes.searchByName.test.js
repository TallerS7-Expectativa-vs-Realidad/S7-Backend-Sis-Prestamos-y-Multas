/**
 * Integration Tests — GET /api/v1/loans/:name
 * HU-01: Consultar estado y disponibilidad de un libro
 *
 * Alineado con TEST_CASES.md:
 *  - TC-HU01-01: GET /api/v1/loans/Don%20Quijote → 200, RETURNED, "Consulta realizada correctamente."
 *  - TC-HU01-02: GET /api/v1/loans/La%20vorágine → 200, ON_LOAN, "Consulta realizada correctamente."
 *  - TC-HU01-03: GET /api/v1/loans/Manual%20de%20estanterías%20invisibles → 200, data=[], mensaje de disponibilidad
 *  - 500: error de base de datos
 *
 * Datos base (TEST_CASES.md → Datos base sugeridos HU-01):
 *  - BOOK-AVAILABLE-HISTORY-01: id=B-0901, name=Don Quijote, status=RETURNED
 *  - BOOK-ON-LOAN-HISTORY-01:  id=B-0902, name=La vorágine, status=ON_LOAN
 *  - BOOK-NO-HISTORY-QUERY-01: name=Manual de estanterías invisibles, sin coincidencias
 */

const request = require('supertest');
const makeApp = require('../../../src/app');

// ══════════════════════════════════════════════════════════════════
// Datos base
// ══════════════════════════════════════════════════════════════════
const BOOK_AVAILABLE_HISTORY_01 = {
  id: 'B-0901', name: 'Don Quijote', status: 'RETURNED',
};
const BOOK_ON_LOAN_HISTORY_01 = {
  id: 'B-0902', name: 'La vorágine', status: 'ON_LOAN',
};

describe('GET /api/v1/loans/:name (HU-01)', () => {
  let app;
  let mockPool;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };
    app = makeApp(mockPool);
  });

  // ─── TC-HU01-01: Libro disponible por historial cerrado ────────
  test('TC-HU01-01 — returns 200, success=true, data with RETURNED, message correcta', async () => {
    mockPool.query.mockResolvedValue({
      rows: [BOOK_AVAILABLE_HISTORY_01],
    });

    const res = await request(app).get('/api/v1/loans/Don%20Quijote');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Consulta realizada correctamente.');
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      id: 'B-0901',
      name: 'Don Quijote',
      status: 'RETURNED',
    });
  });

  // ─── TC-HU01-02: Libro no disponible por préstamo activo ───────
  test('TC-HU01-02 — returns 200, success=true, data with ON_LOAN, message correcta', async () => {
    mockPool.query.mockResolvedValue({
      rows: [BOOK_ON_LOAN_HISTORY_01],
    });

    const res = await request(app).get(`/api/v1/loans/${encodeURIComponent('La vorágine')}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Consulta realizada correctamente.');
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      id: 'B-0902',
      name: 'La vorágine',
      status: 'ON_LOAN',
    });
  });

  // ─── TC-HU01-03: Ausencia de historial operativo ──────────────
  test('TC-HU01-03 — returns 200, success=true, data=[], message de disponibilidad sin inexistencia', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    const res = await request(app).get(
      `/api/v1/loans/${encodeURIComponent('Manual de estanterías invisibles')}`
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.message).toBe(
      'El libro no registra historial de préstamo y se considera disponible para préstamo.'
    );
    // La respuesta NO debe afirmar que el libro no existe
    expect(res.body.message).not.toMatch(/no existe|not exist/i);
  });

  // ─── 500: error de base de datos ──────────────────────────────
  test('returns 500 when database throws error', async () => {
    mockPool.query.mockRejectedValue(new Error('DB connection lost'));

    const res = await request(app).get('/api/v1/loans/Don%20Quijote');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  // ─── Health check ─────────────────────────────────────────────
  test('GET /health returns 200', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
