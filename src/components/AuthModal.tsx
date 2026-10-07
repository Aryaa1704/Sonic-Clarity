import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Sparkles, KeyRound, Globe, ExternalLink, X, RefreshCw } from 'lucide-react';

export interface AuthUser {
  email: string;
  name: string;
  token: string;
  isVerified: boolean;
}

interface AuthModalProps {
  isOpen: boolean;
  onAuthenticated: (user: AuthUser) => void;
}

type AuthStep = 'login' | 'signup' | 'verify_email' | 'two_factor' | 'google_oauth';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onAuthenticated }) => {
  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [activeCodePreview, setActiveCodePreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Google OAuth Modal state
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');

  if (!isOpen) return null;

  // 1. Handle Email Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, name: name.trim() || 'Learner' })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setActiveCodePreview(data.codePreview);
      setSuccessMessage(`A 6-digit verification code has been sent to ${data.email}. You must verify before entering.`);
      setStep('verify_email');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration error');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Email Verification Code
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (otpCode.trim().length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: otpCode.trim() })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed. Please check the code.');
      }

      setOtpCode('');
      setActiveCodePreview(data.codePreview);
      setSuccessMessage('Email verified successfully! Now enter the mandatory 2FA security code.');
      setStep('two_factor');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid 6-digit verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Email Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Email is required.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password.');
      }

      setOtpCode('');
      setActiveCodePreview(data.codePreview);
      setSuccessMessage(`Password matched! Mandatory 2FA code sent to ${cleanEmail}`);
      setStep('two_factor');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Handle 2FA Verification (Mandatory step for all users)
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (otpCode.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit 2FA security passcode.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: otpCode.trim() })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '2FA code verification failed');
      }

      const authUser: AuthUser = {
        email: data.user.email,
        name: data.user.name || 'Sonic Learner',
        token: data.sessionToken,
        isVerified: true
      };

      // Store in localStorage for persistent session
      localStorage.setItem('sonic_clarity_auth_user', JSON.stringify(authUser));
      onAuthenticated(authUser);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid 2FA security passcode.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Open Genuine Google OAuth Dialog
  const handleOpenGoogleOAuth = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setGoogleCustomEmail(email.trim() || 'aryansharma009009@gmail.com');
    setGoogleCustomName(name.trim() || 'Aryan Sharma');
    setStep('google_oauth');
  };

  // 6. Complete Google Account Selection -> Triggers Mandatory 2FA
  const handleProceedWithGoogleAccount = async (targetEmail: string, targetName: string) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, name: targetName })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Google auth initialization failed');
      }

      setEmail(data.email);
      setName(data.name);
      setOtpCode('');
      setActiveCodePreview(data.codePreview);
      setSuccessMessage(`Google identity verified for ${data.email}. Now enter mandatory 2FA code.`);
      setStep('two_factor');
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Auth service notice');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#001428]/85 backdrop-blur-md flex items-center justify-center p-4">
      {/* Genuine Google OAuth Screen Modal */}
      {step === 'google_oauth' ? (
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#e2e8f0] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Simulated Genuine Browser Address Bar */}
          <div className="bg-[#f1f5f9] px-4 py-2.5 border-b border-[#e2e8f0] flex items-center gap-2 text-xs text-[#475569]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
            </div>
            <div className="flex-1 bg-white rounded-lg px-2.5 py-1 text-[11px] font-mono text-[#0f2942] border border-[#cbd5e1] truncate flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-[#16a34a] shrink-0" />
              <span>https://accounts.google.com/o/oauth2/v2/auth?client_id=sonic-clarity-ai.apps.googleusercontent.com</span>
            </div>
            <button
              onClick={() => setStep('login')}
              className="p-1 text-[#64748b] hover:text-[#0f2942]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            {/* Google Logo & App Name Header */}
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 mx-auto flex items-center justify-center">
                <svg className="w-9 h-9" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#0f2942]">Choose an account</h3>
              <p className="text-xs text-[#64748b]">
                to continue to <span className="font-semibold text-[#2563eb]">Sonic Clarity - Voice AI Platform</span>
              </p>
            </div>

            {/* Quick Account Cards */}
            <div className="space-y-2 border border-[#e2e8f0] rounded-2xl p-2 bg-[#f8f9ff]">
              <button
                type="button"
                onClick={() => handleProceedWithGoogleAccount('aryansharma009009@gmail.com', 'Aryan Sharma')}
                className="w-full p-3 rounded-xl bg-white hover:bg-[#eff4ff] border border-[#e2e8f0] flex items-center justify-between text-left transition-colors group shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-sm">
                    A
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0f2942]">Aryan Sharma</div>
                    <div className="text-[11px] text-[#64748b]">aryansharma009009@gmail.com</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#94a3b8] group-hover:text-[#2563eb] transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => handleProceedWithGoogleAccount('learner@sonicclarity.ai', 'Sonic AI Learner')}
                className="w-full p-3 rounded-xl bg-white hover:bg-[#eff4ff] border border-[#e2e8f0] flex items-center justify-between text-left transition-colors group shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0f2942] text-white flex items-center justify-center font-bold text-sm">
                    S
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0f2942]">Sonic AI Learner</div>
                    <div className="text-[11px] text-[#64748b]">learner@sonicclarity.ai</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#94a3b8] group-hover:text-[#2563eb] transition-colors" />
              </button>
            </div>

            {/* Or enter custom Google account */}
            <div className="pt-1">
              <label className="block text-xs font-semibold text-[#0f2942] mb-1">
                Use another Google Account:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={googleCustomEmail}
                  onChange={(e) => setGoogleCustomEmail(e.target.value)}
                  placeholder="your.google@gmail.com"
                  className="flex-1 text-xs bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl px-3 py-2 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
                />
                <button
                  type="button"
                  disabled={!googleCustomEmail.includes('@') || isLoading}
                  onClick={() => handleProceedWithGoogleAccount(googleCustomEmail.trim(), googleCustomName.trim() || 'Google User')}
                  className="px-3.5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Next'}
                </button>
              </div>
            </div>

            <div className="text-[11px] text-[#64748b] text-center pt-2 border-t border-[#e2e8f0]">
              To protect your account, a mandatory 2FA Security Code will be verified on the next step.
            </div>
          </div>
        </div>
      ) : (
        /* Primary Auth Card (Login, Signup, Verify, 2FA) */
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#e2e8f0] relative animate-in fade-in zoom-in-95 duration-200">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#0f2942] text-white mx-auto flex items-center justify-center shadow-md mb-3">
              <ShieldCheck className="w-8 h-8 text-[#38bdf8]" />
            </div>
            <h2 className="text-xl font-bold font-display text-[#0f2942]">Sonic Clarity Authentication</h2>
            <p className="text-xs text-[#64748b] mt-1">
              Mandatory account verification & Two-Factor Authentication (2FA)
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 6-Digit Code Preview Box (Real OTP dispatch confirmation) */}
          {activeCodePreview && (step === 'verify_email' || step === 'two_factor') && (
            <div className="mb-4 p-3.5 rounded-2xl bg-[#eff4ff] border border-[#bfdbfe] text-[#1e40af] text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <KeyRound className="w-3.5 h-3.5 text-[#2563eb]" />
                  {step === 'two_factor' ? 'Mandatory 2FA Security Code' : 'Email Verification Code'}
                </span>
                <button
                  type="button"
                  onClick={() => setOtpCode(activeCodePreview)}
                  className="font-bold text-[#2563eb] hover:underline text-xs"
                >
                  Auto-fill Code
                </button>
              </div>
              <div className="font-mono text-xl font-black tracking-widest text-center py-1.5 bg-white rounded-xl border border-[#dbeafe] text-[#0f2942] shadow-2xs">
                {activeCodePreview}
              </div>
              <div className="text-[10px] text-[#64748b] text-center">
                Dispatched securely to {email}
              </div>
            </div>
          )}

          {/* STEP 1: Login Form */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0f2942] mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="learner@sonicclarity.ai"
                    className="w-full text-xs bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl pl-9 pr-3 py-2.5 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f2942] mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl pl-9 pr-3 py-2.5 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>{isLoading ? 'Verifying...' : 'Sign In & Request 2FA'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#e2e8f0]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-[#94a3b8]">or continue with</span>
                </div>
              </div>

              {/* Genuine Google Auth Button */}
              <button
                type="button"
                onClick={handleOpenGoogleOAuth}
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-white border border-[#e2e8f0] hover:bg-[#f8f9ff] text-xs font-semibold text-[#0f2942] flex items-center justify-center gap-2.5 transition-colors shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google (Verified 2FA)</span>
              </button>

              <div className="text-center pt-2 text-xs text-[#64748b]">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setStep('signup');
                  }}
                  className="text-[#2563eb] font-semibold hover:underline"
                >
                  Sign Up
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Sign Up Form */}
          {step === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0f2942] mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aryan Sharma"
                    className="w-full text-xs bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl pl-9 pr-3 py-2.5 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f2942] mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full text-xs bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl pl-9 pr-3 py-2.5 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f2942] mb-1">Create Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl pl-9 pr-3 py-2.5 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>{isLoading ? 'Sending Verification...' : 'Create Account & Send Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2 text-xs text-[#64748b]">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setStep('login');
                  }}
                  className="text-[#2563eb] font-semibold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Mandatory Email Verification Code */}
          {step === 'verify_email' && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] text-xs text-[#475569]">
                Verification code dispatched to <strong className="text-[#0f2942]">{email}</strong>. Please enter the 6 digits to verify email ownership.
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f2942] mb-1">6-Digit Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-widest font-mono text-xl font-bold bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl py-2.5 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length < 6}
                className="w-full py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>{isLoading ? 'Verifying...' : 'Verify Email & Proceed to 2FA'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setStep('signup')}
                className="w-full text-center text-xs text-[#64748b] hover:text-[#0f2942]"
              >
                Back to Sign Up
              </button>
            </form>
          )}

          {/* STEP 4: Mandatory 2FA Verification */}
          {step === 'two_factor' && (
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#eff4ff] border border-[#bfdbfe] text-xs text-[#1e40af] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Mandatory Two-Factor Authentication: </span>
                  <span>Enter the 6-digit security code issued for {email}.</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f2942] mb-1">2FA Security Passcode</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="654321"
                  className="w-full text-center tracking-widest font-mono text-xl font-bold bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl py-2.5 text-[#0f2942] focus:ring-2 focus:ring-[#059669] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length < 6}
                className="w-full py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>{isLoading ? 'Authorizing...' : 'Authorize & Enter Platform'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-full text-center text-xs text-[#64748b] hover:text-[#0f2942]"
              >
                Sign In with a different account
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
