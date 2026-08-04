import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff, Sparkles, Zap, AlertCircle, CheckCircle2, ArrowRight, User as UserIcon, Briefcase, ShieldCheck, ShieldAlert, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';

type AuthMode = 'signin' | 'signup';
type ViewportMode = 'responsive' | 'mobile' | 'tablet';

export const Login = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [viewport, setViewport] = useState<ViewportMode>('responsive');
  const [isAnimating, setIsAnimating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'SalesRep' | 'SalesManager' | 'Admin' | 'SuperAdmin'>('SalesRep');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useToast();

  const from = location.state?.from?.pathname || '/dashboard';

  const validateField = (name: string, value: string): string | undefined => {
    if (name === 'email') {
      if (!value.trim()) return 'Email address is required';
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(value)) return 'Enter a valid email address';
    }

    if (name === 'password') {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be exactly 8 characters';
      if (!/[A-Z]/.test(value) || !/[0-9]/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
        return 'Must include uppercase, digit & symbol';
      }
    }

    if (name === 'fullName' && mode === 'signup') {
      if (!value.trim()) return 'Full name is required';
      if (value.trim().length < 3) return 'Min 3 characters required';
      if (!/^[a-zA-Z\s]+$/.test(value)) return 'Only letters and spaces allowed';
    }

    return undefined;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    if (name === 'password' && typeof fieldValue === 'string' && fieldValue.length > 8) {
      return;
    }

    if (name === 'email') setEmail(fieldValue as string);
    if (name === 'password') setPassword(fieldValue as string);
    if (name === 'fullName') setFullName(fieldValue as string);
    if (name === 'role') setRole(fieldValue as any);
    if (name === 'rememberMe') setRememberMe(fieldValue as boolean);

    if (type !== 'checkbox') {
      const error = validateField(name, fieldValue as string);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const switchMode = (newMode: AuthMode) => {
    if (mode === newMode) return;
    setIsAnimating(true);
    setMode(newMode);
    setErrors({});
    setTouched({});
    setSubmittedMessage(null);
    setTimeout(() => setIsAnimating(false), 280);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { fullName?: string; email?: string; password?: string } = {};
    const emailErr = validateField('email', email);
    if (emailErr) newErrors.email = emailErr;

    const passErr = validateField('password', password);
    if (passErr) newErrors.password = passErr;

    if (mode === 'signup') {
      const nameErr = validateField('fullName', fullName);
      if (nameErr) newErrors.fullName = nameErr;
    }

    setErrors(newErrors);
    setTouched({ email: true, password: true, fullName: true, role: true });

    if (Object.keys(newErrors).length > 0) {
      const hasEmailError = !!newErrors.email;
      const hasPasswordError = !!newErrors.password;

      let message = '';

      // Both email and password are empty
      if (hasEmailError && hasPasswordError) {
        message = 'Please enter your email and password to sign in.';
      }
      // Only email is empty
      else if (hasEmailError) {
        message = 'Please enter your email address.';
      }
      // Only password is empty
      else if (hasPasswordError) {
        message = 'Please enter your password.';
      }

      setSubmittedMessage({
        text: message,
        type: 'error',
      });

      return;
    }

    setIsLoading(true);
    setSubmittedMessage(null);

    if (mode === 'signin') {
      try {
        const response = await api.post('/auth/login', { email, password });
        const { accessToken, user } = response.data;
        login(accessToken, user);
        success('Logged in successfully!');
        navigate(from, { replace: true });
      } catch (err: any) {
        const errMsg = err.response?.data?.message || 'Invalid email or password.';
        setSubmittedMessage({ text: errMsg, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        const response = await api.post('/auth/register', { name: fullName, email, password, role });
        const { accessToken, user } = response.data;
        login(accessToken, user);
        success(`Account created successfully as ${role}!`);
        navigate('/dashboard');
      } catch (err: any) {
        const errMsg = err.response?.data?.message || 'Failed to register account.';
        setSubmittedMessage({ text: errMsg, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setSubmittedMessage(null);
    setTimeout(() => {
      setIsGoogleLoading(false);
      setSubmittedMessage({ text: 'Logged in via Google successfully!', type: 'success' });
      setTimeout(() => setSubmittedMessage(null), 4000);
    }, 1200);
  };

  const showDesktopHero = true;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col items-center justify-center p-2 sm:p-4 relative selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-md md:max-w-4xl transition-all duration-300 relative">
        {/* Soft Ambient Background Glows */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-aura" />
        <div className="absolute -bottom-8 right-2 w-56 h-56 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse-aura" />

        {/* Main Zero-Scroll Glass Card Container */}
        <div className={`w-full bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_12px_40px_rgba(37,99,235,0.08)] border border-slate-200/90 overflow-hidden flex ${showDesktopHero ? 'flex-col md:flex-row' : 'flex-col'
          } relative z-10 transition-all`}>

          {mode === 'signin' ? (
            <>
              {/* Left Column - Sign In Form */}
              <div className={`w-full ${showDesktopHero ? 'md:w-1/2' : 'w-full'} p-4 sm:p-6 md:p-8 flex flex-col justify-between ${isAnimating ? 'opacity-80' : 'animate-slide-up'}`}>
                <div>
                  {/* Top Header & Branding */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
                        <Sparkles size={14} className="animate-spin" style={{ animationDuration: '9s' }} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 tracking-tight">AI CRM Suite</span>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                      <Zap size={10} className="fill-blue-600" />
                      <span>Workspace</span>
                    </span>
                  </div>

                  {/* Title Section */}
                  <div className="mb-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      Sign In
                    </h1>
                    <p className="text-slate-500 text-[11px] sm:text-xs font-medium">
                      AI CRM & Sales Management Platform
                    </p>
                  </div>

                  {/* Google Sign In Button */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                    className="w-full py-2 sm:py-2.5 px-3 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/80 active:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 shadow-xs active:scale-[0.98] group cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 transition-transform group-hover:scale-110 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>{isGoogleLoading ? 'Connecting...' : 'Sign in with Google'}</span>
                  </button>

                  {/* Divider */}
                  <div className="relative my-3 flex items-center justify-center">
                    <div className="border-t border-slate-200/80 w-full" />
                    <span className="bg-white px-2.5 text-[10px] text-slate-400 font-medium tracking-wider uppercase absolute">
                      or continue with email
                    </span>
                  </div>

                  {/* Form with Strict Validation */}
                  <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
                    {/* Email Input */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] sm:text-xs font-semibold text-slate-700">
                          Email Address
                        </label>
                        {touched.email && errors.email && (
                          <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5 animate-slide-up">
                            <AlertCircle size={10} />
                            <span>{errors.email}</span>
                          </span>
                        )}
                      </div>
                      <div className="relative group">
                        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${touched.email && errors.email ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-blue-600'
                          }`}>
                          <Mail size={16} />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={email}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          placeholder="name@company.com"
                          className={`w-full pl-9 pr-8 py-2 sm:py-2.5 bg-[#f8fafc] border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-medium shadow-xs ${touched.email && errors.email
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/20 animate-shake'
                            : touched.email && !errors.email && email
                              ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 bg-emerald-50/10'
                              : 'border-slate-200/90 focus:ring-3 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white'
                            }`}
                        />
                        {touched.email && !errors.email && email && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-500 animate-pop-check pointer-events-none">
                            <CheckCircle2 size={15} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Password Input */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] sm:text-xs font-semibold text-slate-700">
                          Password (Max 8 Chars)
                        </label>
                        {touched.password && errors.password && (
                          <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5 animate-slide-up">
                            <AlertCircle size={10} />
                            <span>{errors.password}</span>
                          </span>
                        )}
                      </div>
                      <div className="relative group">
                        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${touched.password && errors.password ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-blue-600'
                          }`}>
                          <Lock size={16} />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={password}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          maxLength={8}
                          placeholder="••••••••"
                          className={`w-full pl-9 pr-9 py-2 sm:py-2.5 bg-[#f8fafc] border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-medium shadow-xs ${touched.password && errors.password
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/20 animate-shake'
                            : touched.password && !errors.password && password
                              ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-400/20'
                              : 'border-slate-200/90 focus:ring-3 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white'
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
                          checked={rememberMe}
                          onChange={handleInputChange}
                          className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 accent-blue-600 cursor-pointer"
                        />
                        <span className="text-[11px] sm:text-xs font-medium text-slate-600">
                          Remember me
                        </span>
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-[11px] sm:text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Forgot Password?
                      </Link>
                    </div>

                    {/* Feedback Toast */}
                    {submittedMessage && (
                      <div className={`p-2 rounded-lg text-xs flex items-center gap-1.5 animate-slide-up ${submittedMessage.type === 'success'
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

                    {/* Submit Button */}
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
                </div>

                {/* Bottom Switcher */}
                <div className="mt-3 pt-2 border-t border-slate-100/80 text-center">
                  <p className="text-xs text-slate-500 font-medium">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="text-blue-600 font-bold hover:underline cursor-pointer focus:outline-none"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              </div>

              {/* Right Hero Banner for Desktop */}
              {showDesktopHero && (
                <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#2563eb] via-[#1d58d8] to-[#1e40af] p-8 text-white flex-col justify-center items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 rounded-full bg-blue-400/20 blur-xl pointer-events-none" />

                  <div className="relative z-10 max-w-xs flex flex-col items-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-white mb-4 shadow-xs">
                      <Sparkles size={13} className="text-blue-200" />
                      <span>New to AI CRM?</span>
                    </div>

                    <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white mb-2">
                      Hello, Friend!
                    </h2>

                    <p className="text-blue-100/90 text-xs font-normal leading-relaxed mb-6">
                      Enter your details to access your CRM workspace, RBAC roles, and AI tools.
                    </p>

                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border-2 border-white/80 text-white hover:bg-white hover:text-blue-600 font-semibold text-xs transition-all duration-300 transform hover:scale-[1.03] active:scale-95 shadow-md cursor-pointer"
                    >
                      <span>Create Account</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* CREATE ACCOUNT VIEW */
            <>
              {/* Left Hero Banner for Desktop */}
              {showDesktopHero && (
                <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#2563eb] via-[#1d58d8] to-[#1e40af] p-8 text-white flex-col justify-center items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 -ml-12 -mt-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
                  <div className="absolute bottom-0 right-0 -mr-12 -mb-12 w-48 h-48 rounded-full bg-blue-400/20 blur-xl pointer-events-none" />

                  <div className="relative z-10 max-w-xs flex flex-col items-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-white mb-4 shadow-xs">
                      <Sparkles size={13} className="text-blue-200" />
                      <span>Already have an account?</span>
                    </div>

                    <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white mb-2">
                      Welcome Back!
                    </h2>

                    <p className="text-blue-100/90 text-xs font-normal leading-relaxed mb-6">
                      Sign in to continue. Your pipeline and AI assistant are waiting.
                    </p>

                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border-2 border-white/80 text-white hover:bg-white hover:text-blue-600 font-semibold text-xs transition-all duration-300 transform hover:scale-[1.03] active:scale-95 shadow-md cursor-pointer"
                    >
                      <span>Sign In</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Right Column - Sign Up Form */}
              <div className={`w-full ${showDesktopHero ? 'md:w-1/2' : 'w-full'} p-4 sm:p-6 md:p-8 flex flex-col justify-between ${isAnimating ? 'opacity-80' : 'animate-slide-up'}`}>
                <div>
                  {/* Top Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
                        <Sparkles size={14} className="animate-spin" style={{ animationDuration: '9s' }} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 tracking-tight">AI CRM Suite</span>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                      <ShieldCheck size={11} />
                      <span>14-Day Trial</span>
                    </span>
                  </div>

                  {/* Title Section */}
                  <div className="mb-2.5">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      Create Account
                    </h1>
                    <p className="text-slate-500 text-[11px] sm:text-xs font-medium">
                      Get started with your CRM workspace
                    </p>
                  </div>

                  {/* Google Sign Up Button */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                    className="w-full py-2 sm:py-2.5 px-3 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/80 active:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 shadow-xs active:scale-[0.98] group cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 transition-transform group-hover:scale-110 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>{isGoogleLoading ? 'Connecting...' : 'Sign up with Google'}</span>
                  </button>

                  {/* Divider */}
                  <div className="relative my-2.5 flex items-center justify-center">
                    <div className="border-t border-slate-200/80 w-full" />
                    <span className="bg-white px-2.5 text-[10px] text-slate-400 font-medium tracking-wider uppercase absolute">
                      or continue with email
                    </span>
                  </div>

                  {/* Form with Strict Validation */}
                  <form onSubmit={handleSubmit} className="space-y-2" noValidate>
                    {/* Full Name Input */}
                    <div>
                      <div className="flex justify-between items-center mb-0.5">
                        <label className="block text-[11px] sm:text-xs font-semibold text-slate-700">
                          Full Name
                        </label>
                        {touched.fullName && errors.fullName && (
                          <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5 animate-slide-up">
                            <AlertCircle size={10} />
                            <span>{errors.fullName}</span>
                          </span>
                        )}
                      </div>
                      <div className="relative group">
                        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${touched.fullName && errors.fullName ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-blue-600'
                          }`}>
                          <UserIcon size={16} />
                        </div>
                        <input
                          type="text"
                          name="fullName"
                          value={fullName}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          placeholder="John Doe"
                          className={`w-full pl-9 pr-8 py-2 bg-[#f8fafc] border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-medium shadow-xs ${touched.fullName && errors.fullName
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/20 animate-shake'
                            : touched.fullName && !errors.fullName && fullName
                              ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 bg-emerald-50/10'
                              : 'border-slate-200/90 focus:ring-3 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white'
                            }`}
                        />
                        {touched.fullName && !errors.fullName && fullName && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-500 animate-pop-check pointer-events-none">
                            <CheckCircle2 size={15} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Email Input */}
                    <div>
                      <div className="flex justify-between items-center mb-0.5">
                        <label className="block text-[11px] sm:text-xs font-semibold text-slate-700">
                          Email Address
                        </label>
                        {touched.email && errors.email && (
                          <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5 animate-slide-up">
                            <AlertCircle size={10} />
                            <span>{errors.email}</span>
                          </span>
                        )}
                      </div>
                      <div className="relative group">
                        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${touched.email && errors.email ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-blue-600'
                          }`}>
                          <Mail size={16} />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={email}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          placeholder="name@company.com"
                          className={`w-full pl-9 pr-8 py-2 bg-[#f8fafc] border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-medium shadow-xs ${touched.email && errors.email
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/20 animate-shake'
                            : touched.email && !errors.email && email
                              ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 bg-emerald-50/10'
                              : 'border-slate-200/90 focus:ring-3 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white'
                            }`}
                        />
                        {touched.email && !errors.email && email && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-500 animate-pop-check pointer-events-none">
                            <CheckCircle2 size={15} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Password Input */}
                    <div>
                      <div className="flex justify-between items-center mb-0.5">
                        <label className="block text-[11px] sm:text-xs font-semibold text-slate-700">
                          Password (Max 8 Chars)
                        </label>
                        {touched.password && errors.password && (
                          <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5 animate-slide-up">
                            <AlertCircle size={10} />
                            <span>{errors.password}</span>
                          </span>
                        )}
                      </div>
                      <div className="relative group">
                        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${touched.password && errors.password ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-blue-600'
                          }`}>
                          <Lock size={16} />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={password}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          maxLength={8}
                          placeholder="Pass123#"
                          className={`w-full pl-9 pr-9 py-2 bg-[#f8fafc] border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-medium shadow-xs ${touched.password && errors.password
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/20 animate-shake'
                            : touched.password && !errors.password && password
                              ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-400/20'
                              : 'border-slate-200/90 focus:ring-3 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white'
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

                    {/* Role Selection Input (RBAC) */}
                    <div>
                      <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-0.5">
                        Select User Role (RBAC)
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                          <Briefcase size={16} />
                        </div>
                        <select
                          name="role"
                          value={role}
                          onChange={handleInputChange}
                          className="w-full pl-9 pr-8 py-2 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-3 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white transition-all font-medium appearance-none cursor-pointer shadow-xs"
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
                      <div className={`p-2 rounded-lg text-xs flex items-center gap-1.5 animate-slide-up ${submittedMessage.type === 'success'
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

                    {/* Submit Button */}
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

                {/* Bottom Switcher Navigation */}
                <div className="mt-3 pt-2 border-t border-slate-100/80 text-center">
                  <p className="text-xs text-slate-500 font-medium">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="text-blue-600 font-bold hover:underline cursor-pointer focus:outline-none"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
