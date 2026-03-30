const { Router } = require('express');

/**
 * Factory function to create debt router with injected service
 * Follows dependency injection pattern as per backend.instructions.md
 */
module.exports = function makeDebtRouter({ debtService }) {
  const router = Router();

  /**
   * GET /api/v1/debts/:id_reader
   * Get pending debts for a reader
   */
  router.get('/:id_reader', async (req, res, next) => {
    try {
      const { id_reader } = req.params;
      
      const debts = await debtService.getAllPendingDebtsByReader(id_reader);
      
      return res.status(200).json({
        success: true,
        data: debts,
        message: 'Debts retrieved successfully',
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * PATCH /api/v1/debts/:id_debt
   * Pay a debt in full
   * Body: { state_debt: "PAID" }
   * 
   * Responses:
   *   200: { id_debt, loan_id, type_id_reader, id_reader, name_reader, amount_debt, state_debt: "PAID" }
   *   404: DEBT_NOT_FOUND (if debt doesn't exist)
   *   409: DEBT_ALREADY_PAID (if debt is already paid)
   */
  router.patch('/:id_debt', async (req, res, next) => {
    try {
      const { id_debt } = req.params;
      const { state_debt } = req.body;

      // Validate that state_debt is provided and is "PAID"
      if (!state_debt || state_debt !== 'PAID') {
        const error = new Error('Invalid request: state_debt must be "PAID"');
        error.statusCode = 400;
        error.code = 'INVALID_PAYLOAD';
        throw error;
      }

      // Pay the debt
      const updatedDebt = await debtService.payDebt(parseInt(id_debt, 10));

      return res.status(200).json({
        success: true,
        data: updatedDebt,
        message: 'Debt paid successfully',
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
};
