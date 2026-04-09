/**
 * Loan Routes - HU-01: Book Availability Search + HU-05: Overdue Loans
 * 
 * HTTP routes for loan-related operations.
 * - HU-01: GET /api/v1/loans/{name} to search book availability.
 * - HU-05: GET /api/v1/loans/outTime to list overdue loans.
 */
const { Router } = require('express');
const { createLoanSchema, returnLoanSchema } = require('../models/Loan');


module.exports = function makeLoanRouter({ loanService }) {
  const router = Router();

  /**
   * GET /api/v1/loans/outTime
   * List all overdue loans (HU-05)
   * 
   * Responses:
   *   - 200 OK: { data: [...], count: number }
   *   - 500 Internal Server Error: error details
   * 
   * Returns loans where state=ON_LOAN and date_limit < today
   * Includes: loan_id, id_book, title, state, id_reader, name_reader, date_limit, date_return
   * 
   * Example:
   *   GET /api/v1/loans/outTime
   */
  router.get('/outTime', async (req, res, next) => {
    try {
      const response = await loanService.getOverdue();
      res.status(200).json(response);
    } catch (error) {
      // Delegate to error handler middleware
      next(error);
    }
  });
  
    /**
   * GET /api/v1/loans/{name}
   * Search for book availability by title (case-insensitive)
   * 
   * Path Parameters:
   *   - name (string): Book title to search for
   * 
   * Responses:
   *   - 200 OK: { results: [...], message?: string }
   *   - 304 Bad Request: { message: "INVALID_NAME" }
   * 
   * Examples:
   *   GET /api/v1/loans/Harry%20Potter
   *   GET /api/v1/loans/the%20hobbit
   */
  router.get('/:name', async (req, res, next) => {
    try {
      const result = await loanService.searchAvailabilityByName(req.params.name);

      return res.status(200).json({
        success: true,
        data: result.results,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  });




  /**
   * POST /api/v1/loans
   * Register a new book loan for a reader
   * 
   * Body: { id_book, title, type_id_reader, id_reader, name_reader, loan_days }
   * 
   * Response codes:
   * - 201: Loan created successfully
   * - 400: INVALID_LOAN_DAYS (loan_days not in [7, 14, 21]) | INVALID_PAYLOAD (other field errors)
   * - 409: BOOK_NOT_AVAILABLE | READER_HAS_DEBT
   * - 500: INTERNAL_SERVER_ERROR
   */
  router.post('/', async (req, res, next) => {
    try {
      // 1. Validate request payload against Zod schema
      const validatedData = createLoanSchema.parse(req.body);

      // 2. Call service to create loan (handles business logic and validations)
      const loan = await loanService.createLoan(validatedData);

      // 3. Return 201 with created loan
      return res.status(201).json({
        success: true,
        data: loan,
        message: 'Loan created successfully',
      });
    } catch (err) {
      // Delegate error handling to express error middleware
      next(err);
    }
  });

  /**
    * PATCH /api/v1/loans
   * Register the return of a book (HU-03 on-time and HU-04 late returns)
   * For on-time returns: closes loan without debt
   * For late returns: closes loan and generates debt
   * 
   * Body: { id_book?, id_reader?, name_reader?, date_return, type_id_reader, base_fib_amount? }
   * At least one of id_book or id_reader must be provided
   * 
   * Response codes:
   * - 200: Loan returned (RETURNED) with optional debt if late
   * - 400: INVALID_PAYLOAD (invalid date format, missing required fields, etc.)
   * - 404: LOAN_NOT_FOUND (no active loan matching criteria)
   * - 409: ALREADY_RETURNED (loan already returned)
   * - 500: SEARCH_ERROR | UPDATE_ERROR | DEBT_CREATION_ERROR | INTERNAL_SERVER_ERROR
   * 
   * Success response includes:
   * - loan: Updated loan record (state=RETURNED)
   * - debt: Debt record if late return (null if on-time)
   * - days_late: Number of days late (0 if on-time)
   */
  router.patch('/', async (req, res, next) => {
    try {
      // 1. Validate request payload against Zod schema
      const validatedData = returnLoanSchema.parse(req.body);

      // 2. Call service to return loan (handles business logic and validations)
      // Service now returns { loan, debt, days_late }
      const result = await loanService.returnLoan(validatedData);

      // 3. Return 200 with updated loan and debt info (if late)
      return res.status(200).json({
        success: true,
        data: {
          loan: result.loan,
          debt: result.debt || null, // null if no penalty, debt record if penalty applies
          days_late: result.days_late,
          message: result.debt 
            ? `Loan returned with ${result.days_late} days late. Debt created.`
            : 'Loan returned on time. No debt generated.',
        },
      });
    } catch (err) {
      // Delegate error handling to express error middleware
      next(err);
    }
  });

  return router;
};
