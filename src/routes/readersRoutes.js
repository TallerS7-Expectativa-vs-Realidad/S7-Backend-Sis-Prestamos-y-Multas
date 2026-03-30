const { Router } = require('express');

/**
 * Factory function to create readers router with injected service
 * Follows dependency injection pattern as per backend.instructions.md
 */
module.exports = function makeReadersRouter({ debtService }) {
  const router = Router();

  /**
   * GET /api/v1/readers/debt
   * Get debt for a reader with optional filters
   * Query params: id (required), typeId (optional), name (optional)
   * 
   * Responses:
   *   200: { id_debt, loan_id, type_id_reader, id_reader, name_reader, amount_debt, state_debt }
   *   400: INVALID_QUERY (if id is missing)
   *   404: DEBT_NOT_FOUND (if no debt exists for reader)
   */
  router.get('/debt', async (req, res, next) => {
    try {
      const { id, typeId, name } = req.query;

      // Validate that id is provided (needed to query debt)
      if (!id) {
        const error = new Error('Missing required query parameter: id');
        error.statusCode = 400;
        error.code = 'INVALID_QUERY';
        throw error;
      }

      // Build filters object
      const filters = {
        id_reader: id,
        typeId: typeId || undefined,
        name_reader: name || undefined,
      };

      // Get debt by reader with filters
      const debt = await debtService.getDebtByReaderWithFilters(filters);

      return res.status(200).json({
        success: true,
        data: debt,
        message: 'Debt retrieved successfully',
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
};
