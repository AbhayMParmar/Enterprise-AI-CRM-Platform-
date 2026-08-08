import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, ShieldAlert, Check, Eye, EyeOff, Sparkles, Zap, AlertCircle, CheckCircle2, Briefcase, ShieldCheck, Smartphone, Tablet, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';

type ViewportMode = 'responsive' | 'mobile' | 'tablet';

export const Register = () => {
  const [viewport, setViewport] = useState<ViewportMode>('responsive');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'SuperAdmin' | 'Admin' | 'SalesManager' | 'SalesRep'>('SalesRep');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const validateField = (name: string, value: string): string | undefined => {
    if (name === 'fullName') {
      if (!value.trim()) return 'Full name is required';
      if (value.trim().length < 3) return 'Min 3 characters required';
      if (!/^[a-zA-Z\s]+$/.test(value)) return 'Only letters and spaces allowed';
    }

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

    return undefined;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'password' && value.length > 8) {
      return;
    }

    if (name === 'fullName') setName(value);
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
    if (name === 'role') setRole(value as any);


    if (name !== 'role') {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { fullName?: string; email?: string; password?: string } = {};
    const nameErr = validateField('fullName', name);
    if (nameErr) newErrors.fullName = nameErr;

    const emailErr = validateField('email', email);
    if (emailErr) newErrors.email = emailErr;

    const passErr = validateField('password', password);
    if (passErr) newErrors.password = passErr;

    setErrors(newErrors);
    setTouched({ fullName: true, email: true, password: true, role: true });

    if (Object.keys(newErrors).length > 0) {
      setSubmittedMessage({ text: 'Please resolve validation errors before submitting.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setSubmittedMessage(null);

    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      const { accessToken, user } = response.data;
      login(accessToken, user);
      success('Account created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to register account.';
      setSubmittedMessage({ text: errMsg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setSubmittedMessage(null);
    setTimeout(() => {
      setIsGoogleLoading(false);
      setSubmittedMessage({ text: 'Logged in via Google successfully!', type: 'success' });
      setTimeout(() => setSubmittedMessage(null), 4000);
    }, 1200);
  };

  const getViewportWidthClass = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-[380px] w-full';
      case 'tablet':
        return 'max-w-[650px] w-full';
      default:
        return 'w-full max-w-md';
    }
  };

  return (
    <>
      {/* Mobile/Tablet View - New Design */}
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col items-center justify-center p-2 sm:p-4 relative selection:bg-blue-500 selection:text-white lg:hidden">
        {/* Viewport Simulation Bar */}
        <div className="w-full max-w-2xl mb-3 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-2 overflow-x-auto z-30">
          <div className="flex items-center gap-1.5 pl-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
              Viewport Simulator:
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewport === 'mobile'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone size={13} />
              <span>Mobile (380px)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewport('tablet')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewport === 'tablet'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Tablet size={13} />
              <span>Tablet (650px)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewport('responsive')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewport === 'responsive'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Monitor size={13} />
              <span>Auto Fluid (Desktop)</span>
            </button>
          </div>
        </div>

        <div className={`w-full ${getViewportWidthClass()} transition-all duration-300 relative`}>
          {/* Soft Ambient Background Glows */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-aura" />
          <div className="absolute -bottom-8 right-2 w-56 h-56 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse-aura" />

          {/* Main Zero-Scroll Glass Card Container */}
          <div className="w-full bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_12px_40px_rgba(37,99,235,0.08)] border border-slate-200/90 overflow-hidden flex flex-col relative z-10 transition-all animate-slide-up">
          <div className="w-full p-4 sm:p-6 md:p-8 flex flex-col justify-between">
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
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                      touched.fullName && errors.fullName ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-blue-600'
                    }`}>
                      <UserIcon size={16} />
                    </div>
                    <input
                      type="text"
                      name="fullName"
                      value={name}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="John Doe"
                      className={`w-full pl-9 pr-8 py-2 bg-[#f8fafc] border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-medium shadow-xs ${
                        touched.fullName && errors.fullName
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/20 animate-shake'
                          : touched.fullName && !errors.fullName && name
                          ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 bg-emerald-50/10'
                          : 'border-slate-200/90 focus:ring-3 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white'
                      }`}
                    />
                    {touched.fullName && !errors.fullName && name && (
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
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                      touched.email && errors.email ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-blue-600'
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
                      className={`w-full pl-9 pr-8 py-2 bg-[#f8fafc] border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-medium shadow-xs ${
                        touched.email && errors.email
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
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                      touched.password && errors.password ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-blue-600'
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
                      className={`w-full pl-9 pr-9 py-2 bg-[#f8fafc] border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-medium shadow-xs ${
                        touched.password && errors.password
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
                      className="w-full pl-9 pr-8 py-2.5 sm:py-2 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-3 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white transition-all font-medium appearance-none cursor-pointer shadow-xs"
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
                <Link to="/login" className="text-blue-600 font-bold hover:underline cursor-pointer focus:outline-none">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Desktop View - Keep Original */}
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] px-4 sm:px-6 py-4 sm:py-8 hidden lg:flex">
        {/* Background decoration elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-primary/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-primary/20 blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md z-10"
        >
          <Card className="premium-shadow overflow-hidden">
            <CardHeader className="bg-slate-50/50 flex flex-col items-center py-6 text-center border-b border-brand-border">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-primary text-white font-bold text-lg leading-none shadow-md mb-2.5">
                AI
              </div>
              <h1 className="text-xl font-bold text-brand-textPrimary">Create Account</h1>
              <p className="text-xs text-brand-textSecondary mt-1">Get started with your CRM workspace</p>
            </CardHeader>

            <CardBody className="py-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<UserIcon className="w-4 h-4" />}
                  autoComplete="name"
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  autoComplete="email"
                  required
                />

                <Input
                  label="Password (Max 8 Chars)"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => {
                    if (e.target.value.length > 8) return;
                    setPassword(e.target.value);
                  }}
                  leftIcon={<Lock className="w-4 h-4" />}
                  autoComplete="new-password"
                  maxLength={8}
                  required
                />

                {/* Role selector to easily test RBAC */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-brand-textPrimary select-none">
                    Select User Role (for testing RBAC)
                  </label>
                  <div className="relative">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg outline-none transition-all duration-200 text-brand-textPrimary focus:ring-brand-primary/20 focus:border-brand-primary appearance-none cursor-pointer pr-10"
                    >
                      <option value="SalesRep">Sales Representative (SalesRep)</option>
                      <option value="SalesManager">Sales Manager</option>
                      <option value="Admin">Administrator (Admin)</option>
                      <option value="SuperAdmin">Super Administrator (SuperAdmin)</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-textSecondary pointer-events-none">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2"
                  isLoading={isLoading}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Sign Up
                </Button>
              </form>
            </CardBody>

            <CardFooter className="py-4 text-center">
              <p className="text-xs text-brand-textSecondary">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-primary hover:underline font-semibold">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Register;
