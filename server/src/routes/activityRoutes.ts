import { Router } from 'express';
import { getActivityLogs } from '../controllers/activityController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Logs require authentication
router.get('/', authenticate, getActivityLogs);

export default router;
