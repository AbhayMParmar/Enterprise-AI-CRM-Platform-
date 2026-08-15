import { Router } from 'express';
import { 
  createTeam, 
  getMyTeams 
} from '../controllers/teamController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All team routes require authentication
router.use(authenticate);

router.post('/', createTeam);
router.get('/', getMyTeams);

export default router;

