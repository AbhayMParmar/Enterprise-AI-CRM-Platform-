import { Router } from 'express';
import { 
  createTeam, 
  getMyTeams, 
  sendInvitation, 
  acceptInvitation, 
  declineInvitation, 
  getInvitations 
} from '../controllers/teamController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All team routes require authentication
router.use(authenticate);

router.post('/', createTeam);
router.get('/', getMyTeams);
router.post('/invite', sendInvitation);
router.get('/invitations', getInvitations);
router.post('/invitations/:token/accept', acceptInvitation);
router.post('/invitations/:token/decline', declineInvitation);

export default router;
