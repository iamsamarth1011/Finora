import express from 'express';
import { scanReceipt, generateMonthlyReport } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/scan-receipt', scanReceipt);
router.get('/report/monthly', generateMonthlyReport);

export default router;

