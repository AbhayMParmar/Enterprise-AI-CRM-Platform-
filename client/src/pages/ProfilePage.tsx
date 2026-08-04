import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building,
  Briefcase,
  Shield,
  ShieldCheck,
  Key,
  Smartphone,
  LogOut,
  Camera,
  Trash2,
  Upload,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Lock,
  X,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import useAuthStore, { UserSession } from '../store/authStore';
import api from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';

// ─── Type Definitions ─────────────────────────────────────────────────────────

interface ProfileDetails {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  phone: string;
  company: string;
  jobTitle: string;
  isVerified: boolean;
  googleId: string | null;
  isGoogleConnected: boolean;
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
}

interface SecurityDetails {
  twoFactorEnabled: boolean;
  activeSessions: number;
  authProvider: string;
}

// ─── Skeleton Loader Components ───────────────────────────────────────────────

const SkeletonLine = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
);

const ProfileSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Left Card */}
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col items-center gap-4">
      <SkeletonLine className="w-24 h-24 !rounded-full" />
      <SkeletonLine className="w-32 h-4" />
      <SkeletonLine className="w-24 h-3" />
      <div className="w-full space-y-3 pt-4 border-t border-slate-100">
        <SkeletonLine className="w-full h-4" />
        <SkeletonLine className="w-full h-4" />
        <SkeletonLine className="w-full h-4" />
      </div>
    </div>
    {/* Right Column */}
    <div className="lg:col-span-2 flex flex-col gap-6">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <SkeletonLine className="w-48 h-5" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonLine className="w-24 h-3" />
              <SkeletonLine className="w-full h-9" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <SkeletonLine className="w-48 h-5" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonLine key={i} className="w-full h-14" />
        ))}
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useAuthStore();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [security, setSecurity] = useState<SecurityDetails | null>(null);

  // Form state
  const [formData, setFormData] = useState({ name: '', phone: '', company: '', jobTitle: '' });

  // Avatar modal
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Email modal
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailStep, setEmailStep] = useState<'request' | 'verify'>('request');
  const [newEmail, setNewEmail] = useState('');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isRequestingEmail, setIsRequestingEmail] = useState(false);

  // Logout all
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  // Delete Account modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getInitials = useCallback((nameStr: string) => {
    if (!nameStr) return 'CR';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return nameStr.substring(0, 2).toUpperCase();
  }, []);

  const avatarDisplay = useMemo(() => {
    if (profile?.avatar) return profile.avatar;
    return null;
  }, [profile?.avatar]);

  // ─── API: Fetch Profile ──────────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile');
      const pData = res.data.data?.user ?? res.data.user;
      const sData = res.data.data?.security ?? res.data.security;

      // Derive hasPassword by attempting a separate select (or use authProvider)
      const derived: ProfileDetails = {
        ...pData,
        hasPassword: sData?.authProvider === 'Email/Password',
      };

      setProfile(derived);
      setSecurity(sData);
      setFormData({
        name: pData.name || '',
        phone: pData.phone || '',
        company: pData.company || '',
        jobTitle: pData.jobTitle || '',
      });
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ─── API: Update Profile ─────────────────────────────────────────────────────

  const handleUpdateProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/profile', formData);
      const updatedUser = res.data.data ?? res.data.user;
      setProfile(prev => prev ? { ...prev, ...updatedUser } : null);
      if (user) {
        login(useAuthStore.getState().accessToken || '', { ...user, name: updatedUser.name } as UserSession);
      }
      success('Profile updated successfully!');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }, [formData, user, login, success, error]);

  // ─── Avatar: File Validation ─────────────────────────────────────────────────

  const validateAndPreviewFile = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      error('Image size exceeds 5 MB. Please select a smaller file.');
      return;
    }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      error('Unsupported format. Please use JPG, PNG, or WEBP.');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }, [error]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndPreviewFile(file);
  }, [validateAndPreviewFile]);

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndPreviewFile(file);
  }, [validateAndPreviewFile]);

  // ─── API: Upload Avatar (multipart FormData) ──────────────────────────────────

  const handleUploadAvatar = useCallback(async () => {
    if (!selectedFile) return;
    try {
      setIsUploadingAvatar(true);
      setUploadProgress(0);

      const formDataObj = new FormData();
      formDataObj.append('avatar', selectedFile);

      const res = await api.post('/profile/upload-avatar', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress(pct);
          }
        },
      });

      const newAvatar = res.data.data?.avatar ?? res.data.avatar;
      setProfile(prev => prev ? { ...prev, avatar: newAvatar } : null);
      if (user) login(useAuthStore.getState().accessToken || '', { ...user, avatar: newAvatar });

      success('Profile picture updated successfully!');
      setIsAvatarModalOpen(false);
      setPreviewAvatar(null);
      setSelectedFile(null);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to upload picture. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
      setUploadProgress(0);
    }
  }, [selectedFile, user, login, success, error]);

  // ─── API: Remove Avatar ───────────────────────────────────────────────────────

  const handleRemoveAvatar = useCallback(async () => {
    try {
      setIsUploadingAvatar(true);
      await api.delete('/profile/avatar');
      setProfile(prev => prev ? { ...prev, avatar: '' } : null);
      if (user) login(useAuthStore.getState().accessToken || '', { ...user, avatar: '' });
      success('Profile picture removed.');
      setIsAvatarModalOpen(false);
      setPreviewAvatar(null);
      setSelectedFile(null);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to remove picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [user, login, success, error]);

  // ─── API: Change Password ─────────────────────────────────────────────────────

  const handleChangePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    try {
      setIsChangingPassword(true);
      await api.put('/profile/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      success('Password updated successfully!');
      setIsPasswordModalOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  }, [passwordData, success]);

  // ─── API: Request Email Change ────────────────────────────────────────────────

  const handleRequestEmailChange = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    try {
      setIsRequestingEmail(true);
      const res = await api.post('/profile/request-email-change', {
        newEmail,
        password: currentPasswordForEmail || undefined,
      });
      success(res.data.message || 'Verification code sent!');
      setEmailStep('verify');
    } catch (err: any) {
      setEmailError(err.response?.data?.message || 'Failed to send verification email.');
    } finally {
      setIsRequestingEmail(false);
    }
  }, [newEmail, currentPasswordForEmail, success]);

  // ─── API: Verify Email OTP ────────────────────────────────────────────────────

  const handleVerifyEmailOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    // Client-side validation: must be exactly 6 digits
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setEmailError('Please enter a valid 6-digit verification code.');
      return;
    }

    try {
      setIsRequestingEmail(true);
      // Always send OTP as a trimmed string
      const res = await api.put('/profile/verify-email-change', { otp: otpCode.trim() });
      const updatedUser = res.data.data?.user ?? res.data.user;

      setProfile(prev => prev ? { ...prev, email: updatedUser.email } : null);
      if (user) login(useAuthStore.getState().accessToken || '', { ...user, email: updatedUser.email });

      success('Email updated successfully!');
      setIsEmailModalOpen(false);
      setEmailStep('request');
      setNewEmail('');
      setCurrentPasswordForEmail('');
      setOtpCode('');
    } catch (err: any) {
      setEmailError(err.response?.data?.message || 'Failed to verify code. Please try again.');
    } finally {
      setIsRequestingEmail(false);
    }
  }, [otpCode, user, login, success]);

  // ─── API: Logout All Devices ──────────────────────────────────────────────────

  const handleLogoutAll = useCallback(async () => {
    try {
      setIsLoggingOutAll(true);
      await api.post('/profile/logout-all');
      success('Logged out from all active sessions.');
      setSecurity(prev => prev ? { ...prev, activeSessions: 1 } : null);
    } catch {
      error('Failed to terminate sessions.');
    } finally {
      setIsLoggingOutAll(false);
    }
  }, [success, error]);

  // ─── API: Delete Account ──────────────────────────────────────────────────────

  const handleDeleteAccount = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion.');
      return;
    }
    try {
      setIsDeletingAccount(true);
      await api.delete('/profile/account', {
        data: {
          confirmText: 'DELETE',
          password: deletePassword || undefined,
        },
      });
      success('Your account has been permanently deleted.');
      logout();
      navigate('/');
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  }, [deleteConfirmText, deletePassword, logout, navigate, success]);

  // ─── Render: Loading Skeleton ─────────────────────────────────────────────────

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-[#F8FAFC] p-3 sm:p-6 max-w-5xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <SkeletonLine className="w-16 h-8" />
          <div className="space-y-2">
            <SkeletonLine className="w-56 h-5" />
            <SkeletonLine className="w-80 h-3" />
          </div>
        </div>
        <ProfileSkeleton />
      </motion.div>
    );
  }

  // ─── Render: Main Page ────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="min-h-screen bg-[#F8FAFC] p-3 sm:p-6 text-slate-800 font-sans max-w-5xl mx-auto selection:bg-blue-500 selection:text-white"
    >
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-xs cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Enterprise Profile &amp; Security
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage your personal information, role permissions, and authentication security.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{profile?.role} Account</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Column: Avatar & Overview ─────────────────────────────────── */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-20 sm:h-24 bg-gradient-to-r from-blue-600 to-indigo-600 pointer-events-none" />

            {/* Avatar */}
            <div className="relative mt-6 sm:mt-8 mb-3 sm:mb-4">
              {avatarDisplay ? (
                <img
                  src={avatarDisplay}
                  alt={profile?.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full border-4 border-white shadow-md object-cover"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full border-4 border-white shadow-md bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-extrabold text-xl sm:text-2xl tracking-widest">
                  {getInitials(profile?.name || '')}
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute bottom-0 right-0 p-1.5 sm:p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md border-2 border-white transition-all transform hover:scale-110 cursor-pointer"
                title="Manage Profile Photo"
              >
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate px-2">{profile?.name}</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mb-2 sm:mb-3 truncate px-2">{profile?.email}</p>

            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 mb-3 sm:mb-4">
              <span className="px-2 py-0.5 sm:px-2.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] sm:text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Verified
              </span>
              {profile?.isGoogleConnected ? (
                <span className="px-2 py-0.5 sm:px-2.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] sm:text-[11px] font-semibold flex items-center gap-1">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Google Linked
                </span>
              ) : (
                <span className="px-2 py-0.5 sm:px-2.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] sm:text-[11px] font-medium">
                  Standard Password
                </span>
              )}
            </div>

            <div className="w-full pt-4 border-t border-slate-100 flex flex-col gap-2.5 text-xs text-slate-600 text-left">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400"><Calendar className="w-3.5 h-3.5" /> Member Since</span>
                <span className="font-semibold text-slate-700">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400"><Clock className="w-3.5 h-3.5" /> Last Active</span>
                <span className="font-semibold text-slate-700">
                  {profile?.lastLogin
                    ? new Date(profile.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just Now'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400"><Smartphone className="w-3.5 h-3.5" /> Active Sessions</span>
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {security?.activeSessions || 1} Device{(security?.activeSessions || 1) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Personal Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-blue-600" />
                Personal &amp; Professional Information
              </h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="Your full name"
                    required
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Email (read-only + change button) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Read-only)</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={profile?.email || ''}
                      readOnly
                      disabled
                      className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed font-medium"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="+1 (555) 000-0000"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Company */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.company}
                    onChange={e => setFormData(p => ({ ...p, company: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="Acme CRM Global"
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={e => setFormData(p => ({ ...p, jobTitle: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="Senior Sales Executive"
                  />
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Role (read-only) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned RBAC Role</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile?.role || ''}
                    readOnly
                    disabled
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed font-medium"
                  />
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="sm:col-span-2 pt-2 flex justify-end">
                <Button
                  type="submit"
                  isLoading={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Account Security Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Account Security &amp; Credentials
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              {/* Change Password */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600"><Key className="w-5 h-5" /></div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Account Password</h4>
                    <p className="text-[11px] text-slate-500">
                      {profile?.hasPassword ? 'Password-based authentication active' : 'Signed in via Google OAuth'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  disabled={!profile?.hasPassword}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Change Password
                </button>
              </div>

              {/* Google Auth Status */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-50">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Google Authentication</h4>
                    <p className="text-[11px] text-slate-500">
                      {profile?.isGoogleConnected ? 'Google account linked successfully' : 'Not linked to Google'}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${profile?.isGoogleConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                  {profile?.isGoogleConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* 2FA UI-Ready Placeholder */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600"><Smartphone className="w-5 h-5" /></div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Two-Factor Authentication (2FA)</h4>
                    <p className="text-[11px] text-slate-500">Add an extra layer of security via OTP authenticator apps.</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">UI Ready</span>
              </div>

              {/* Logout All Devices */}
              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-rose-100 text-rose-600"><LogOut className="w-5 h-5" /></div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Active Sessions</h4>
                    <p className="text-[11px] text-slate-500">Sign out of all mobile &amp; desktop browser sessions.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutAll}
                  disabled={isLoggingOutAll}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoggingOutAll ? 'Revoking...' : 'Logout All Devices'}
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone: Delete Account — hidden for SuperAdmin */}
          {profile?.role !== 'SuperAdmin' && (
            <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-red-100">
                <h3 className="text-base font-bold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Danger Zone
                </h3>
              </div>
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-red-800">Delete Account Permanently</h4>
                  <p className="text-[11px] text-red-600 mt-0.5">
                    This will permanently delete your account, all data, sessions, and uploads. This action cannot be undone.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ════ AVATAR MODAL ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-xl relative"
            >
              <button
                type="button"
                onClick={() => { setIsAvatarModalOpen(false); setPreviewAvatar(null); setSelectedFile(null); }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-bold text-slate-900 mb-4">Manage Profile Photo</h3>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 mb-4 transition-all cursor-pointer
                  ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
                `}
              >
                {/* Preview or Initials */}
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-400 mb-3 flex items-center justify-center bg-slate-100">
                  {previewAvatar ? (
                    <img src={previewAvatar} alt="Preview" className="w-full h-full object-cover" />
                  ) : profile?.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-slate-600">{getInitials(profile?.name || '')}</span>
                  )}
                </div>

                {!selectedFile && (
                  <>
                    <p className="text-xs font-semibold text-slate-600">
                      {isDragOver ? 'Drop your image here' : 'Drag & drop or click to select'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Supported: JPG, PNG, WEBP · Max 5 MB</p>
                  </>
                )}
                {selectedFile && (
                  <p className="text-xs font-semibold text-slate-700 text-center">{selectedFile.name}</p>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
              />

              {/* Upload Progress */}
              {isUploadingAvatar && uploadProgress > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Select Image
                </button>

                {profile?.avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar}
                    className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}
              </div>

              {selectedFile && (
                <div className="mt-3">
                  <Button
                    type="button"
                    onClick={handleUploadAvatar}
                    isLoading={isUploadingAvatar}
                    className="w-full bg-blue-600 text-white text-xs font-bold"
                  >
                    Save Photo
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════ CHANGE PASSWORD MODAL ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-xl relative"
            >
              <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" /> Change Password
              </h3>
              {passwordError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" /><span>{passwordError}</span>
                </div>
              )}
              <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field, i) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {['Current Password', 'New Password', 'Confirm New Password'][i]}
                    </label>
                    <input
                      type="password"
                      value={passwordData[field]}
                      onChange={e => setPasswordData(p => ({ ...p, [field]: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>
                ))}
                <div className="pt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">Cancel</button>
                  <Button type="submit" isLoading={isChangingPassword} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold">Update Password</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════ CHANGE EMAIL MODAL ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isEmailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-xl relative"
            >
              <button type="button" onClick={() => { setIsEmailModalOpen(false); setEmailStep('request'); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" /> Change Email Address
              </h3>
              {emailError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" /><span>{emailError}</span>
                </div>
              )}

              {emailStep === 'request' ? (
                <form onSubmit={handleRequestEmailChange} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">New Email Address</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="newname@company.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>
                  {profile?.hasPassword && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password (Security Check)</label>
                      <input
                        type="password"
                        value={currentPasswordForEmail}
                        onChange={e => setCurrentPasswordForEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        required
                      />
                    </div>
                  )}
                  <div className="pt-2 flex justify-end gap-2">
                    <button type="button" onClick={() => setIsEmailModalOpen(false)} className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">Cancel</button>
                    <Button type="submit" isLoading={isRequestingEmail} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold">Send OTP Code</Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyEmailOtp} className="space-y-3">
                  <p className="text-xs text-slate-600">
                    A 6-digit code was sent to <strong>{newEmail}</strong>. Enter it below to verify.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit OTP Verification Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-mono font-bold tracking-[0.5em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="pt-2 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setEmailStep('request')}
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Resend Code
                    </button>
                    <Button type="submit" isLoading={isRequestingEmail} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold">
                      Verify &amp; Update
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════ DELETE ACCOUNT MODAL — hidden for SuperAdmin ══════════════════════════════════════════════ */}
      {profile?.role !== 'SuperAdmin' && (
        <AnimatePresence>
          {isDeleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full border border-red-200 shadow-xl relative"
              >
                <button
                  type="button"
                  onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmText(''); setDeletePassword(''); setDeleteError(''); }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-red-100 text-red-600 flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-red-800">Delete Account Permanently</h3>
                    <p className="text-[11px] text-red-500">This action is irreversible. All your data will be deleted.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-red-50 border border-red-200 mb-4 text-xs text-red-700 space-y-1">
                  <p className="font-semibold">The following will be permanently deleted:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-red-600">
                    <li>Your account and personal information</li>
                    <li>All active sessions and refresh tokens</li>
                    <li>Notifications and activity logs</li>
                    <li>Profile avatar from cloud storage</li>
                  </ul>
                </div>

                {deleteError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-3 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" /><span>{deleteError}</span>
                  </div>
                )}

                <form onSubmit={handleDeleteAccount} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="w-full px-3 py-2 bg-slate-50 border border-red-300 rounded-xl text-xs font-mono font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      required
                      autoComplete="off"
                    />
                  </div>

                  {profile?.hasPassword && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password (Required)</label>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={e => setDeletePassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        required
                      />
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmText(''); setDeletePassword(''); setDeleteError(''); }}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isDeletingAccount && <Loader2 className="w-3 h-3 animate-spin" />}
                      {isDeletingAccount ? 'Deleting...' : 'Delete My Account'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
};

export default ProfilePage;
