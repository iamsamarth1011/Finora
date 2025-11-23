import cron from 'node-cron';
import Transaction from '../models/Transaction.js';

// Run daily at midnight (00:00)
const scheduleRecurringTransactions = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running recurring transactions job...');
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Find all active recurring transactions
      const recurringTransactions = await Transaction.find({
        isRecurring: true,
        isDeleted: false,
      }).populate('userId');

      let createdCount = 0;
      let errorCount = 0;

      for (const transaction of recurringTransactions) {
        try {
          // Check if transaction should be created today based on frequency
          let shouldCreate = false;
          const lastCreated = await Transaction.findOne({
            userId: transaction.userId,
            description: transaction.description,
            category: transaction.category,
            type: transaction.type,
            amount: transaction.amount,
            isRecurring: false,
          })
            .sort({ createdAt: -1 })
            .limit(1);

          if (!lastCreated) {
            // No previous occurrence, check if original transaction date matches pattern
            shouldCreate = checkFrequency(transaction.date, transaction.recurringFrequency, today);
          } else {
            // Check if enough time has passed since last creation
            const daysSinceLast = Math.floor((today - lastCreated.date) / (1000 * 60 * 60 * 24));
            shouldCreate = checkDaysSinceLast(daysSinceLast, transaction.recurringFrequency);
          }

          if (shouldCreate) {
            // Create new transaction
            await Transaction.create({
              userId: transaction.userId,
              type: transaction.type,
              amount: transaction.amount,
              category: transaction.category,
              description: transaction.description,
              date: today,
              isRecurring: false,
              recurringFrequency: null,
            });
            createdCount++;
            console.log(`Created recurring transaction for user ${transaction.userId}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error creating recurring transaction ${transaction._id}:`, error);
        }
      }

      console.log(
        `Recurring transactions job completed. Created: ${createdCount}, Errors: ${errorCount}`
      );
    } catch (error) {
      console.error('Error in recurring transactions cron job:', error);
    }
  });

  console.log('Recurring transactions cron job scheduled (runs daily at midnight)');
};

// Helper function to check if transaction should be created based on frequency
const checkFrequency = (originalDate, frequency, today) => {
  if (!frequency) return false;

  const original = new Date(originalDate);
  const originalDay = original.getDate();
  const originalDayOfWeek = original.getDay();
  const todayDay = today.getDate();
  const todayDayOfWeek = today.getDay();

  switch (frequency) {
    case 'daily':
      return true; // Create every day
    case 'weekly':
      return originalDayOfWeek === todayDayOfWeek; // Same day of week
    case 'monthly':
      return originalDay === todayDay; // Same day of month
    default:
      return false;
  }
};

// Helper function to check if enough days have passed
const checkDaysSinceLast = (daysSinceLast, frequency) => {
  switch (frequency) {
    case 'daily':
      return daysSinceLast >= 1;
    case 'weekly':
      return daysSinceLast >= 7;
    case 'monthly':
      return daysSinceLast >= 28; // Approximate monthly
    default:
      return false;
  }
};

export default scheduleRecurringTransactions;

