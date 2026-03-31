/**
 * Unit Tests — LoanService (searchAvailabilityByName)
 * HU-01: Consultar estado y disponibilidad de un libro
 *
 * Alineado con TEST_CASES.md:
 *  - TC-HU01-01: Libro disponible por historial cerrado (RETURNED)
 *  - TC-HU01-02: Libro no disponible por préstamo activo (ON_LOAN)
 *  - TC-HU01-03: Ausencia de historial operativo (data=[], mensaje de disponibilidad)
 *  - Validaciones: INVALID_NAME para entradas vacías/nulas
 *  - Propagación de errores de repository
 */

const LoanService = require('../../../src/services/loanService');

// ══════════════════════════════════════════════════════════════════
// Datos base (TEST_CASES.md → Datos base sugeridos HU-01)
// ══════════════════════════════════════════════════════════════════
const BOOK_AVAILABLE_HISTORY_01 = {
  id: 'B-0901', name: 'Don Quijote', status: 'RETURNED',
};
const BOOK_ON_LOAN_HISTORY_01 = {
  id: 'B-0902', name: 'La vorágine', status: 'ON_LOAN',
};
const BOOK_NO_HISTORY_QUERY_01_NAME = 'Manual de estanterías invisibles';

describe('LoanService — searchAvailabilityByName (HU-01)', () => {
  let loanRepository;
  let service;

  beforeEach(() => {
    loanRepository = {
      findByName: jest.fn(),
    };
    service = new LoanService(loanRepository, null);
  });

  // ─── TC-HU01-01: Libro disponible por historial cerrado ────────
  test('TC-HU01-01 — returns RETURNED book with success message', async () => {
    loanRepository.findByName.mockResolvedValue([BOOK_AVAILABLE_HISTORY_01]);

    const result = await service.searchAvailabilityByName('Don Quijote');

    expect(loanRepository.findByName).toHaveBeenCalledWith('Don Quijote');
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      id: 'B-0901',
      name: 'Don Quijote',
      status: 'RETURNED',
    });
    expect(result.message).toBe('Consulta realizada correctamente.');
  });

  // ─── TC-HU01-02: Libro no disponible por préstamo activo ───────
  test('TC-HU01-02 — returns ON_LOAN book with success message', async () => {
    loanRepository.findByName.mockResolvedValue([BOOK_ON_LOAN_HISTORY_01]);

    const result = await service.searchAvailabilityByName('La vorágine');

    expect(loanRepository.findByName).toHaveBeenCalledWith('La vorágine');
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      id: 'B-0902',
      name: 'La vorágine',
      status: 'ON_LOAN',
    });
    expect(result.message).toBe('Consulta realizada correctamente.');
  });

  // ─── TC-HU01-03: Ausencia de historial operativo ──────────────
  test('TC-HU01-03 — returns empty results with availability message when no history', async () => {
    loanRepository.findByName.mockResolvedValue([]);

    const result = await service.searchAvailabilityByName(BOOK_NO_HISTORY_QUERY_01_NAME);

    expect(loanRepository.findByName).toHaveBeenCalledWith(BOOK_NO_HISTORY_QUERY_01_NAME);
    expect(result.results).toEqual([]);
    expect(result.message).toBe(
      'El libro no registra historial de préstamo y se considera disponible para préstamo.'
    );
  });

  // ─── Validación: nombre vacío → INVALID_NAME ──────────────────
  test('throws INVALID_NAME for empty name', async () => {
    await expect(service.searchAvailabilityByName('')).rejects.toMatchObject({
      code: 'INVALID_NAME',
      statusCode: 400,
    });
    expect(loanRepository.findByName).not.toHaveBeenCalled();
  });

  // ─── Validación: null → INVALID_NAME ──────────────────────────
  test('throws INVALID_NAME for null', async () => {
    await expect(service.searchAvailabilityByName(null)).rejects.toMatchObject({
      code: 'INVALID_NAME',
      statusCode: 400,
    });
    expect(loanRepository.findByName).not.toHaveBeenCalled();
  });

  // ─── Validación: undefined → INVALID_NAME ─────────────────────
  test('throws INVALID_NAME for undefined', async () => {
    await expect(service.searchAvailabilityByName(undefined)).rejects.toMatchObject({
      code: 'INVALID_NAME',
      statusCode: 400,
    });
    expect(loanRepository.findByName).not.toHaveBeenCalled();
  });

  // ─── Validación: solo espacios → INVALID_NAME ─────────────────
  test('throws INVALID_NAME for whitespace-only string', async () => {
    await expect(service.searchAvailabilityByName('   ')).rejects.toMatchObject({
      code: 'INVALID_NAME',
      statusCode: 400,
    });
    expect(loanRepository.findByName).not.toHaveBeenCalled();
  });

  // ─── Trim whitespace antes de buscar ──────────────────────────
  test('trims whitespace before querying repository', async () => {
    loanRepository.findByName.mockResolvedValue([]);

    await service.searchAvailabilityByName('  Don Quijote  ');

    expect(loanRepository.findByName).toHaveBeenCalledWith('Don Quijote');
  });

  // ─── Propagación de error de repository ───────────────────────
  test('propagates repository errors', async () => {
    loanRepository.findByName.mockRejectedValue(new Error('DB connection failed'));

    await expect(service.searchAvailabilityByName('Don Quijote')).rejects.toThrow(
      /DB connection failed/
    );
  });
});
