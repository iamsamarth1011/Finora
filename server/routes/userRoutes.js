import express from 'express';
import { getProfile, updateProfile, upload } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/profile').get(getProfile).put(upload.single('profilePicture'), updateProfile);

export default router;

