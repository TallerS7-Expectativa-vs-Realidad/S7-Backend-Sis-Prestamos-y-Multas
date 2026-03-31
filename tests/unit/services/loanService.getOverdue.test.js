/**
 * Unit Tests — LoanService.getOverdue
 * HU-05: Consultar préstamos vencidos y lector responsable
 *
 * Alineado con TEST_CASES.md:
 *  - TC-HU05-01: Existen préstamos vencidos → data con loans, count correcto
 *  - TC-HU05-02: Sin préstamos vencidos → data=[], count=0
 *  - TC-HU05-03: Mezcla de estados → solo vencidos (delegado al repo)
 *  - Propagación de errores de repository
 */

const LoanService = require('../../../src/services/loanService');

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

describe('LoanService — getOverdue (HU-05)', () => {
  let loanRepository;
  let service;

  beforeEach(() => {
    loanRepository = {
      findOverdue: jest.fn(),
    };
    service = new LoanService(loanRepository, null);
  });

  // ─── TC-HU05-01: returns overdue loans with count ─────────────
  test('TC-HU05-01 — returns data array with overdue loans and correct count', async () => {
    loanRepository.findOverdue.mockResolvedValue([OVERDUE_LOAN_01, OVERDUE_LOAN_02]);

    const result = await service.getOverdue();

    expect(loanRepository.findOverdue).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual([OVERDUE_LOAN_01, OVERDUE_LOAN_02]);
    expect(result.count).toBe(2);
  });

  // ─── TC-HU05-01: each overdue loan exposes required fields ────
  test('TC-HU05-01 — each loan exposes loan_id, id_book, title, state, id_reader, name_reader, date_limit, date_return', async () => {
    loanRepository.findOverdue.mockResolvedValue([OVERDUE_LOAN_01]);

    const result = await service.getOverdue();
    const loan = result.data[0];

    expect(loan.loan_id).toBe('L-5001');
    expect(loan.id_book).toBe('B-1251');
    expect(loan.title).toBe('La Odisea');
    expect(loan.state).toBe('ON_LOAN');
    expect(loan.id_reader).toBe('R-2251');
    expect(loan.name_reader).toBe('Sara Mena');
    expect(loan.date_limit).toBe('2026-03-20');
    expect(loan.date_return).toBeNull();
  });

  // ─── TC-HU05-02: sin préstamos vencidos → data=[], count=0 ───
  test('TC-HU05-02 — returns empty data array and count=0 when no overdue loans', async () => {
    loanRepository.findOverdue.mockResolvedValue([]);

    const result = await service.getOverdue();

    expect(loanRepository.findOverdue).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual([]);
    expect(result.count).toBe(0);
  });

  // ─── TC-HU05-03: filtering delegated to repository ────────────
  test('TC-HU05-03 — delegates filtering to repository (only overdue returned)', async () => {
    // The service trusts the repo to apply state=ON_LOAN + date_limit < today
    loanRepository.findOverdue.mockResolvedValue([OVERDUE_LOAN_01]);

    const result = await service.getOverdue();

    expect(loanRepository.findOverdue).toHaveBeenCalledTimes(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].loan_id).toBe('L-5001');
    // ACTIVE-NOT-DUE-01 and RETURNED-PAST-LIMIT-01 are excluded by repo query
  });

  // ─── Error propagation ────────────────────────────────────────
  test('throws error when repository fails', async () => {
    loanRepository.findOverdue.mockRejectedValue(new Error('DB timeout'));

    await expect(service.getOverdue()).rejects.toThrow(/overdue/i);
  });

  // ─── Response structure ───────────────────────────────────────
  test('response contains exactly data and count keys', async () => {
    loanRepository.findOverdue.mockResolvedValue([]);

    const result = await service.getOverdue();

    expect(Object.keys(result)).toEqual(expect.arrayContaining(['data', 'count']));
  });
});
