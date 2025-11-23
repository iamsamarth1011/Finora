import Transaction from '../models/Transaction.js';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

// @desc    Import transactions from CSV file
// @route   POST /api/transactions/import-csv
// @access  Private
export const importCSV = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: 'CSV file is required' });
    }

    const transactions = [];
    const errors = [];
    let rowNumber = 0;

    // Parse CSV file
    const results = await new Promise((resolve, reject) => {
      const rows = [];
      const stream = Readable.from(req.file.buffer.toString());

      stream
        .pipe(csvParser())
        .on('data', (row) => {
          rowNumber++;
          rows.push({ ...row, rowNumber });
        })
        .on('end', () => resolve(rows))
        .on('error', (error) => reject(error));
    });

    // Validate and process each row
    for (const row of results) {
      try {
        // Expected CSV format: date, type, amount, category, description
        const { date, type, amount, category, description } = row;

        // Validation
        if (!date || !type || !amount || !category) {
          errors.push({
            row: row.rowNumber || rowNumber,
            error: 'Missing required fields: date, type, amount, or category',
            data: row,
          });
          continue;
        }

        if (!['income', 'expense'].includes(type.toLowerCase())) {
          errors.push({
            row: row.rowNumber || rowNumber,
            error: 'Type must be "income" or "expense"',
            data: row,
          });
          continue;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum < 0) {
          errors.push({
            row: row.rowNumber || rowNumber,
            error: 'Amount must be a valid positive number',
            data: row,
          });
          continue;
        }

        // Parse date
        let transactionDate;
        try {
          transactionDate = new Date(date);
          if (isNaN(transactionDate.getTime())) {
            throw new Error('Invalid date');
          }
        } catch (dateError) {
          errors.push({
            row: row.rowNumber || rowNumber,
            error: 'Invalid date format',
            data: row,
          });
          continue;
        }

        transactions.push({
          userId,
          type: type.toLowerCase(),
          amount: amountNum,
          category: category.trim(),
          description: description ? description.trim() : '',
          date: transactionDate,
        });
      } catch (error) {
        errors.push({
          row: row.rowNumber || rowNumber,
          error: error.message,
          data: row,
        });
      }
    }

    // Bulk insert valid transactions
    let insertedCount = 0;
    if (transactions.length > 0) {
      try {
        const result = await Transaction.insertMany(transactions, { ordered: false });
        insertedCount = result.length;
      } catch (insertError) {
        // Some transactions might have failed, but some might have succeeded
        if (insertError.writeErrors) {
          insertedCount = transactions.length - insertError.writeErrors.length;
          insertError.writeErrors.forEach((err) => {
            errors.push({
              row: 'Unknown',
              error: err.errmsg || 'Insert failed',
              data: transactions[err.index],
            });
          });
        } else {
          throw insertError;
        }
      }
    }

    res.json({
      success: true,
      summary: {
        totalRows: results.length,
        successCount: insertedCount,
        failedCount: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

