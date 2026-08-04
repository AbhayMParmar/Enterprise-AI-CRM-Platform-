import { Response } from 'express';
import { Notification } from '../models/Notification';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Types } from 'mongoose';

export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    let count = await Notification.countDocuments({ user: req.user.id });

    // Seed default notifications if user has none
    if (count === 0) {
      const defaultAlerts = [
        {
          user: new Types.ObjectId(req.user.id),
          type: 'info' as const,
          title: 'Welcome to AI CRM Platform',
          message: 'Your enterprise CRM workspace is active and connected to MongoDB Cloud.',
          isRead: false,
        },
        {
          user: new Types.ObjectId(req.user.id),
          type: 'deal' as const,
          title: 'Sales Pipeline Active',
          message: 'Drag-and-drop deals across 6 Kanban stages to track revenue.',
          isRead: false,
        },
        {
          user: new Types.ObjectId(req.user.id),
          type: 'success' as const,
          title: 'Groq LLaMA-3 AI Ready',
          message: 'Use the AI Copilot for sales emails and meeting note summaries.',
          isRead: false,
        },
      ];

      await Notification.insertMany(defaultAlerts);
    }

    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });

    res.status(200).json({ notifications, unreadCount });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    await Notification.findOneAndUpdate({ _id: id, user: req.user.id }, { isRead: true });

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update notification', error: error.message });
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to clear unread notifications', error: error.message });
  }
};
