/**
 * Unit Tests — DebtService (calculateFibUnits)
 * HU-04: Registrar devolución tardía y generar multa Fibonacci
 *
 * Alineado con TEST_CASES.md (Matriz de referencia Fibonacci HU-04):
 *  - TC-HU04-01: 1 día de mora → weeks=1, units_fib=1, amount_debt=2.00
 *  - TC-HU04-02: 7 días de mora → weeks=1, units_fib=1, amount_debt=2.00
 *  - TC-HU04-03: 8 días de mora → weeks=2, units_fib=2, amount_debt=4.00
 *  - TC-HU04-04: 15 días de mora → weeks=3, units_fib=4, amount_debt=8.00
 *  - TC-HU04-05: 22 días de mora → weeks=4, units_fib=7, amount_debt=14.00
 *
 * Spec obligatoria (copilot-instructions.md):
 *  Casos de referencia: 1, 7, 8, 15 y 22 días con deuda esperada 1, 1, 2, 4 y 7 unidades Fibonacci.
 *
 * Cobertura adicional:
 *  - days_late <= 0 → sin multa
 *  - Semanas 5 y 6 (29 y 42 días) → continuidad Fibonacci
 *  - base_fib_amount personalizado (distinto de 2.00)
 *  - base_fib_amount por defecto (sin pasar parámetro)
 */

const DebtService = require('../../../src/services/DebtService');

describe('DebtService — calculateFibUnits (HU-04)', () => {
  let debtService;

  beforeEach(() => {
    // No repository needed for pure calculation tests
    debtService = new DebtService({});
  });

  // ═══════════════════════════════════════════════════════════════
  // Sin multa (days_late <= 0)
  // ═══════════════════════════════════════════════════════════════
  describe('No debt when days_late <= 0', () => {
    test('returns 0 units and 0 amount when days_late is 0', () => {
      const result = debtService.calculateFibUnits(0);
      expect(result.units_fib).toBe(0);
      expect(result.amount_debt).toBe(0);
    });

    test('returns 0 units and 0 amount when days_late is negative', () => {
      const result = debtService.calculateFibUnits(-5);
      expect(result.units_fib).toBe(0);
      expect(result.amount_debt).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Casos obligatorios de referencia (TEST_CASES.md + copilot-instructions.md)
  // BASE_FIB_AMOUNT = 2.00 (default)
  // ═══════════════════════════════════════════════════════════════
  describe('Mandatory reference cases with base_fib_amount=2.00', () => {
    // TC-HU04-01: 1 día → semana 1 → Fib(1)=1 → units=1, amount=2.00
    test('TC-HU04-01 — 1 day late: weeks=1, units_fib=1, amount_debt=2.00', () => {
      const result = debtService.calculateFibUnits(1, 2.00);
      expect(result.units_fib).toBe(1);
      expect(result.amount_debt).toBe(2.00);
    });

    // TC-HU04-02: 7 días → semana 1 → Fib(1)=1 → units=1, amount=2.00
    test('TC-HU04-02 — 7 days late: weeks=1, units_fib=1, amount_debt=2.00', () => {
      const result = debtService.calculateFibUnits(7, 2.00);
      expect(result.units_fib).toBe(1);
      expect(result.amount_debt).toBe(2.00);
    });

    // TC-HU04-03: 8 días → semana 2 → Fib(1)+Fib(2)=1+1=2 → units=2, amount=4.00
    test('TC-HU04-03 — 8 days late: weeks=2, units_fib=2, amount_debt=4.00', () => {
      const result = debtService.calculateFibUnits(8, 2.00);
      expect(result.units_fib).toBe(2);
      expect(result.amount_debt).toBe(4.00);
    });

    // TC-HU04-04: 15 días → semana 3 → 1+1+2=4 → units=4, amount=8.00
    test('TC-HU04-04 — 15 days late: weeks=3, units_fib=4, amount_debt=8.00', () => {
      const result = debtService.calculateFibUnits(15, 2.00);
      expect(result.units_fib).toBe(4);
      expect(result.amount_debt).toBe(8.00);
    });

    // TC-HU04-05: 22 días → semana 4 → 1+1+2+3=7 → units=7, amount=14.00
    test('TC-HU04-05 — 22 days late: weeks=4, units_fib=7, amount_debt=14.00', () => {
      const result = debtService.calculateFibUnits(22, 2.00);
      expect(result.units_fib).toBe(7);
      expect(result.amount_debt).toBe(14.00);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Bordes de tramo semanal (día exacto de cambio)
  // ═══════════════════════════════════════════════════════════════
  describe('Week boundary transitions', () => {
    // 7 días: último día de semana 1
    test('7 days late stays in week 1 (boundary)', () => {
      const result = debtService.calculateFibUnits(7, 2.00);
      expect(result.units_fib).toBe(1);
    });

    // 8 días: primer día de semana 2
    test('8 days late enters week 2 (boundary)', () => {
      const result = debtService.calculateFibUnits(8, 2.00);
      expect(result.units_fib).toBe(2);
    });

    // 14 días: último día de semana 2
    test('14 days late stays in week 2 (boundary)', () => {
      const result = debtService.calculateFibUnits(14, 2.00);
      expect(result.units_fib).toBe(2);
      expect(result.amount_debt).toBe(4.00);
    });

    // 21 días: último día de semana 3
    test('21 days late stays in week 3 (boundary)', () => {
      const result = debtService.calculateFibUnits(21, 2.00);
      expect(result.units_fib).toBe(4);
      expect(result.amount_debt).toBe(8.00);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Semanas extendidas (spec tabla de referencia)
  // ═══════════════════════════════════════════════════════════════
  describe('Extended weeks (spec reference table)', () => {
    // Semana 5 (29-35 días): 1+1+2+3+5=12 units, 24.00 USD
    test('29 days late: weeks=5, units_fib=12, amount_debt=24.00', () => {
      const result = debtService.calculateFibUnits(29, 2.00);
      expect(result.units_fib).toBe(12);
      expect(result.amount_debt).toBe(24.00);
    });

    // Semana 6 (36-42 días): 1+1+2+3+5+8=20 units, 40.00 USD
    test('42 days late: weeks=6, units_fib=20, amount_debt=40.00', () => {
      const result = debtService.calculateFibUnits(42, 2.00);
      expect(result.units_fib).toBe(20);
      expect(result.amount_debt).toBe(40.00);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // base_fib_amount personalizado
  // ═══════════════════════════════════════════════════════════════
  describe('Custom base_fib_amount', () => {
    test('1 day late with base_fib_amount=5.00 → units=1, amount=5.00', () => {
      const result = debtService.calculateFibUnits(1, 5.00);
      expect(result.units_fib).toBe(1);
      expect(result.amount_debt).toBe(5.00);
    });

    test('8 days late with base_fib_amount=3.50 → units=2, amount=7.00', () => {
      const result = debtService.calculateFibUnits(8, 3.50);
      expect(result.units_fib).toBe(2);
      expect(result.amount_debt).toBe(7.00);
    });

    test('22 days late with base_fib_amount=1.00 → units=7, amount=7.00', () => {
      const result = debtService.calculateFibUnits(22, 1.00);
      expect(result.units_fib).toBe(7);
      expect(result.amount_debt).toBe(7.00);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // base_fib_amount por defecto (2.00 USD)
  // ═══════════════════════════════════════════════════════════════
  describe('Default base_fib_amount (2.00 USD)', () => {
    test('uses default 2.00 when no baseFibAmount is provided', () => {
      const result = debtService.calculateFibUnits(8);
      expect(result.units_fib).toBe(2);
      expect(result.amount_debt).toBe(4.00);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _generateFibonacciSequence (private helper validation)
  // ═══════════════════════════════════════════════════════════════
  describe('_generateFibonacciSequence', () => {
    test('returns empty array for n=0', () => {
      expect(debtService._generateFibonacciSequence(0)).toEqual([]);
    });

    test('returns [1] for n=1', () => {
      expect(debtService._generateFibonacciSequence(1)).toEqual([1]);
    });

    test('returns [1,1] for n=2', () => {
      expect(debtService._generateFibonacciSequence(2)).toEqual([1, 1]);
    });

    test('returns [1,1,2,3,5,8] for n=6', () => {
      expect(debtService._generateFibonacciSequence(6)).toEqual([1, 1, 2, 3, 5, 8]);
    });
  });
});
