import { Response } from 'express';
import { z } from 'zod';
import { Team } from '../models/Team';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { LoggerService } from '../services/loggerService';

const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
});

export const createTeam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const validation = createTeamSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: 'Validation error', errors: validation.error.flatten().fieldErrors });
      return;
    }

    const { name } = validation.data;
    const activeCompanyId = req.companyId || req.user.companyId;

    // Create Team
    const newTeam = await Team.create({
      name,
      ownerId: req.user.id,
      companyId: activeCompanyId,
      members: [{ userId: req.user.id, role: 'Admin' }],
    });

    await LoggerService.log(req.user.id, 'TEAM_CREATE', { teamId: newTeam.id, teamName: name });

    res.status(201).json({ message: 'Team created successfully', team: newTeam });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create team', error: error.message });
  }
};

export const getMyTeams = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const query: any = {
      $or: [
        { ownerId: req.user.id },
        { 'members.userId': req.user.id }
      ]
    };

    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'SuperAdmin') {
      const activeCompanyId = req.companyId || req.user.companyId;
      if (activeCompanyId) query.companyId = activeCompanyId;
    }

    // Find all teams where user is member or owner
    const teams = await Team.find(query)
      .populate('ownerId', 'name email avatar')
      .populate('members.userId', 'name email avatar role');

    res.status(200).json({ teams });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch teams', error: error.message });
  }
};

