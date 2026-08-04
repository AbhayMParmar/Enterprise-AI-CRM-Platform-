import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Sparkles, AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardBody } from '../components/ui/Card';

export const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: toastError } = useToast();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email = location.state?.email || '';

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    setError(null);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((pastedText) => {
        const digits = pastedText.replace(/\D/g, '').slice(0, 6);
        if (digits.length > 0) {
          const newOtp = [...otp];
          for (let i = 0; i < 6; i++) {
            newOtp[i] = digits[i] || '';
          }
          setOtp(newOtp);
          // Focus the last filled input
          const lastIndex = Math.min(digits.length, 6) - 1;
          inputRefs.current[lastIndex]?.focus();
        }
      });
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digits = pastedText.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtp(newOtp);
      const lastIndex = Math.min(digits.length, 6) - 1;
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setError(null);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        success('New verification code sent!');
        setCountdown(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to resend code. Please try again.';
      setError(errorMessage);
      toastError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const otpValue = otp.join('');

    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/verify-reset-otp', { email, otp: otpValue });
      
      if (response.data.success) {
        setIsSuccess(true);
        success('OTP verified successfully!');
        
        // Redirect to reset password page after 1.5 seconds
        setTimeout(() => {
          navigate('/reset-password', { state: { email, otp: otpValue } });
        }, 1500);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Invalid verification code';
      setError(errorMessage);
      toastError(errorMessage);
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      {/* Soft Ambient Background Glows */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-aura" />
      <div className="absolute -bottom-8 right-2 w-56 h-56 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse-aura" />

      <div className="w-full max-w-md relative z-10">
        <Card className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_rgba(37,99,235,0.08)] border border-slate-200/90 overflow-hidden">
          <CardHeader className="p-6 pb-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-800 tracking-tight">AI CRM Suite</span>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              Verify Email
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Enter the 6-digit verification code
            </p>
          </CardHeader>

          <CardBody className="p-6 pt-4">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  Verification Successful!
                </h2>
                <p className="text-sm text-slate-600 mb-4">
                  Redirecting to reset password...
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* OTP Input Boxes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-3 text-center">
                    Verification Code
                  </label>
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all ${
                          error
                            ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-400/20'
                            : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20'
                        }`}
                      />
                    ))}
                  </div>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-3 text-xs font-semibold text-rose-500 flex items-center justify-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </motion.p>
                  )}
                </div>

                {/* Resend Timer */}
                <div className="text-center">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                      {isResending ? 'Sending...' : 'Resend Code'}
                    </button>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Resend code in <span className="font-bold text-slate-700">{countdown}s</span>
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </Button>

                {/* Back to Forgot Password */}
                <div className="pt-4 text-center">
                  <Link
                    to="/forgot-password"
                    state={{ email }}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back to Email Entry
                  </Link>
                </div>
              </form>
            )}
          </CardBody>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-400">
            🔒 Code expires in 5 minutes. Never share your code with anyone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
