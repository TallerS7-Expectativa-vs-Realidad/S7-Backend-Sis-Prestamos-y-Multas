/**
 * Loan Repository - HU-01: Book Availability Search
 * 
 * Handles all database operations related to loans.
 * Focuses on HU-01: searching for book availability by title (case-insensitive).
 */

class LoanRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Find all loans by book title (case-insensitive)
   * Returns the most recent loan record for each unique book copy (identified by id_book).
   * Multiple copies of the same book (same title, different id_book) are returned separately.
   * 
   * @param {string} title - Book title to search for (case-insensitive)
   * @returns {Promise<Array>} Array of loan records grouped by id_book. Empty array if no matches found.
   * @throws {Error} If database query fails
   */
  async findByName(title) {
    try {
      if (!title || typeof title !== 'string' || title.trim() === '') {
        throw new Error('Title must be a non-empty string');
      }

      // Query: Get all loans matching the title (case-insensitive), 
      // ordered by id_book, then by created_at DESC to get the most recent record per copy
      const query = `
        SELECT 
          loan_id,
          id_book,
          title,
          state AS status
        FROM loan_books
        WHERE LOWER(title) LIKE LOWER($1)
        ORDER BY id_book, created_at DESC
      `;

      // Use LIKE with the title to support partial matches
      const searchPattern = `%${title}%`;
      const result = await this.pool.query(query, [searchPattern]);

      return result.rows;
    } catch (error) {
      throw new Error(`Error searching loans by title: ${error.message}`);
    }
  }
  /**
   * Check if a book is available for loan
   * A book is available if:
   * - No loan records exist for it, OR
   * - The latest loan record has state = 'RETURNED'
   */
  async isBookAvailable(id_book) {
    try {
      const query = `
        SELECT state FROM loan_books 
        WHERE id_book = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const result = await this.pool.query(query, [id_book]);
      
      // If no records exist, book is available
      if (result.rows.length === 0) {
        return true;
      }
      
      // If latest record has state = 'RETURNED', book is available
      return result.rows[0].state === 'RETURNED';
    } catch (error) {
      throw new Error(`Error checking book availability: ${error.message}`);
    }
  }

  /**
   * Find exact loan by title (case-insensitive, exact match)
   * Returns all loan records for the exact book title, grouped by id_book.
   * 
   * @param {string} title - Exact book title to search for
   * @returns {Promise<Array>} Array of loan records matching the exact title
   * @throws {Error} If database query fails
   */
  async findByNameExact(title) {
    try {
      if (!title || typeof title !== 'string' || title.trim() === '') {
        throw new Error('Title must be a non-empty string');
      }

      const query = `
        SELECT 
          loan_id,
          id_book,
          title,
          state AS status
        FROM loan_books
        WHERE LOWER(title) = LOWER($1)
        ORDER BY id_book, created_at DESC
      `;

      const result = await this.pool.query(query, [title]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error searching loans by exact title: ${error.message}`);
    }
  }

  async insertLoan(loanData) {
    try {
      const {
        id_book,
        title,
        type_id_reader,
        id_reader,
        name_reader,
        loan_days,
        date_limit,
      } = loanData;

      const query = `
        INSERT INTO loan_books 
        (id_book, title, type_id_reader, id_reader, name_reader, loan_days, state, date_limit, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `;

      const values = [
        id_book,
        title,
        type_id_reader,
        id_reader,
        name_reader,
        loan_days,
        'ON_LOAN',
        date_limit,
      ];

      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error inserting loan: ${error.message}`);
    }
  }

  async findByName(name) {
    try {
      const query = `
        SELECT DISTINCT ON (id_book)
          id_book AS id,
          title AS name,
          state AS status
        FROM loan_books
        WHERE title ILIKE $1
        ORDER BY id_book, created_at DESC
      `;

      const result = await this.pool.query(query, [`%${name}%`]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error finding loans by name: ${error.message}`);
    }
  }

  /**
   * Get a loan by ID
   */
  async getLoanById(loan_id) {
    try {
      const query = 'SELECT * FROM loan_books WHERE loan_id = $1';
      const result = await this.pool.query(query, [loan_id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting loan by ID: ${error.message}`);
    }
  }

  /**
   * Get active loan by id_book (returns most recent ON_LOAN record)
   */
  async getActiveLoanByBook(id_book) {
    try {
      const query = `
        SELECT * FROM loan_books 
        WHERE id_book = $1 AND state = 'ON_LOAN'
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const result = await this.pool.query(query, [id_book]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting active loan by book: ${error.message}`);
    }
  }

  async getLatestLoanByBook(id_book) {
    try {
      const query = `
        SELECT * FROM loan_books
        WHERE id_book = $1
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await this.pool.query(query, [id_book]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting latest loan by book: ${error.message}`);
    }
  }

  /**
   * Get active loan by id_reader (returns most recent ON_LOAN record)
   */
  async getActiveLoanByReader(id_reader) {
    try {
      const query = `
        SELECT * FROM loan_books 
        WHERE id_reader = $1 AND state = 'ON_LOAN'
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const result = await this.pool.query(query, [id_reader]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting active loan by reader: ${error.message}`);
    }
  }

  async getLatestLoanByReader(id_reader) {
    try {
      const query = `
        SELECT * FROM loan_books
        WHERE id_reader = $1
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await this.pool.query(query, [id_reader]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting latest loan by reader: ${error.message}`);
    }
  }

  /**
   * Get active loan by id_book AND id_reader (for exact match)
   */
  async getActiveLoanByBookAndReader(id_book, id_reader) {
    try {
      const query = `
        SELECT * FROM loan_books 
        WHERE id_book = $1 AND id_reader = $2 AND state = 'ON_LOAN'
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const result = await this.pool.query(query, [id_book, id_reader]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting active loan by book and reader: ${error.message}`);
    }
  }

  async getLatestLoanByBookAndReader(id_book, id_reader) {
    try {
      const query = `
        SELECT * FROM loan_books
        WHERE id_book = $1 AND id_reader = $2
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await this.pool.query(query, [id_book, id_reader]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting latest loan by book and reader: ${error.message}`);
    }
  }

  /**
   * Get active loan by title AND id_reader (for search by name)
   */
  async getActiveLoanByTitleAndReader(title, id_reader) {
    try {
      const query = `
        SELECT * FROM loan_books 
        WHERE title ILIKE $1 AND id_reader = $2 AND state = 'ON_LOAN'
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const result = await this.pool.query(query, [title, id_reader]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting active loan by title and reader: ${error.message}`);
    }
  }

  /**
   * Get active loan by title only (returns most recent ON_LOAN record with matching title)
   */
  async getActiveLoanByTitle(title) {
    try {
      const query = `
        SELECT * FROM loan_books 
        WHERE title ILIKE $1 AND state = 'ON_LOAN'
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const result = await this.pool.query(query, [title]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting active loan by title: ${error.message}`);
    }
  }

  /**
   * Find all overdue loans (HU-05)
   * Returns loans where state=ON_LOAN and date_limit < today
   * 
   * Business Rules:
   * - Exclude loans with state=RETURNED
   * - Include only loans where date_limit < today AND state=ON_LOAN
   * - Return minimal structure: loan_id, id_book, title, state, id_reader, name_reader, date_limit, date_return
   * 
   * @returns {Promise<Array>} Array of overdue loan records
   * @throws {Error} If database query fails
   */
  async findOverdue() {
    try {
      const query = `
        SELECT 
          loan_id,
          id_book,
          title,
          state,
          id_reader,
          name_reader,
          date_limit,
          date_return
        FROM loan_books
        WHERE state = 'ON_LOAN'
          AND date_limit < CURRENT_DATE
        ORDER BY date_limit ASC
      `;

      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching overdue loans: ${error.message}`);
    }
  }

  /**
   * Update loan return information
   * Sets date_return and changes state to RETURNED
   */
  async updateReturn(loan_id, date_return) {
    try {
      const query = `
        UPDATE loan_books 
        SET date_return = $1, state = 'RETURNED', updated_at = NOW()
        WHERE loan_id = $2
        RETURNING *
      `;

      const result = await this.pool.query(query, [date_return, loan_id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error updating loan return: ${error.message}`);
    }
  }
}

module.exports = LoanRepository;
