const { z } = require('zod');

// Validation schema for debt queries
const debtQuerySchema = z.object({
  id_reader: z.string().min(1, 'id_reader is required'),
});

// Response schema for debt
const debtResponseSchema = z.object({
  id_debt: z.number(),
  loan_id: z.number(),
  type_id_reader: z.string(),
  id_reader: z.string(),
  name_reader: z.string(),
  units_fib: z.number(),
  amount_debt: z.number(),
  state_debt: z.string(),
  created_at: z.string().datetime(),
});

module.exports = {
  debtQuerySchema,
  debtResponseSchema,
};
