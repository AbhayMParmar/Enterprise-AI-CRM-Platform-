import { Router } from 'express';
import { generateEmail, summarizeNotes, copilotChat } from '../controllers/aiController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/generate-email', generateEmail);
router.post('/summarize-notes', summarizeNotes);
router.post('/copilot-chat', copilotChat);

export default router;
