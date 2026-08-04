import { Router } from 'express';
import { register, login, logout, refreshToken, googleLogin, forgotPassword, verifyResetOtp, resetPassword } from '../controllers/authController';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { Response } from 'express';
import { forgotPasswordRateLimit, otpVerificationRateLimit, resetPasswordRateLimit } from '../middlewares/rateLimit';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.post('/google-login', googleLogin);

// Password reset endpoints with rate limiting
router.post('/forgot-password', forgotPasswordRateLimit, forgotPassword);
router.post('/verify-reset-otp', otpVerificationRateLimit, verifyResetOtp);
router.post('/reset-password', resetPasswordRateLimit, resetPassword);

// Protected routes to verify token and fetch active user session
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error retrieving current session', error: error.message });
  }
});

export default router;
