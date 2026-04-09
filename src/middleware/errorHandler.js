const { ZodError } = require('zod');

/**
 * Centralized error handling middleware for Express
 * 
 * Error handling strategy:
 * 1. Zod validation errors (from schema.parse() in routes)
 *    - Returns 400 with code: 'INVALID_PAYLOAD'
 *    - Includes detailed field errors
 * 
 * 2. Business logic errors (from services)
 *    - Must have both 'statusCode' and 'code' properties
 *    - Examples: INVALID_LOAN_DAYS (400), BOOK_NOT_AVAILABLE (409), LOAN_NOT_FOUND (404)
 *    - Returns statusCode with code and message
 * 
 * 3. Unhandled errors
 *    - Returns 500 with code: 'INTERNAL_SERVER_ERROR'
 * 
 * All business logic error codes (set in services):
 * - HU-02: INVALID_LOAN_DAYS, BOOK_NOT_AVAILABLE, READER_HAS_DEBT
 * - HU-03/04: LOAN_NOT_FOUND, ALREADY_RETURNED, SEARCH_ERROR, UPDATE_ERROR
 * - HU-04 only: DEBT_CREATION_ERROR
 */
module.exports = function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_PAYLOAD',
      message: 'Invalid request payload',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Handle custom business logic errors with statusCode
  if (err.statusCode && err.code) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
  }

  // Handle generic errors
  return res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
