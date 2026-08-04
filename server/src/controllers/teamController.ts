import { Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { Team } from '../models/Team';
import { User } from '../models/User';
import { Invitation } from '../models/Invitation';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { LoggerService } from '../services/loggerService';

const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
});

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  teamId: z.string().min(1, 'Team ID is required'),
  role: z.enum(['Admin', 'Member', 'SalesManager', 'SalesRep']).default('SalesRep'),
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

    // Create Team
    const newTeam = await Team.create({
      name,
      ownerId: req.user.id,
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

    // Find all teams where user is member or owner
    const teams = await Team.find({
      $or: [
        { ownerId: req.user.id },
        { 'members.userId': req.user.id }
      ]
    }).populate('ownerId', 'name email avatar')
      .populate('members.userId', 'name email avatar role');

    res.status(200).json({ teams });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch teams', error: error.message });
  }
};

export const sendInvitation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const validation = inviteSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: 'Validation error', errors: validation.error.flatten().fieldErrors });
      return;
    }

    const { email, teamId, role } = validation.data;

    // Verify requesting user is owner or admin of the team
    const team = await Team.findById(teamId);
    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }

    const isAuthorized = team.ownerId.toString() === req.user.id || 
      team.members.some(m => m.userId.toString() === req.user!.id && m.role === 'Admin');

    if (!isAuthorized) {
      res.status(403).json({ message: 'Forbidden. Only team owners or admins can invite members.' });
      return;
    }

    // Check if target user is already in the team
    const invitedUser = await User.findOne({ email });
    if (invitedUser && team.members.some(m => m.userId.toString() === invitedUser.id)) {
      res.status(400).json({ message: 'User is already a member of this team' });
      return;
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

    const invitation = await Invitation.create({
      email,
      teamId,
      role,
      invitedBy: req.user.id,
      token,
      expiresAt,
    });

    await LoggerService.log(req.user.id, 'INVITE_SEND', { email, teamId, role });

    res.status(201).json({
      message: 'Invitation generated successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to send invitation', error: error.message });
  }
};

export const getInvitations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Get invitations sent to user's email
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const invitations = await Invitation.find({
      email: user.email,
      status: 'Pending',
      expiresAt: { $gt: new Date() },
    }).populate('teamId', 'name').populate('invitedBy', 'name email');

    res.status(200).json({ invitations });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch invitations', error: error.message });
  }
};

export const acceptInvitation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { token } = req.params;

    const invite = await Invitation.findOne({ token });
    if (!invite) {
      res.status(404).json({ message: 'Invitation not found' });
      return;
    }

    if (invite.status !== 'Pending' || invite.expiresAt.getTime() < Date.now()) {
      res.status(400).json({ message: 'Invitation has expired or already processed' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user || user.email !== invite.email) {
      res.status(400).json({ message: 'Unauthorized. Invitation email does not match logged-in account.' });
      return;
    }

    const team = await Team.findById(invite.teamId);
    if (!team) {
      res.status(404).json({ message: 'Team no longer exists' });
      return;
    }

    // Add user to team members
    const teamRole = invite.role === 'Admin' ? 'Admin' : 'Member';
    team.members.push({ userId: user._id as any, role: teamRole });
    await team.save();

    // Mark invitation accepted
    invite.status = 'Accepted';
    await invite.save();

    // Update user role if invited role was higher (e.g. SalesManager, Admin, etc.)
    if (invite.role !== 'Member') {
      user.role = invite.role as any;
      await user.save();
    }

    await LoggerService.log(req.user.id, 'INVITE_ACCEPT', { teamId: team.id, inviteId: invite.id });

    res.status(200).json({ message: 'Invitation accepted. Joined team!', team });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to accept invitation', error: error.message });
  }
};

export const declineInvitation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { token } = req.params;

    const invite = await Invitation.findOne({ token });
    if (!invite) {
      res.status(404).json({ message: 'Invitation not found' });
      return;
    }

    invite.status = 'Declined';
    await invite.save();

    await LoggerService.log(req.user.id, 'INVITE_DECLINE', { inviteId: invite.id });

    res.status(200).json({ message: 'Invitation declined' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to decline invitation', error: error.message });
  }
};
