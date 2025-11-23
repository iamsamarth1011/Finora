import { GoogleGenerativeAI } from '@google/generative-ai';
import Transaction from '../models/Transaction.js';

// Helper function to check if Gemini is available
function isGeminiAvailable() {
  if (!process.env.GEMINI_API_KEY) {
    console.log('[Gemini Availability] GEMINI_API_KEY is not set');
    return {
      available: false,
      message: 'GEMINI_API_KEY is not set',
    };
  }
  if (!genAI) {
    console.log('[Gemini Availability] genAI instance is null or failed to initialize');
    return {
      available: false,
      message: 'Gemini AI failed to initialize or is unavailable',
    };
  }
  console.log('[Gemini Availability] Gemini is available');
  return { available: true };
}

// Initialize Gemini AI (only if API key is provided)
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('[Gemini Init] genAI instance created:', !!genAI);
  } catch (error) {
    console.warn('Warning: Gemini AI not initialized. GEMINI_API_KEY may be invalid.');
    console.log('[Gemini Init] Error:', error);
  }
} else {
  console.log('[Gemini Init] GEMINI_API_KEY not set, Gemini AI not initialized');
}

// @desc    Scan receipt and extract transaction details
// @route   POST /api/ai/scan-receipt
// @access  Private
export const scanReceipt = async (req, res) => {
  try {
    const { receiptImage } = req.body;

    if (!receiptImage) {
      console.log('[scanReceipt] No receipt image in request body');
      return res.status(400).json({ message: 'Receipt image is required' });
    }

    // Check if Gemini is available
    const geminiCheck = isGeminiAvailable();
    if (!geminiCheck.available) {
      console.log('[scanReceipt] Gemini unavailable:', geminiCheck.message);
      return res.status(503).json({
        message: 'AI receipt scanning is currently unavailable',
        error: geminiCheck.message,
        hint: 'Please set GEMINI_API_KEY in your .env file. Get your API key from https://makersuite.google.com/app/apikey',
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Extract transaction details from this receipt image. Return a JSON object with the following fields:
    - amount: numeric value only (required)
    - description: merchant name or transaction description (required)
    - category: one of these categories: Food, Shopping, Transportation, Entertainment, Bills, Healthcare, Education, Travel, Other (required)
    - date: date in YYYY-MM-DD format if available, otherwise return null

    Only return valid JSON, no additional text or markdown formatting. Example format:
    {"amount": 25.99, "description": "Coffee Shop", "category": "Food", "date": "2024-01-15"}`;

    try {
      // Handle base64 image (remove data URL prefix if present)
      let imageData = receiptImage;
      if (receiptImage.includes(',')) {
        imageData = receiptImage.split(',')[1];
      }
      console.log('[scanReceipt] Sending request to Gemini API with prompt and image data');

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageData,
            mimeType: 'image/jpeg',
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      console.log('[scanReceipt] Gemini API response text:', text);

      // Parse JSON from response
      let extractedData;
      try {
        // Try to parse as-is
        extractedData = JSON.parse(text);
        console.log('[scanReceipt] Parsed receipt data from direct JSON');
      } catch (parseError) {
        // Try to extract JSON from markdown code blocks or text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
          console.log('[scanReceipt] Parsed receipt data from extracted JSON substring');
        } else {
          console.error('[scanReceipt] Could not parse AI response:', parseError);
          throw new Error('Could not parse AI response');
        }
      }

      // Validate and format response
      const formattedData = {
        amount: parseFloat(extractedData.amount) || null,
        description: extractedData.description || '',
        category: extractedData.category || 'Other',
        date: extractedData.date || null,
      };

      console.log('[scanReceipt] Final formattedData:', formattedData);

      res.json({
        success: true,
        data: formattedData,
      });
    } catch (aiError) {
      console.error('Gemini API error in scanReceipt:', aiError);

      // Check for API key errors specifically
      if (aiError.message && aiError.message.includes('API key')) {
        console.log('[scanReceipt] Gemini API key error detected, returning 503');
        return res.status(503).json({
          message: 'AI receipt scanning is currently unavailable',
          error: 'Invalid or missing Gemini API key',
          hint: 'Please set a valid GEMINI_API_KEY in your .env file. Get your API key from https://makersuite.google.com/app/apikey',
        });
      }

      res.status(500).json({
        message: 'Failed to process receipt image',
        error: aiError.message,
      });
    }
  } catch (error) {
    console.error('Scan receipt error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate monthly financial report using AI
// @route   GET /api/ai/report/monthly
// @access  Private
export const generateMonthlyReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;

    if (!month || !year) {
      console.log('[generateMonthlyReport] Month or year missing in query');
      return res.status(400).json({ message: 'Month and year are required' });
    }

    // Get start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    console.log(`[generateMonthlyReport] Finding transactions for user ${userId} between ${startDate.toISOString()} and ${endDate.toISOString()}`);

    // Fetch all transactions for the month
    const transactions = await Transaction.find({
      userId,
      isDeleted: false,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    console.log(`[generateMonthlyReport] ${transactions.length} transactions found`);

    if (transactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found for this month' });
    }

    // Calculate basic statistics
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;
    const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(2) : 0;

    // Group by category
    const categoryBreakdown = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
      });

    // Prepare data for AI analysis
    const transactionData = transactions.map((t) => ({
      date: t.date.toISOString().split('T')[0],
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
    }));

    // Check if Gemini is available
    const geminiCheck = isGeminiAvailable();
    if (!geminiCheck.available) {
      console.log('[generateMonthlyReport] Gemini unavailable:', geminiCheck.message);
      // Return basic report without AI analysis
      return res.json({
        success: true,
        month: parseInt(month),
        year: parseInt(year),
        report: {
          summary: {
            totalIncome: income,
            totalExpenses: expenses,
            balance: balance,
            savingsRate: parseFloat(savingsRate),
          },
          topSpendingCategories: Object.entries(categoryBreakdown)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([cat, amt]) => ({ category: cat, amount: amt })),
          financialHealthScore: income > 0 ? Math.min(100, Math.max(0, (balance / income) * 100)) : 0,
          insights: 'AI analysis is currently unavailable. Please set GEMINI_API_KEY in your .env file to enable AI-powered insights.',
          recommendations: [
            'Track expenses regularly',
            'Set a monthly budget',
            'Review and reduce unnecessary expenses',
          ],
        },
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analyze the following financial transactions for ${new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}:

Total Income: ₹${income.toFixed(2)}
Total Expenses: ₹${expenses.toFixed(2)}
Balance: ₹${balance.toFixed(2)}
Savings Rate: ${savingsRate}%

Category Breakdown:
${Object.entries(categoryBreakdown)
  .map(([cat, amt]) => `- ${cat}: ₹${amt.toFixed(2)}`)
  .join('\n')}

Transaction Details:
${JSON.stringify(transactionData, null, 2)}

Provide a comprehensive financial analysis report in JSON format with the following structure:
{
  "summary": {
    "totalIncome": ${income},
    "totalExpenses": ${expenses},
    "balance": ${balance},
    "savingsRate": ${savingsRate}
  },
  "topSpendingCategories": [array of top 3 categories with amounts],
  "financialHealthScore": number between 0-100,
  "insights": "detailed insights about spending patterns",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

Only return valid JSON, no additional text or markdown.`;

    try {
      console.log('[generateMonthlyReport] Sending request to Gemini API');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('[generateMonthlyReport] Gemini API response text:', text);

      // Parse JSON from response
      let reportData;
      try {
        reportData = JSON.parse(text);
        console.log('[generateMonthlyReport] Parsed report data from direct JSON');
      } catch (parseError) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          reportData = JSON.parse(jsonMatch[0]);
          console.log('[generateMonthlyReport] Parsed report data from extracted JSON substring');
        } else {
          // Fallback to basic report if AI parsing fails
          console.warn('[generateMonthlyReport] Could not parse AI response:', parseError);
          reportData = {
            summary: {
              totalIncome: income,
              totalExpenses: expenses,
              balance: balance,
              savingsRate: parseFloat(savingsRate),
            },
            topSpendingCategories: Object.entries(categoryBreakdown)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([cat, amt]) => ({ category: cat, amount: amt })),
            financialHealthScore: income > 0 ? Math.min(100, Math.max(0, (balance / income) * 100)) : 0,
            insights: 'Analyze your spending patterns to improve financial health.',
            recommendations: [
              'Track expenses regularly',
              'Set a monthly budget',
              'Review and reduce unnecessary expenses',
            ],
          };
        }
      }

      // Fix: Ensure that topSpendingCategories has at least the correct structure and that summary.savingsRate is a number (not string)
      if (reportData && reportData.summary && typeof reportData.summary.savingsRate === 'string') {
        // Convert savingsRate to number
        reportData.summary.savingsRate = parseFloat(reportData.summary.savingsRate);
      }
      if (reportData && Array.isArray(reportData.topSpendingCategories)) {
        // Ensure each category entry has the right keys and types
        reportData.topSpendingCategories = reportData.topSpendingCategories.map(cat => {
          if (cat && typeof cat === 'object') {
            return {
              category: cat.category || 'Other',
              amount: typeof cat.amount === 'number' ? cat.amount : parseFloat(cat.amount) || 0
            };
          }
          return { category: 'Other', amount: 0 };
        });
      }

      res.json({
        success: true,
        month: parseInt(month),
        year: parseInt(year),
        report: reportData,
      });
    } catch (aiError) {
      console.error('Gemini API error in generateMonthlyReport:', aiError);

      // Check for API key errors specifically
      if (aiError.message && aiError.message.includes('API key')) {
        console.log('[generateMonthlyReport] Gemini API key error detected, returning basic report with helpful message');
        // Return basic report with helpful message
        return res.json({
          success: true,
          month: parseInt(month),
          year: parseInt(year),
          report: {
            summary: {
              totalIncome: income,
              totalExpenses: expenses,
              balance: balance,
              savingsRate: parseFloat(savingsRate),
            },
            topSpendingCategories: Object.entries(categoryBreakdown)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([cat, amt]) => ({ category: cat, amount: amt })),
            financialHealthScore: income > 0 ? Math.min(100, Math.max(0, (balance / income) * 100)) : 0,
            insights: 'AI analysis is currently unavailable. Please set a valid GEMINI_API_KEY in your .env file to enable AI-powered insights.',
            recommendations: [
              'Track expenses regularly',
              'Set a monthly budget',
              'Review and reduce unnecessary expenses',
            ],
          },
        });
      }

      // Return basic report if AI fails
      res.json({
        success: true,
        month: parseInt(month),
        year: parseInt(year),
        report: {
          summary: {
            totalIncome: income,
            totalExpenses: expenses,
            balance: balance,
            savingsRate: parseFloat(savingsRate),
          },
          topSpendingCategories: Object.entries(categoryBreakdown)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([cat, amt]) => ({ category: cat, amount: amt })),
          financialHealthScore: income > 0 ? Math.min(100, Math.max(0, (balance / income) * 100)) : 0,
          insights: 'AI analysis temporarily unavailable. Basic statistics provided.',
          recommendations: [
            'Track expenses regularly',
            'Set a monthly budget',
            'Review and reduce unnecessary expenses',
          ],
        },
      });
    }
  } catch (error) {
    console.error('Generate monthly report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
