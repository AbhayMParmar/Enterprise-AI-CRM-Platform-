import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User as UserIcon,
  ShieldAlert,
  Eye,
  EyeOff,

  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ShieldCheck,
  Zap,
  LogIn,
  Check,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { useToast } from '../components/ui/Toast';

/* ─────────────────────────────────── types ─── */
type Mode = 'login' | 'register';
type Role = 'SuperAdmin' | 'Admin' | 'SalesManager' | 'SalesRep';


interface ValidationErrors {
  fullName?: string;
  email?: string;
  password?: string;
}

/* ─────────────────────────────────── validation helper ─── */
const validateField = (name: string, value: string, isSignup = false): string | undefined => {
  if (name === 'email') {
    if (!value.trim()) return 'Email address is required';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) return 'Enter a valid email address';
  }

  if (name === 'password') {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    if (value.length > 8) return 'Password cannot exceed 8 characters';
    if (!/[A-Z]/.test(value) || !/[0-9]/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
      return 'Must include uppercase, digit & symbol';
    }
  }

  if (name === 'fullName' && isSignup) {
    if (!value.trim()) return 'Full name is required';
    if (value.trim().length < 3) return 'Min 3 characters required';
    if (!/^[a-zA-Z\s]+$/.test(value)) return 'Only letters and spaces allowed';
  }

  return undefined;
};


/* ─────────────────────────────────── form field (desktop) ─── */
interface FieldProps {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  autoComplete?: string;
  required?: boolean;
  error?: string;
  touched?: boolean;
  maxLength?: number;
}

function Field({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  autoComplete,
  required,
  error,
  touched,
  maxLength,
}: FieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const hasError = touched && !!error;
  const isValid = touched && !error && value;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-brand-textSecondary select-none">
          {label}
        </label>
        {hasError && (
          <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5">
            <AlertCircle className="w-2.5 h-2.5" />
            <span>{error}</span>
          </span>
        )}
      </div>
      <div className="relative flex items-center">
        <span className={`absolute left-3.5 pointer-events-none transition-colors ${
          hasError ? 'text-rose-400' : 'text-brand-textSecondary'
        }`}>
          {icon}
        </span>
        <input
          type={isPassword && show ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            if (maxLength && e.target.value.length > maxLength) return;
            onChange(e.target.value);
          }}
          autoComplete={autoComplete}
          required={required}
          maxLength={maxLength}
          className={`w-full pl-10 pr-10 py-3 text-sm border rounded-xl bg-brand-bg text-brand-textPrimary placeholder:text-brand-textSecondary/60 focus:outline-none focus:ring-2 transition-all ${
            hasError
              ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-400/20'
              : isValid
              ? 'border-emerald-400 focus:ring-emerald-400/20 bg-emerald-50/10'
              : 'border-brand-border focus:ring-brand-primary/20 focus:border-brand-primary'
          }`}
        />
        {isValid && !isPassword && (
          <span className="absolute right-3.5 text-emerald-500 pointer-events-none">
            <CheckCircle2 className="w-4 h-4" />
          </span>
        )}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3.5 text-brand-textSecondary hover:text-brand-primary transition-colors"
            tabIndex={-1}
            aria-label="Toggle password visibility"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────── button component helper ─── */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  isLoading?: boolean;
}

function Button({ children, variant = 'primary', isLoading, className = '', disabled, ...props }: ButtonProps) {
  const baseStyles = "flex items-center justify-center gap-2 py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  const variantStyles = variant === 'primary'
    ? "bg-brand-primary hover:bg-brand-secondary text-white shadow-md shadow-brand-primary/20"
    : "border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs";

  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  );
}

/* ─────────────────────────────────── divider ─── */
function Divider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-brand-border" />
      <span className="text-xs text-brand-textSecondary font-medium">or continue with email</span>
      <div className="flex-1 h-px bg-brand-border" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

/* ─────────────────────────────────── brand panel content ─── */
interface BrandPanelProps {
  mode: Mode;
  onSwitch: () => void;
}

function BrandPanel({ mode, onSwitch }: BrandPanelProps) {
  return (
    <div className="relative h-full flex flex-col items-center justify-center p-8 text-white overflow-hidden select-none">
      {/* Animated background blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-blue-600 to-indigo-700" />
      <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-blue-400/20 rounded-full blur-2xl" />

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 text-center"
        >
          {mode === 'login' ? (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold mb-5 backdrop-blur-sm border border-white/20">
                <Sparkles className="w-3.5 h-3.5" />
                New to AI CRM?
              </div>
              <h2 className="text-2xl font-bold mb-2 leading-tight">
                Hello, Friend!
              </h2>
              <p className="text-blue-100 text-xs mb-8 max-w-xs mx-auto leading-relaxed">
                Enter your details to access your CRM workspace and AI tools.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold mb-5 backdrop-blur-sm border border-white/20">
                <Sparkles className="w-3.5 h-3.5" />
                Already have an account?
              </div>
              <h2 className="text-2xl font-bold mb-2 leading-tight">
                Welcome Back!
              </h2>
              <p className="text-blue-100 text-xs mb-8 max-w-xs mx-auto leading-relaxed">
                Sign in to continue. Your pipeline and AI assistant are waiting.
              </p>
            </>
          )}

          <button
            onClick={onSwitch}
            className="flex items-center justify-center gap-2 mx-auto px-6 py-2.5 border-2 border-white/60 text-white rounded-xl text-xs font-semibold hover:bg-white hover:text-brand-primary transition-all duration-200"
          >
            {mode === 'login' ? 'Create Account' : 'Sign In'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────── desktop login form ─── */
interface LoginFormProps {
  onSwitchToRegister: () => void;
  isGoogleConfigured?: boolean;
}

function LoginForm({ onSwitchToRegister, isGoogleConfigured }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<'none' | 'request' | 'verify' | 'reset'>('none');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotDevOtp, setForgotDevOtp] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useToast();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleEmailChange = (v: string) => {
    setEmail(v);
    if (touched.email) {
      setErrors(prev => ({ ...prev, email: validateField('email', v) }));
    }
  };

  const handlePasswordChange = (v: string) => {
    setPassword(v);
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validateField('password', v) }));
    }
  };


  const getRoleDashboard = (role: string) => {
    if (role === 'SuperAdmin') return '/super-admin';
    return '/dashboard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: ValidationErrors = {};
    const emailErr = validateField('email', email);
    if (emailErr) newErrors.email = emailErr;
    const passErr = validateField('password', password);
    if (passErr) newErrors.password = passErr;

    setErrors(newErrors);
    setTouched({ email: true, password: true });

    if (Object.keys(newErrors).length > 0) {
      const hasEmailError = !!newErrors.email;
      const hasPasswordError = !!newErrors.password;
      if (hasEmailError && hasPasswordError) {
        error('Please enter your email and password to sign in.');
      } else if (hasEmailError) {
        error('Please enter your email address.');
      } else if (hasPasswordError) {
        error('Please enter your password.');
      }
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.accessToken, res.data.user);
      success('Welcome back! Logged in successfully.');
      // Role-based redirect: SuperAdmin → /super-admin, everyone else → from or /dashboard
      const destination = from !== '/dashboard' ? from : getRoleDashboard(res.data.user?.role);
      navigate(destination, { replace: true });
    } catch (err: any) {
      error(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      const res = await api.post('/auth/google-login', { credential: 'mock-google-token-johndoe' });
      login(res.data.accessToken, res.data.user);
      success('Logged in via Google successfully!');
      navigate(getRoleDashboard(res.data.user?.role), { replace: true });
    } catch {
      error('Google authentication failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Forgot Password Handlers
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      error('Please enter your registered email address.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      success(res.data.message || 'OTP sent to your email.');
      if (res.data.devModeCode) {
        setForgotDevOtp(res.data.devModeCode);
      }
      setForgotStep('verify');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to request reset OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp.trim()) {
      error('Please enter the 6-digit verification code.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/verify-reset-otp', { email: forgotEmail, otp: forgotOtp });
      success(res.data.message || 'OTP validated successfully.');
      setForgotStep('reset');
    } catch (err: any) {
      error(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotPassword.length < 6) {
      error('Password must be at least 6 characters long.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: forgotPassword,
      });
      success(res.data.message || 'Password reset successfully.');
      setForgotStep('none');
      setForgotEmail('');
      setForgotOtp('');
      setForgotPassword('');
      setForgotDevOtp('');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full px-6 lg:px-8 py-5 select-none overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 mb-3">
        <h1 className="text-xl font-bold text-brand-textPrimary mb-0.5">
          {forgotStep !== 'none' ? 'Reset Password' : 'Sign In'}
        </h1>
        <p className="text-xs text-brand-textSecondary">
          {forgotStep !== 'none' ? 'Follow steps to secure your account.' : 'Access your CRM workspace and AI tools.'}
        </p>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-hide">
        {forgotStep === 'none' ? (
          <>
            {/* Google */}
            <div className="relative w-full">
              {isGoogleConfigured && (
                <div 
                  id="google-signin-btn-desktop" 
                  className="absolute inset-0 opacity-0.01 z-10 w-full h-full overflow-hidden [&_iframe]:w-full [&_iframe]:h-full cursor-pointer" 
                />
              )}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={isGoogleLoading}
                className="flex items-center justify-center gap-2.5 w-full py-2 px-4 border border-brand-border rounded-xl text-xs font-semibold text-brand-textPrimary hover:bg-brand-bg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <span className="w-4 h-4 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </button>
            </div>

            <Divider />

            <form id="login-form-element" onSubmit={handleSubmit} className="flex flex-col gap-2.5" noValidate>
              <Field
                label="Email Address"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={handleEmailChange}
                icon={<Mail className="w-4 h-4" />}
                autoComplete="email"
                required
                error={errors.email}
                touched={touched.email}
              />
              <Field
                label="Password (Max 8 Chars)"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                icon={<Lock className="w-4 h-4" />}
                autoComplete="current-password"
                required
                maxLength={8}
                error={errors.password}
                touched={touched.password}
              />


              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-1.5 text-brand-textSecondary cursor-pointer">
                  <input type="checkbox" className="rounded border-brand-border text-brand-primary w-3.5 h-3.5" />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setForgotStep('request')}
                  className="text-brand-primary hover:underline font-medium cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          </>
        ) : forgotStep === 'request' ? (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-3">
            <Field
              label="Registered Email Address"
              type="email"
              placeholder="name@company.com"
              value={forgotEmail}
              onChange={setForgotEmail}
              icon={<Mail className="w-4 h-4" />}
              required
            />
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setForgotStep('none')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1" isLoading={forgotLoading}>
                Send Code
              </Button>
            </div>
          </form>
        ) : forgotStep === 'verify' ? (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
            {forgotDevOtp && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-mono leading-normal">
                <strong>[Dev mode Code]:</strong> {forgotDevOtp}
              </div>
            )}
            <Field
              label="6-Digit Verification OTP"
              placeholder="Enter code"
              value={forgotOtp}
              onChange={setForgotOtp}
              icon={<Lock className="w-4 h-4" />}
              required
            />
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setForgotStep('request')}>
                Back
              </Button>
              <Button type="submit" variant="primary" className="flex-1" isLoading={forgotLoading}>
                Verify Code
              </Button>
            </div>
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleRequestOtp}
                className="text-[10px] font-bold text-brand-primary hover:underline cursor-pointer"
              >
                Resend OTP Code
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
            <Field
              label="Create New Password (Max 8 Chars)"
              type="password"
              placeholder="Min 6 characters"
              value={forgotPassword}
              onChange={setForgotPassword}
              icon={<Lock className="w-4 h-4" />}
              required
              maxLength={8}
            />
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setForgotStep('verify')}>
                Back
              </Button>
              <Button type="submit" variant="primary" className="flex-1" isLoading={forgotLoading}>
                Update Password
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 pt-2.5 mt-2 border-t border-brand-border/60 bg-white space-y-2">
        {forgotStep === 'none' && (
          <button
            form="login-form-element"
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-primary text-white rounded-xl font-semibold text-xs hover:bg-brand-secondary transition-all shadow-md shadow-brand-primary/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Sign In'}
          </button>
        )}

        {/* Mobile switch */}
        <p className="lg:hidden text-center text-xs text-brand-textSecondary mt-2">
          Don't have an account?{' '}
          <button onClick={onSwitchToRegister} className="text-brand-primary font-semibold hover:underline cursor-pointer">
            Create one
          </button>
        </p>

        {/* Desktop account switcher — only visible on lg+ */}
        {forgotStep === 'none' && (
          <p className="hidden lg:block text-center text-xs text-brand-textSecondary mt-1">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-brand-primary font-semibold hover:underline cursor-pointer"
            >
              Sign Up
            </button>
          </p>
        )}

        {/* Back to Home — below account switcher */}
        {forgotStep === 'none' && (
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 px-5 py-1.5 border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/30 rounded-full font-medium text-[11px] transition-all cursor-pointer active:scale-[0.97]"
            >
              ← Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────── desktop register form ─── */
interface RegisterFormProps {
  onSwitchToLogin: () => void;
  isGoogleConfigured?: boolean;
}

function RegisterForm({ onSwitchToLogin, isGoogleConfigured }: RegisterFormProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      const res = await api.post('/auth/google-login', { credential: 'mock-google-token-johndoe' });
      login(res.data.accessToken, res.data.user);
      success('Logged in via Google successfully!');
      navigate('/dashboard', { replace: true });
    } catch {
      error('Google authentication failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('SalesRep');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleNameChange = (v: string) => {
    setName(v);
    if (touched.fullName) {
      setErrors(prev => ({ ...prev, fullName: validateField('fullName', v, true) }));
    }
  };

  const handleEmailChange = (v: string) => {
    setEmail(v);
    if (touched.email) {
      setErrors(prev => ({ ...prev, email: validateField('email', v) }));
    }
  };

  const handlePasswordChange = (v: string) => {
    setPassword(v);
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validateField('password', v) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: ValidationErrors = {};
    const nameErr = validateField('fullName', name, true);
    if (nameErr) newErrors.fullName = nameErr;
    const emailErr = validateField('email', email);
    if (emailErr) newErrors.email = emailErr;
    const passErr = validateField('password', password);
    if (passErr) newErrors.password = passErr;

    setErrors(newErrors);
    setTouched({ fullName: true, email: true, password: true });

    if (Object.keys(newErrors).length > 0) {
      const missing: string[] = [];
      if (newErrors.fullName) missing.push('full name');
      if (newErrors.email) missing.push('email address');
      if (newErrors.password) missing.push('password');
      error(missing.length === 1
        ? `Please enter your ${missing[0]} to create an account.`
        : `Please fill in your ${missing.join(' and ')} to create an account.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      login(res.data.accessToken, res.data.user);
      success('Account created! Welcome to AI CRM.');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full px-6 lg:px-8 py-5 select-none overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 mb-3">
        <h1 className="text-xl font-bold text-brand-textPrimary mb-0.5">Create Account</h1>
        <p className="text-xs text-brand-textSecondary">
          Start your free AI CRM workspace today.
        </p>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-hide">
        {/* Google */}
        <div className="relative w-full">
          {isGoogleConfigured && (
            <div 
              id="google-signup-btn-desktop" 
              className="absolute inset-0 opacity-0.01 z-10 w-full h-full overflow-hidden [&_iframe]:w-full [&_iframe]:h-full cursor-pointer" 
            />
          )}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={isGoogleLoading}
            className="flex items-center justify-center gap-2.5 w-full py-2 px-4 border border-brand-border rounded-xl text-xs font-semibold text-brand-textPrimary hover:bg-brand-bg transition-all disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <span className="w-4 h-4 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Sign up with Google
          </button>
        </div>

        <Divider />

        <form id="register-form-element" onSubmit={handleSubmit} className="flex flex-col gap-2.5" noValidate>
          <Field
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChange={handleNameChange}
            icon={<UserIcon className="w-4 h-4" />}
            autoComplete="name"
            required
            error={errors.fullName}
            touched={touched.fullName}
          />
          <Field
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={handleEmailChange}
            icon={<Mail className="w-4 h-4" />}
            autoComplete="email"
            required
            error={errors.email}
            touched={touched.email}
          />
          <Field
            label="Password (Max 8 Chars)"
            type="password"
            placeholder="Pass123#"
            value={password}
            onChange={handlePasswordChange}
            icon={<Lock className="w-4 h-4" />}
            autoComplete="new-password"
            required
            maxLength={8}
            error={errors.password}
            touched={touched.password}
          />


          {/* Role selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-brand-textSecondary select-none">
              Role
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-textSecondary pointer-events-none">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-brand-border rounded-xl bg-brand-bg text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary appearance-none transition-all cursor-pointer font-medium"
              >
                <option value="SalesRep">Sales Representative</option>
                <option value="SalesManager">Sales Manager</option>
                <option value="Admin">Administrator</option>
                <option value="SuperAdmin">Super Administrator</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 pt-2.5 mt-2 border-t border-brand-border/60 bg-white">
        <button
          form="register-form-element"
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-primary text-white rounded-xl font-semibold text-xs hover:bg-brand-secondary transition-all shadow-md shadow-brand-primary/25 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : 'Create Account'}
        </button>

        {/* Mobile switch */}
        <p className="lg:hidden text-center text-xs text-brand-textSecondary mt-2">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="text-brand-primary font-semibold hover:underline cursor-pointer">
            Sign In
          </button>
        </p>

        {/* Desktop account switcher — only visible on lg+ */}
        <p className="hidden lg:block text-center text-xs text-brand-textSecondary mt-1">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-brand-primary font-semibold hover:underline cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────── Mobile/Tablet responsive auth form ─── */
interface MobileAuthFormState {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  rememberMe: boolean;
}

interface MobileAuthProps {
  mode: Mode;
  onSwitchMode: (m: Mode) => void;
  isGoogleConfigured?: boolean;
}

function MobileAuthSection({ mode, onSwitchMode, isGoogleConfigured }: MobileAuthProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState<MobileAuthFormState>({
    fullName: '',
    email: '',
    password: '',
    role: 'SalesRep',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<'none' | 'request' | 'verify' | 'reset'>('none');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotDevOtp, setForgotDevOtp] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useToast();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const isSignup = mode === 'register';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => ({ ...prev, [name]: fieldValue }));

    if (type !== 'checkbox') {
      const err = validateField(name, fieldValue as string, isSignup);
      setErrors(prev => ({ ...prev, [name]: err }));
    }
  };


  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value, isSignup);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const switchMode = (newMode: Mode) => {
    if (mode === newMode) return;
    setIsAnimating(true);
    onSwitchMode(newMode);
    setErrors({});
    setTouched({});
    setSubmittedMessage(null);
    setFormData({ fullName: '', email: '', password: '', role: 'SalesRep', rememberMe: false });
    setTimeout(() => setIsAnimating(false), 280);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: ValidationErrors = {};
    const emailErr = validateField('email', formData.email);
    if (emailErr) newErrors.email = emailErr;
    const passErr = validateField('password', formData.password);
    if (passErr) newErrors.password = passErr;
    if (isSignup) {
      const nameErr = validateField('fullName', formData.fullName, true);
      if (nameErr) newErrors.fullName = nameErr;
    }

    setErrors(newErrors);
    setTouched({ email: true, password: true, fullName: true, role: true });

    if (Object.keys(newErrors).length > 0) {
      let message = '';
      if (!isSignup) {
        const hasEmailError = !!newErrors.email;
        const hasPasswordError = !!newErrors.password;
        if (hasEmailError && hasPasswordError) {
          message = 'Please enter your email and password to sign in.';
        } else if (hasEmailError) {
          message = 'Please enter your email address.';
        } else if (hasPasswordError) {
          message = 'Please enter your password.';
        }
      } else {
        const missing: string[] = [];
        if (newErrors.fullName) missing.push('full name');
        if (newErrors.email) missing.push('email address');
        if (newErrors.password) missing.push('password');
        message = missing.length === 1
          ? `Please enter your ${missing[0]} to create an account.`
          : `Please fill in your ${missing.join(' and ')} to create an account.`;
      }
      setSubmittedMessage({ text: message, type: 'error' });
      return;
    }

    setIsLoading(true);
    setSubmittedMessage(null);

    try {
      if (!isSignup) {
        const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
        login(res.data.accessToken, res.data.user);
        success('Logged in successfully!');
        navigate(from, { replace: true });
      } else {
        const res = await api.post('/auth/register', {
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
        login(res.data.accessToken, res.data.user);
        success(`Account created successfully as ${formData.role}!`);
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || (isSignup ? 'Failed to register account.' : 'Invalid email or password.');
      setSubmittedMessage({ text: errMsg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setSubmittedMessage(null);
    try {
      const res = await api.post('/auth/google-login', { credential: 'mock-google-token-johndoe' });
      login(res.data.accessToken, res.data.user);
      success('Logged in via Google successfully!');
      navigate(from, { replace: true });
    } catch {
      setSubmittedMessage({ text: 'Google authentication failed. Please try again.', type: 'error' });
      setTimeout(() => setSubmittedMessage(null), 4000);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Mobile Forgot Password handlers
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      error('Please enter your registered email address.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      success(res.data.message || 'OTP sent to your email.');
      if (res.data.devModeCode) {
        setForgotDevOtp(res.data.devModeCode);
      }
      setForgotStep('verify');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to request reset OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp.trim()) {
      error('Please enter the 6-digit verification code.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/verify-reset-otp', { email: forgotEmail, otp: forgotOtp });
      success(res.data.message || 'OTP validated successfully.');
      setForgotStep('reset');
    } catch (err: any) {
      error(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotPassword.length < 6) {
      error('Password must be at least 6 characters long.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: forgotPassword,
      });
      success(res.data.message || 'Password reset successfully.');
      setForgotStep('none');
      setForgotEmail('');
      setForgotOtp('');
      setForgotPassword('');
      setForgotDevOtp('');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  const GoogleSvg = () => (
    <svg className="w-4 h-4 transition-transform group-hover:scale-110 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );

  return (
    <>
      {/* Clean neutral background — no gradients, no blur tint */}
      <div className="fixed inset-0 z-[41] bg-[#F8FAFC]" />

      {/* Floating animated blobs for mobile/tablet viewports */}
      <div className="fixed inset-0 z-[41] overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-blue-100/40 blur-3xl"
          animate={{
            x: [0, 40, 0],
            y: [0, 50, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-100/40 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -40, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-sky-100/30 blur-2xl"
          animate={{
            x: [0, 30, -30, 0],
            y: [0, -30, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* ── Layer 3: Form — fixed + flex = guaranteed perfect centering ── */}
      <div className="fixed inset-0 z-[42] overflow-y-auto">
        <div className="min-h-full flex items-center justify-center px-4 py-8 sm:px-6">
          <div className="relative w-full sm:max-w-md md:max-w-lg">
            {/* Main Glass Card */}
            <div className="w-full bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_16px_rgba(0,0,0,0.06),_0_24px_64px_rgba(0,0,0,0.12),_0_2px_4px_rgba(0,0,0,0.04)] border border-slate-200/90 overflow-hidden flex flex-col relative">

          {/* ── SIGN IN VIEW ─── */}
          {!isSignup ? (
            <div className={`w-full p-4 sm:p-6 flex flex-col justify-between ${isAnimating ? 'opacity-80' : 'animate-slide-up'}`}>
              <div>
                {/* Branding */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                      <Sparkles size={14} className="animate-spin" style={{ animationDuration: '9s' }} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 tracking-tight">AI CRM Suite</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                    <Zap size={10} className="fill-blue-600" />
                    <span>Workspace</span>
                  </span>
                </div>

                {/* Title */}
                <div className="mb-3">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {forgotStep !== 'none' ? 'Reset Password' : 'Sign In'}
                  </h1>
                  <p className="text-slate-500 text-[11px] sm:text-xs font-medium">
                    {forgotStep !== 'none' ? 'Follow steps to secure your account.' : 'AI CRM & Sales Management Platform'}
                  </p>
                </div>

                {forgotStep === 'none' ? (
                  <>
                    {/* Google Button */}
                    <div className="relative w-full">
                      {isGoogleConfigured && (
                        <div 
                          id="google-signin-btn-mobile" 
                          className="absolute inset-0 opacity-0.01 z-10 w-full h-full overflow-hidden [&_iframe]:w-full [&_iframe]:h-full cursor-pointer" 
                        />
                      )}
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                        className="w-full py-2 sm:py-2.5 px-3 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/80 active:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 shadow-sm active:scale-[0.98] group cursor-pointer disabled:opacity-50"
                      >
                        <GoogleSvg />
                        <span>{isGoogleLoading ? 'Connecting...' : 'Sign in with Google'}</span>
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-3 flex items-center justify-center">
                      <div className="border-t border-slate-200/80 w-full" />
                      <span className="bg-white px-2.5 text-[10px] text-slate-400 font-medium tracking-wider uppercase absolute">
                        or continue with email
                      </span>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
                      {/* Email */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[11px] sm:text-xs font-semibold text-slate-700">Email Address</label>
                          {touched.email && errors.email && (
                            <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5 animate-slide-up">
                              <AlertCircle size={10} />
                              <span>{errors.email}</span>
                            </span>
                          )}
                        </div>
                        <div className="relative group">
                          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                            touched.email && errors.email ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-blue-600'
                          }`}>
                            <Mail size={16} />
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            placeholder="name@company.com"
                            autoComplete="email"
                            className={`w-full pl-9 pr-8 py-2 sm:py-2.5 bg-[#f8fafc] border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-medium shadow-sm ${
                              touched.email && errors.email
                                ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/20 animate-shake'
                                : touched.email && !errors.email && formData.email
                                ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 bg-emerald-50/10'
                                : 'border-slate-200/90 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white'
                            }`}
                          />
                          {touched.email && !errors.email && formData.email && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-500 animate-pop-check pointer-events-none">
                              <CheckCircle2 size={15} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[11px] sm:text-xs font-semibold text-slate-700">Password (Max 8 Chars)</label>
                          {touched.password && errors.password && (
                            <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5 animate-slide-up">
                              <AlertCircle size={10} />
                              <span>{errors.password}</span>
                            </span>
                          )}
                        </div>
                        <div className="relative group">
                          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                            touched.password && errors.password ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-blue-600'
                          }`}>
                            <Lock size={16} />
                          </div>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            maxLength={8}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className={`w-full pl-9 pr-9 py-2 sm:py-2.5 bg-[#f8fafc] border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-medium shadow-sm ${
                              touched.password && errors.password
                                ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/20 animate-shake'
                                : touched.password && !errors.password && formData.password
                                ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-400/20'
                                : 'border-slate-200/90 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            aria-label="Toggle password visibility"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Remember Me & Forgot Password */}
                      <div className="flex items-center justify-between pt-0.5">
                        <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            name="rememberMe"
                            checked={formData.rememberMe}
                            onChange={handleInputChange}
                            className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 accent-blue-600 cursor-pointer"
                          />
                          <span className="text-[11px] sm:text-xs font-medium text-slate-600">Remember me</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setForgotStep('request')}
                          className="text-[11px] sm:text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>

                      {/* Feedback Toast */}
                      {submittedMessage && (
                        <div className={`p-2 rounded-lg text-xs flex items-center gap-1.5 animate-slide-up ${
                          submittedMessage.type === 'success'
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                            : 'bg-rose-50 border border-rose-200 text-rose-700'
                        }`}>
                          {submittedMessage.type === 'success' ? (
                            <CheckCircle2 size={14} className="shrink-0" />
                          ) : (
                            <AlertCircle size={14} className="shrink-0" />
                          )}
                          <span className="font-medium">{submittedMessage.text}</span>
                        </div>
                      )}

                      {/* Submit */}
                      <div className="pt-1">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="btn-clean-hover relative w-full py-2.5 sm:py-3 px-4 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-500/20 group cursor-pointer disabled:opacity-50"
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <LogIn size={15} />
                            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                          </span>
                        </button>
                      </div>
                    </form>
                  </>
                ) : forgotStep === 'request' ? (
                  <form onSubmit={handleRequestOtp} className="flex flex-col gap-3">
                    <Field
                      label="Registered Email Address"
                      type="email"
                      placeholder="name@company.com"
                      value={forgotEmail}
                      onChange={setForgotEmail}
                      icon={<Mail className="w-4 h-4" />}
                      required
                    />
                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setForgotStep('none')}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" className="flex-1" isLoading={forgotLoading}>
                        Send Code
                      </Button>
                    </div>
                  </form>
                ) : forgotStep === 'verify' ? (
                  <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
                    {forgotDevOtp && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-mono leading-normal">
                        <strong>[Dev mode Code]:</strong> {forgotDevOtp}
                      </div>
                    )}
                    <Field
                      label="6-Digit Verification OTP"
                      placeholder="Enter code"
                      value={forgotOtp}
                      onChange={setForgotOtp}
                      icon={<Lock className="w-4 h-4" />}
                      required
                    />
                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setForgotStep('request')}>
                        Back
                      </Button>
                      <Button type="submit" variant="primary" className="flex-1" isLoading={forgotLoading}>
                        Verify Code
                      </Button>
                    </div>
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        className="text-[10px] font-bold text-brand-primary hover:underline cursor-pointer"
                      >
                        Resend OTP Code
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
                    <Field
                      label="Create New Password (Max 8 Chars)"
                      type="password"
                      placeholder="Min 6 characters"
                      value={forgotPassword}
                      onChange={setForgotPassword}
                      icon={<Lock className="w-4 h-4" />}
                      required
                      maxLength={8}
                    />
                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setForgotStep('verify')}>
                        Back
                      </Button>
                      <Button type="submit" variant="primary" className="flex-1" isLoading={forgotLoading}>
                        Update Password
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {/* Bottom Switcher */}
              <div className="mt-3 pt-2 border-t border-slate-100/80 text-center flex-shrink-0 flex flex-col items-center gap-2">
                <p className="text-xs text-slate-500 font-medium">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-blue-600 font-bold hover:underline cursor-pointer focus:outline-none"
                  >
                    Sign Up
                  </button>
                </p>
                {forgotStep === 'none' && (
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-1.5 px-5 py-1.5 border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/30 rounded-full font-medium text-[11px] transition-all cursor-pointer active:scale-[0.97]"
                  >
                    ← Back to Home
                  </button>
                )}
              </div>
            </div>

          ) : (
            /* ── SIGN UP VIEW ─── */
            <div className={`w-full p-4 sm:p-6 flex flex-col justify-between ${isAnimating ? 'opacity-80' : 'animate-slide-up'}`}>
              <div>
                {/* Branding */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                      <Sparkles size={14} className="animate-spin" style={{ animationDuration: '9s' }} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 tracking-tight">AI CRM Suite</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                    <ShieldCheck size={11} />
                    <span>14-Day Trial</span>
                  </span>
                </div>

                {/* Title */}
                <div className="mb-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Create Account</h1>
                  <p className="text-slate-500 text-[11px] sm:text-xs font-medium">Get started with your CRM workspace</p>
                </div>

                {/* Google Button */}
                <div className="relative w-full">
                  {isGoogleConfigured && (
                    <div 
                      id="google-signup-btn-mobile" 
                      className="absolute inset-0 opacity-0.01 z-10 w-full h-full overflow-hidden [&_iframe]:w-full [&_iframe]:h-full cursor-pointer" 
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                    className="w-full py-2 sm:py-2.5 px-3 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/80 active:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 shadow-sm active:scale-[0.98] group cursor-pointer disabled:opacity-50"
                  >
                    <GoogleSvg />
                    <span>{isGoogleLoading ? 'Connecting...' : 'Sign up with Google'}</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative my-2.5 flex items-center justify-center">
                  <div className="border-t border-slate-200/80 w-full" />
                  <span className="bg-white px-2.5 text-[10px] text-slate-400 font-medium tracking-wider uppercase absolute">
                    or continue with email
                  </span>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-2" noValidate>
                  {/* Full Name */}
                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <label className="block text-[11px] sm:text-xs font-semibold text-slate-700">Full Name</label>
                      {touched.fullName && errors.fullName && (
                        <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5 animate-slide-up">
                          <AlertCircle size={10} />
                          <span>{errors.fullName}</span>
                        </span>
                      )}
                    </div>
                    <div className="relative group">
                      <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                        touched.fullName && errors.fullName ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-blue-600'
                      }`}>
                        <UserIcon size={16} />
                      </div>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="John Doe"
                        autoComplete="name"
                        className={`w-full pl-9 pr-8 py-2 bg-[#f8fafc] border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-medium shadow-sm ${
                          touched.fullName && errors.fullName
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/20 animate-shake'
                            : touched.fullName && !errors.fullName && formData.fullName
                            ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 bg-emerald-50/10'
                            : 'border-slate-200/90 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white'
                        }`}
                      />
                      {touched.fullName && !errors.fullName && formData.fullName && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-500 animate-pop-check pointer-events-none">
                          <CheckCircle2 size={15} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <label className="block text-[11px] sm:text-xs font-semibold text-slate-700">Email Address</label>
                      {touched.email && errors.email && (
                        <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5 animate-slide-up">
                          <AlertCircle size={10} />
                          <span>{errors.email}</span>
                        </span>
                      )}
                    </div>
                    <div className="relative group">
                      <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                        touched.email && errors.email ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-blue-600'
                      }`}>
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="name@company.com"
                        autoComplete="email"
                        className={`w-full pl-9 pr-8 py-2 bg-[#f8fafc] border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-medium shadow-sm ${
                          touched.email && errors.email
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/20 animate-shake'
                            : touched.email && !errors.email && formData.email
                            ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 bg-emerald-50/10'
                            : 'border-slate-200/90 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white'
                        }`}
                      />
                      {touched.email && !errors.email && formData.email && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-500 animate-pop-check pointer-events-none">
                          <CheckCircle2 size={15} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <label className="block text-[11px] sm:text-xs font-semibold text-slate-700">Password (Max 8 Chars)</label>
                      {touched.password && errors.password && (
                        <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5 animate-slide-up">
                          <AlertCircle size={10} />
                          <span>{errors.password}</span>
                        </span>
                      )}
                    </div>
                    <div className="relative group">
                      <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                        touched.password && errors.password ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-blue-600'
                      }`}>
                        <Lock size={16} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        maxLength={8}
                        placeholder="Pass123#"
                        autoComplete="new-password"
                        className={`w-full pl-9 pr-9 py-2 bg-[#f8fafc] border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-medium shadow-sm ${
                          touched.password && errors.password
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/20 animate-shake'
                            : touched.password && !errors.password && formData.password
                            ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-400/20'
                            : 'border-slate-200/90 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-0.5">
                      Select User Role
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <Briefcase size={16} />
                      </div>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-8 py-2 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white transition-all font-medium appearance-none cursor-pointer shadow-sm"
                      >
                        <option value="SalesRep">Sales Representative (SalesRep)</option>
                        <option value="SalesManager">Sales Manager</option>
                        <option value="Admin">Administrator (Admin)</option>
                        <option value="SuperAdmin">Super Administrator (SuperAdmin)</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <ShieldAlert size={15} />
                      </div>
                    </div>
                  </div>

                  {/* Feedback Toast */}
                  {submittedMessage && (
                    <div className={`p-2 rounded-lg text-xs flex items-center gap-1.5 animate-slide-up ${
                      submittedMessage.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-rose-50 border border-rose-200 text-rose-700'
                    }`}>
                      {submittedMessage.type === 'success' ? (
                        <CheckCircle2 size={14} className="shrink-0" />
                      ) : (
                        <AlertCircle size={14} className="shrink-0" />
                      )}
                      <span className="font-medium">{submittedMessage.text}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-clean-hover relative w-full py-2.5 sm:py-3 px-4 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-500/20 group cursor-pointer disabled:opacity-50"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Check size={15} />
                        <span>{isLoading ? 'Creating Account...' : 'Sign Up'}</span>
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Bottom Switcher */}
              <div className="mt-3 pt-2 border-t border-slate-100/80 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-blue-600 font-bold hover:underline cursor-pointer focus:outline-none"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}
          </div>{/* /glass card */}
          </div>{/* /width limiter */}
        </div>{/* /min-h-full centering */}
      </div>{/* /form layer */}
    </>
  );
}

/* ─────────────────────────────────── main AuthPage ─── */
interface AuthPageProps {
  initialMode?: Mode;
}

export const AuthPage = ({ initialMode = 'login' }: AuthPageProps) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(initialMode);
  const switchMode = (m: Mode) => {
    setMode(m);
    navigate(m === 'login' ? '/login' : '/register', { replace: true });
  };
  const [sliding, setSliding] = useState(false);
  const { login } = useAuthStore();
  const { success, error } = useToast();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id.apps.googleusercontent.com';
  const isGoogleConfigured = clientId && !clientId.includes('your_google_client_id');

  const handleGoogleLoginSuccess = async (credential: string) => {
    try {
      const res = await api.post('/auth/google-login', { credential });
      login(res.data.accessToken, res.data.user);
      success('Logged in via Google successfully!');
      // Role-based redirect
      const dest = res.data.user?.role === 'SuperAdmin' ? '/super-admin' : (from !== '/dashboard' ? from : '/dashboard');
      navigate(dest, { replace: true });
    } catch (err: any) {
      error(err.response?.data?.message || 'Google authentication failed.');
    }
  };

  useEffect(() => {
    if (!isGoogleConfigured) return;

    const initGoogle = () => {
      const google = (window as any).google;
      if (google) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            handleGoogleLoginSuccess(response.credential);
          },
        });
        
        const renderBtns = () => {
          const containers = [
            'google-signin-btn-desktop',
            'google-signup-btn-desktop',
            'google-signin-btn-mobile',
            'google-signup-btn-mobile'
          ];
          containers.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
              google.accounts.id.renderButton(el, {
                theme: 'outline',
                size: 'large',
                width: el.clientWidth || 300,
              });
            }
          });
        };
        
        // Render buttons after a small timeout to make sure elements are in DOM
        setTimeout(renderBtns, 100);
        renderBtns();
      }
    };

    if (!document.getElementById('google-gsi-client-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    } else {
      initGoogle();
    }
  }, [isGoogleConfigured, mode]);

  const isLogin = mode === 'login';

  return (
    <>
      {/* ── MOBILE / TABLET VIEW (hidden on lg+) ── */}
      <div className="lg:hidden">
        <MobileAuthSection
          mode={mode}
          onSwitchMode={(m) => {
            setMode(m);
            navigate(m === 'login' ? '/login' : '/register', { replace: true });
          }}
          isGoogleConfigured={isGoogleConfigured}
        />
      </div>

      {/* ── DESKTOP VIEW (hidden below lg) — Original design fully preserved ── */}
      <div className="hidden lg:flex min-h-screen w-full items-center justify-center bg-[#F1F5F9] relative overflow-hidden p-4">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[50%] bg-brand-primary/8 rounded-full blur-3xl" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[50%] bg-indigo-400/8 rounded-full blur-3xl" />
        </div>

        {/* Medium-sized Card Container */}
        <div className="relative w-full max-w-[760px] h-[480px] bg-white rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.06),_0_24px_64px_rgba(0,0,0,0.12),_0_2px_4px_rgba(0,0,0,0.04)] overflow-hidden flex border border-brand-border/60">

          {/* ── DESKTOP SPLIT LAYOUT ─── */}
          <div className="flex w-full h-full relative">

            {/* Login form panel */}
            <div
              className={`absolute inset-y-0 flex transition-all duration-500 ease-in-out ${isLogin ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              style={{ width: '55%', left: 0 }}
            >
              <LoginForm onSwitchToRegister={() => switchMode('register')} isGoogleConfigured={isGoogleConfigured} />
            </div>

            {/* Register form panel */}
            <div
              className={`absolute inset-y-0 flex transition-all duration-500 ease-in-out ${!isLogin ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              style={{ width: '55%', left: isLogin ? 0 : '45%' }}
            >
              <RegisterForm onSwitchToLogin={() => switchMode('login')} isGoogleConfigured={isGoogleConfigured} />
            </div>

            {/* Sliding brand panel */}
            <div
              className="absolute top-0 bottom-0 w-[45%] h-full transition-all duration-500 ease-in-out"
              style={{ left: isLogin ? '55%' : '0%' }}
            >
              <BrandPanel mode={mode} onSwitch={() => switchMode(isLogin ? 'register' : 'login')} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* Named re-exports for backward compat with existing Login/Register route imports */
export const Login = () => <AuthPage initialMode="login" />;
export const Register = () => <AuthPage initialMode="register" />;

export default AuthPage;
