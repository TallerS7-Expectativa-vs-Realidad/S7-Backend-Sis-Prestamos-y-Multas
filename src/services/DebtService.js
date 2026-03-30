/**
 * DebtService
 * Handles business logic for debt operations - HU-06 only
 */

// ============================================================
// CONSTANTS
// ============================================================
// Default base amount for Fibonacci unit (USD)
// This is used if the frontend doesn't provide a base_fib_amount
// According to HU-04 spec, default BASE_FIB_AMOUNT = 2 USD per Fibonacci unit
const DEFAULT_BASE_FIB_AMOUNT = 2.00;

class DebtService {
  constructor(debtRepository) {
    this.debtRepository = debtRepository;
  }

  /**
   * Get the latest pending debt for a reader
   */
  async getLatestPendingDebtByReader(id_reader) {
    return await this.debtRepository.getLatestPendingDebtByReader(id_reader);
  }

  /**
   * Get all pending debts for a reader
   */
  async getAllPendingDebtsByReader(id_reader) {
    return await this.debtRepository.getAllPendingDebtsByReader(id_reader);
  }

  /**
   * Get a debt by ID
   */
  async getDebtById(id_debt) {
    return await this.debtRepository.getDebtById(id_debt);
  }

  /**
   * Create a new debt record
   */
  async createDebt(debtData) {
    return await this.debtRepository.createDebt(debtData);
  }

  /**
   * Mark a debt as paid
   */
  async markDebtAsPaid(id_debt) {
    return await this.debtRepository.markDebtAsPaid(id_debt);
  }

  /**
   * Get debt for a reader with optional filters
   * Requires: id_reader in filters
   * Optional: typeId, name_reader
   * 
   * @param {Object} filters - { id_reader: string, typeId?: string, name_reader?: string }
   * @returns {Object} Debt record if found
   * @throws {Error} with statusCode 400 if id_reader is missing
   * @throws {Error} with statusCode 404 if debt not found
   */
  async getDebtByReaderWithFilters(filters) {
    // Validate required filters
    if (!filters.id_reader) {
      const error = new Error('id_reader is required');
      error.statusCode = 400;
      error.code = 'INVALID_QUERY';
      throw error;
    }

    // Get debt from repository
    const debt = await this.debtRepository.getDebtByReaderWithFilters(filters);

    if (!debt) {
      const error = new Error('No debt found for this reader');
      error.statusCode = 404;
      error.code = 'DEBT_NOT_FOUND';
      throw error;
    }

    return debt;
  }

  /**
   * Pay a debt in full
   * Validates that:
   * - Debt exists
   * - Debt state is PENDING (not already paid)
   * 
   * @param {number} id_debt - Debt ID to pay
   * @returns {Object} Updated debt record with state_debt = PAID
   * @throws {Error} with statusCode 404 if debt not found
   * @throws {Error} with statusCode 409 if debt already paid
   */
  async payDebt(id_debt) {
    // Get the debt first to verify it exists and check state
    const debt = await this.debtRepository.getDebtById(id_debt);

    if (!debt) {
      const error = new Error('Debt not found');
      error.statusCode = 404;
      error.code = 'DEBT_NOT_FOUND';
      throw error;
    }

    // Check if debt is already paid
    if (debt.state_debt === 'PAID') {
      const error = new Error('This debt has already been paid');
      error.statusCode = 409;
      error.code = 'DEBT_ALREADY_PAID';
      throw error;
    }

    // Mark debt as paid
    const updatedDebt = await this.debtRepository.markDebtAsPaid(id_debt);
    return updatedDebt;

  }

  /**
   * Calculate Fibonacci units based on days late
   * Rules (from HU-04 spec):
   * - If days_late <= 0, no debt (return 0 units)
   * - weeks = ((days_late - 1) // 7) + 1 (complete weeks only)
   * - Cálculo ACUMULATIVO semana por semana:
   *   - Semana 1: multa = Fib(1) × base_fib_amount = 1 × base_fib_amount
   *   - Semana 2: multa = Fib(2) × base_fib_amount + acumulado_anterior = 1 × base_fib_amount + anterior
   *   - Semana 3: multa = Fib(3) × base_fib_amount + acumulado_anterior = 2 × base_fib_amount + anterior
   *   - Semana 4: multa = Fib(4) × base_fib_amount + acumulado_anterior = 3 × base_fib_amount + anterior
   *   - Y así sucesivamente...
   * 
   * Examples (with base_fib_amount = 2):
   * - 1 day late: weeks=1, amount=(1×2) = 2, units=1
   * - 7 days late: weeks=1, amount=(1×2) = 2, units=1
   * - 8 days late: weeks=2, amount=(1×2) + (1×2 + 2) = 4, units=2
   * - 15 days late: weeks=3, amount=2 + 4 + (2×2 + 4) = 8, units=4
   * - 22 days late: weeks=4, amount=2 + 4 + 8 + (3×2 + 8) = 14, units=7
   * - 42 days late: weeks=6, amount accumulates to 40, units=20
   * 
   * @param {number} days_late - Number of days the book is late
   * @param {number} baseFibAmount - Base amount per Fibonacci unit (provided by frontend or default)
  * @returns {Object} { units_fib, amount_debt }
   */
  calculateFibUnits(days_late, baseFibAmount = DEFAULT_BASE_FIB_AMOUNT) {
    // No debt if return is on time or early
    if (days_late <= 0) {
      return { units_fib: 0, amount_debt: 0 };
    }

    // Calculate complete weeks
    const weeks = Math.floor((days_late - 1) / 7) + 1;

    // Generate Fibonacci sequence up to 'weeks' terms
    const fibSequence = this._generateFibonacciSequence(weeks);

    // Calculate accumulated debt week by week
    // Each week adds: Fibonacci(week) * baseFibAmount to the accumulated total
    let amount_debt = 0;
    for (let week = 0; week < weeks; week++) {
      // Add this week's fine to the accumulated total
      amount_debt += fibSequence[week] * baseFibAmount;
    }

    // units_fib represents the total sum of Fibonacci numbers (before multiplying by baseFibAmount)
    const units_fib = fibSequence.reduce((sum, val) => sum + val, 0);

    return {
      units_fib,
      amount_debt: parseFloat(amount_debt.toFixed(2)),
    };
  }

  /**
   * Generate Fibonacci sequence with 'n' terms
   * Starts with 1, 1, 2, 3, 5, 8, ...
   * 
   * @param {number} n - Number of Fibonacci terms to generate
   * @returns {number[]} Array of Fibonacci numbers
   * @private
   */
  _generateFibonacciSequence(n) {
    if (n <= 0) return [];
    if (n === 1) return [1];
    
    const fib = [1, 1];
    for (let i = 2; i < n; i++) {
      fib.push(fib[i - 1] + fib[i - 2]);
    }
    return fib;
  }
}

module.exports = DebtService;
