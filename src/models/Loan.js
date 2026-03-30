/**
 * Loan Models - HU-01: Book Availability Search
 * 
 * DTOs and validations for loan-related operations.
 * Intentionally minimal to focus on HU-01 requirements.
 */

const { z } = require('zod');

/**
 * DTO for loan search result
 * Represents the availability status of a book copy
 * Note: Each id_book represents a physical copy of the book. Same title + different id_book = different copy.
 */
const LoanSearchResultDTO = z.object({
  id_book: z.string().min(1, 'Book ID is required'),
  loan_id: z.number().int().positive().nullable().optional(),
  status: z.enum(['ON_LOAN', 'RETURNED'], 'Status must be ON_LOAN or RETURNED'),
  message: z.string().optional(),
});

/**
 * DTO for search response
 */
const SearchByNameResponseDTO = z.object({
  results: z.array(LoanSearchResultDTO),
  message: z.string().optional(),
});

/**
 * Validation Schemas for Loan Operations
 * 
 * Strategy for error codes:
 * - Zod handles payload structure validation → returns INVALID_PAYLOAD (400)
 * - Services handle business logic validation → returns specific codes (INVALID_LOAN_DAYS, etc.)
 * 
 * This allows different error responses:
 * - INVALID_PAYLOAD: for malformed requests (missing fields, wrong types)
 * - INVALID_LOAN_DAYS: for invalid values (7, 14, 21 only) - HU-02
 * - BOOK_NOT_AVAILABLE: for business rule violation - HU-02
 * - READER_HAS_DEBT: for business rule violation - HU-02
 * - LOAN_NOT_FOUND, ALREADY_RETURNED: for state validation - HU-03/04
 */
// Validation schema for loan creation request - HU-02
const createLoanSchema = z.object({
  id_book: z.string().min(1, 'id_book is required'),
  title: z.string().min(1, 'title is required'),
  type_id_reader: z.enum(['CI', 'DNI']).refine(
    (val) => val !== undefined,
    'type_id_reader must be either CI or DNI'
  ),
  id_reader: z.string().min(1, 'id_reader is required'),
  name_reader: z.string().min(1, 'name_reader is required'),
  // NOTE: loan_days validation is intentionally permissive here (not enum)
  // Specific validation (INVALID_LOAN_DAYS, 400) happens in LoanService.createLoan()
  // This allows the service to throw the business-specific error code
  // instead of a generic INVALID_PAYLOAD error
  loan_days: z.union([z.string(), z.number()]).transform(val => {
    const numVal = Number(val);
    return isNaN(numVal) ? val : numVal;
  }),
});

// Validation schema for loan return (HU-03 and HU-04)
// Rules:
// - id_book and id_reader: at least one must be provided (both cannot be null/empty)
// - name_reader: can be null ONLY if id_book is provided
// - type_id_reader: always required (CI or DNI)
// - date_return: always required (format: YYYY-MM-DD and valid calendar date)
// - base_fib_amount: optional, defaults to backend config if not provided (minimum 0.01)
const returnLoanSchema = z.object({
  date_return: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date_return must be in YYYY-MM-DD format')
    .refine((dateStr) => {
      // Validate that it's a real calendar date
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      // Check if date is valid by comparing parsed components
      return date.getFullYear() === year && 
             date.getMonth() === month - 1 && 
             date.getDate() === day;
    }, 'date_return must be a valid calendar date'),
  type_id_reader: z.enum(['CI', 'DNI']).refine(
    (val) => val !== undefined,
    'type_id_reader must be either CI or DNI'
  ),
  id_book: z.union([z.number().int().positive(), z.string().min(1)]).optional().nullable(),
  id_reader: z.union([z.number().int().positive(), z.string().min(1)]).optional().nullable(),
  name_reader: z.string().optional().nullable(),
  base_fib_amount: z.number().positive('base_fib_amount must be a positive number').optional(),
}).refine(
  (data) => {
    // At least one of id_book or id_reader must be provided
    const hasIdBook = data.id_book !== null && data.id_book !== undefined && String(data.id_book).trim() !== '';
    const hasIdReader = data.id_reader !== null && data.id_reader !== undefined && String(data.id_reader).trim() !== '';
    return hasIdBook || hasIdReader;
  },
  {
    message: 'At least one of id_book or id_reader must be provided',
    path: ['id_book', 'id_reader'],
  }
).refine(
  (data) => {
    // name_reader can be null ONLY if id_book is provided
    const hasIdBook = data.id_book !== null && data.id_book !== undefined && String(data.id_book).trim() !== '';
    const nameReaderEmpty = !data.name_reader || String(data.name_reader).trim() === '';
    
    // If name_reader is empty, id_book MUST be provided
    if (nameReaderEmpty) {
      return hasIdBook;
    }
    return true;
  },
  {
    message: 'name_reader can only be null/empty if id_book is provided',
    path: ['name_reader'],
  }
);


// Response schema for loan creation
const loanResponseSchema = z.object({
  loan_id: z.number(),
  id_book: z.string(),
  title: z.string(),
  type_id_reader: z.string(),
  id_reader: z.string(),
  name_reader: z.string(),
  loan_days: z.number(),
  state: z.string(),
  date_limit: z.string().datetime(),
  date_return: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});


module.exports = {
  LoanSearchResultDTO,
  SearchByNameResponseDTO,
  createLoanSchema,
  returnLoanSchema,
  loanResponseSchema,
};
