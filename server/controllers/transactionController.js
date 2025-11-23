import Transaction from '../models/Transaction.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI (only if API key is provided)
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (error) {
    console.warn('Warning: Gemini AI not initialized. GEMINI_API_KEY may be invalid.');
  }
}

// @desc    Get all transactions for a user
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      category,
      type,
      search,
    } = req.query;

    // Build query
    const query = { userId, isDeleted: false };

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Type filter
    if (type) {
      query.type = type;
    }

    // Search filter (description)
    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get transactions
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'name email');

    // Get total count
    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
export const createTransaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, amount, category, description, date, receiptImage, isRecurring, recurringFrequency } = req.body;

    // Validation
    if (!type || !amount || !category) {
      return res.status(400).json({ message: 'Please provide type, amount, and category' });
    }

    // If receipt image provided, extract data using Gemini AI
    let extractedData = {};
    if (receiptImage) {
      try {
        extractedData = await extractReceiptData(receiptImage);
        // Merge extracted data with provided data (provided data takes precedence)
        Object.assign(req.body, extractedData);
      } catch (error) {
        console.error('Receipt extraction error:', error);
        // Continue without extracted data if extraction fails
      }
    }

    const transaction = await Transaction.create({
      userId,
      type,
      amount: parseFloat(amount),
      category,
      description: description || extractedData.description || '',
      date: date ? new Date(date) : new Date(),
      receiptImage: receiptImage || null,
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || null,
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Find transaction and verify ownership
    const transaction = await Transaction.findOne({ _id: id, userId, isDeleted: false });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Update transaction
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      {
        ...req.body,
        amount: req.body.amount ? parseFloat(req.body.amount) : transaction.amount,
        date: req.body.date ? new Date(req.body.date) : transaction.date,
      },
      { new: true, runValidators: true }
    );

    res.json(updatedTransaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Find transaction and verify ownership
    const transaction = await Transaction.findOne({ _id: id, userId, isDeleted: false });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Soft delete
    transaction.isDeleted = true;
    await transaction.save();

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to extract receipt data using Gemini AI
const extractReceiptData = async (receiptImage) => {
  // Check if Gemini is available
  if (!genAI || !process.env.GEMINI_API_KEY) {
    console.warn('Gemini AI not available for receipt extraction');
    return {}; // Return empty object if AI is not available
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    const prompt = `Extract transaction details from this receipt image. Return a JSON object with the following fields:
    - amount: numeric value only
    - description: merchant name or transaction description
    - category: one of these categories: Food, Shopping, Transportation, Entertainment, Bills, Healthcare, Education, Travel, Other
    - date: date in YYYY-MM-DD format if available, otherwise use today's date
    
    Only return valid JSON, no additional text.`;

    // Note: Gemini Pro Vision expects base64 image data
    // You may need to adjust this based on how images are sent
    const result = await model.generateContent([prompt, { inlineData: { data: receiptImage, mimeType: 'image/jpeg' } }]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {};
  } catch (error) {
    console.error('Gemini extraction error:', error);
    // Don't throw error, just return empty object so transaction can still be created
    if (error.message && error.message.includes('API key')) {
      console.warn('Invalid Gemini API key. Receipt extraction skipped.');
    }
    return {}; // Return empty object on error
  }
};

