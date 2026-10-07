import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, KeyRound, X, Eye, EyeOff, Check, RefreshCw, Send } from 'lucide-react';

export interface AuthUser {
  email: string;
  name: string;
  token: string;
  isVerified: boolean;
  provider?: 'google' | 'email';
}

interface AuthModalProps {
  isOpen: boolean;
  onAuthenticated: (user: AuthUser) => void;
}

type AuthStep = 'login' | 'signup' | 'verify_email' | 'google_oauth' | 'google_consent';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onAuthenticated }) => {
  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [dispatchedCode, setDispatchedCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Google OAuth State
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState<{ email: string; name: string } | null>(null);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');

  // 60-second cooldown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Password Complexity Verification Calculations (8+ chars, upper, lower, number, special char)
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=\\/\[\]~`]/.test(password);

  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  // 1. Handle Email Sign Up -> Sends Verification Code & Locks Platform
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Password must satisfy all 5 complexity requirements.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, name: name.trim() || cleanEmail.split('@')[0] })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setDispatchedCode(data.verificationCode || null);
      setSuccessMessage(`A 6-digit verification code has been dispatched to ${cleanEmail}.`);
      setResendCooldown(60);
      setOtpCode('');
      setStep('verify_email');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration error');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle 6-Digit Email Verification Code Confirmation
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
        throw new Error(data.error || 'Invalid verification code. Please check your email.');
      }

      const verifiedUser: AuthUser = {
        email: data.user.email,
        name: data.user.name,
        token: data.sessionToken,
        isVerified: true,
        provider: 'email'
      };

      localStorage.setItem('sc_auth_session', JSON.stringify(verifiedUser));
      setSuccessMessage('Email verified successfully! Entering platform...');
      setTimeout(() => {
        onAuthenticated(verifiedUser);
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Code is invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Email Login (Checks Verification Gate)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Email is required.');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required.');
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

      // If user is unverified, server rejects with 403 and requiresVerification
      if (res.status === 403 && data.requiresVerification) {
        setDispatchedCode(data.verificationCode || null);
        setErrorMessage(data.error || 'Please verify your email before accessing the app.');
        setResendCooldown(60);
        setOtpCode('');
        setStep('verify_email');
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password.');
      }

      const verifiedUser: AuthUser = {
        email: data.user.email,
        name: data.user.name,
        token: data.sessionToken,
        isVerified: true,
        provider: 'email'
      };

      localStorage.setItem('sc_auth_session', JSON.stringify(verifiedUser));
      setSuccessMessage('Login successful! Entering interview platform...');
      setTimeout(() => {
        onAuthenticated(verifiedUser);
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Resend Verification Code
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not resend verification code');
      }

      setDispatchedCode(data.verificationCode || null);
      setSuccessMessage(`A fresh 6-digit verification code has been dispatched to ${email}.`);
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Open Google OAuth Modal
  const handleOpenGoogleOAuth = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setStep('google_oauth');
  };

  // 6. When user selects Google account -> Open Google Permissions & Consent Screen
  const handleSelectGoogleAccount = (targetEmail: string, targetName: string) => {
    setSelectedGoogleAccount({ email: targetEmail, name: targetName });
    setStep('google_consent');
  };

  // 7. When user explicitly clicks "Allow & Continue" on Google Consent Screen
  const handleConfirmGoogleConsent = async () => {
    if (!selectedGoogleAccount) return;
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedGoogleAccount.email, name: selectedGoogleAccount.name })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Google authentication failed');
      }

      const verifiedUser: AuthUser = {
        email: data.user.email,
        name: data.user.name,
        token: data.sessionToken,
        isVerified: true,
        provider: 'google'
      };

      localStorage.setItem('sc_auth_session', JSON.stringify(verifiedUser));
      onAuthenticated(verifiedUser);
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Auth service error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#001428]/85 backdrop-blur-md flex items-center justify-center p-4">
      {/* ------------------------------------------------------------- */}
      {/* STEP: GOOGLE PERMISSION & CONSENT SCREEN                      */}
      {/* ------------------------------------------------------------- */}
      {step === 'google_consent' && selectedGoogleAccount && (
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#e2e8f0] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-[#f1f5f9] px-4 py-2.5 border-b border-[#e2e8f0] flex items-center gap-2 text-xs text-[#475569]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
            </div>
            <div className="flex-1 bg-white rounded-lg px-2.5 py-1 text-[11px] font-mono text-[#0f2942] border border-[#cbd5e1] truncate flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-[#16a34a] shrink-0" />
              <span>https://accounts.google.com/signin/oauth/v2/consent?client_id=interview-coach.googleusercontent.com</span>
            </div>
            <button
              onClick={() => setStep('google_oauth')}
              className="p-1 text-[#64748b] hover:text-[#0f2942]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 mx-auto flex items-center justify-center">
                <svg className="w-9 h-9" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#0f2942]">AI Voice Interview Coach wants access to your Google Account</h3>
              <p className="text-xs text-[#64748b]">Select Allow to grant permissions and sign in</p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0]">
              <div className="w-10 h-10 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {selectedGoogleAccount.name ? selectedGoogleAccount.name[0].toUpperCase() : 'G'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#0f2942] truncate">{selectedGoogleAccount.name}</div>
                <div className="text-[11px] text-[#64748b] truncate">{selectedGoogleAccount.email}</div>
              </div>
              <button
                type="button"
                onClick={() => setStep('google_oauth')}
                className="text-[11px] font-semibold text-[#2563eb] hover:underline shrink-0"
              >
                Change
              </button>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-[#0f2942]">
                This will allow AI Voice Interview Coach to:
              </span>

              <div className="space-y-2 text-xs text-[#334155]">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-[#e2e8f0]">
                  <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#0f2942]">See your primary Google Account email address</span>
                    <p className="text-[11px] text-[#64748b]">{selectedGoogleAccount.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-[#e2e8f0]">
                  <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#0f2942]">See your personal info</span>
                    <p className="text-[11px] text-[#64748b]">Name and profile identifier associated with this account</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-[#e2e8f0]">
                  <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#0f2942]">Associate your interview practice sessions</span>
                    <p className="text-[11px] text-[#64748b]">Save your pronunciation drills and role assessments</p>
                  </div>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('google_oauth')}
                className="px-5 py-2.5 rounded-xl border border-[#cbd5e1] hover:bg-[#f1f5f9] text-[#475569] text-xs font-semibold transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleConfirmGoogleConsent}
                className="px-6 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>{isLoading ? 'Authorizing Google...' : 'Allow & Continue'}</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP: GOOGLE ACCOUNT CHOOSER                                  */}
      {/* ------------------------------------------------------------- */}
      {step === 'google_oauth' && (
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#e2e8f0] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-[#f1f5f9] px-4 py-2.5 border-b border-[#e2e8f0] flex items-center gap-2 text-xs text-[#475569]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
            </div>
            <div className="flex-1 bg-white rounded-lg px-2.5 py-1 text-[11px] font-mono text-[#0f2942] border border-[#cbd5e1] truncate flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-[#16a34a] shrink-0" />
              <span>https://accounts.google.com/o/oauth2/v2/auth?client_id=interview-coach.googleusercontent.com</span>
            </div>
            <button
              onClick={() => setStep('login')}
              className="p-1 text-[#64748b] hover:text-[#0f2942]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
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
                to sign in to <span className="font-semibold text-[#2563eb]">AI Voice Interview Coach</span>
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="border border-[#e2e8f0] rounded-2xl p-2 bg-[#f8f9ff]">
              <button
                type="button"
                onClick={() => handleSelectGoogleAccount('aryansharma009009@gmail.com', 'Aryan Sharma')}
                className="w-full p-3 rounded-xl bg-white hover:bg-[#eff4ff] border border-[#e2e8f0] flex items-center justify-between text-left transition-colors group shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    A
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0f2942]">Aryan Sharma</div>
                    <div className="text-[11px] text-[#64748b]">aryansharma009009@gmail.com</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#94a3b8] group-hover:text-[#2563eb] transition-colors" />
              </button>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-[#0f2942] mb-1">
                Use another Google Account:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={googleCustomEmail}
                  onChange={(e) => setGoogleCustomEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="flex-1 text-xs bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl px-3 py-2 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
                />
                <button
                  type="button"
                  disabled={!googleCustomEmail.includes('@')}
                  onClick={() => handleSelectGoogleAccount(googleCustomEmail.trim(), googleCustomEmail.split('@')[0])}
                  className="px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="text-[11px] text-[#64748b] text-center pt-2 border-t border-[#e2e8f0] flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16a34a]" />
              <span>Protected by Google OAuth 2.0 Security Protocols</span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PRIMARY AUTH CARD (Login, Signup, Verify Email)               */}
      {/* ------------------------------------------------------------- */}
      {step !== 'google_oauth' && step !== 'google_consent' && (
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#e2e8f0] relative animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#0f2942] text-white flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="font-display font-black text-xl tracking-wider text-[#38bdf8]">SC</span>
            </div>
            <h2 className="text-xl font-bold font-display text-[#0f2942]">Sonic Clarity</h2>
            <p className="text-xs text-[#64748b] mt-1">
              AI Voice Interview Preparation Platform
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
              <span>{successMessage}</span>
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
                    placeholder="aryansharma009009@gmail.com"
                    className="w-full text-xs bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl pl-9 pr-3 py-2.5 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f2942] mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full text-xs bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl pl-9 pr-9 py-2.5 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f2942]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
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
                <span>Continue with Google</span>
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
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Sign Up Form */}
          {step === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
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
                    placeholder="aryansharma009009@gmail.com"
                    className="w-full text-xs bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl pl-9 pr-3 py-2.5 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f2942] mb-1">
                  Create Password (8+ Characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. Master@2026"
                    className="w-full text-xs bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl pl-9 pr-9 py-2.5 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f2942]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="mt-2.5 p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-1.5 text-[11px]">
                  <div className="font-semibold text-[#0f2942] text-[11px] mb-1 flex items-center justify-between">
                    <span>Password Complexity Requirements:</span>
                    <span className={isPasswordValid ? 'text-[#059669] font-bold' : 'text-[#d97706]'}>
                      {isPasswordValid ? 'All Met ✓' : 'Incomplete'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-[#059669] font-medium' : 'text-[#64748b]'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasMinLength ? 'bg-[#10b981] text-white' : 'bg-[#cbd5e1] text-[#475569]'}`}>
                        ✓
                      </span>
                      <span>8+ Characters</span>
                    </div>

                    <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-[#059669] font-medium' : 'text-[#64748b]'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasUppercase ? 'bg-[#10b981] text-white' : 'bg-[#cbd5e1] text-[#475569]'}`}>
                        ✓
                      </span>
                      <span>Uppercase (A-Z)</span>
                    </div>

                    <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-[#059669] font-medium' : 'text-[#64748b]'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasLowercase ? 'bg-[#10b981] text-white' : 'bg-[#cbd5e1] text-[#475569]'}`}>
                        ✓
                      </span>
                      <span>Lowercase (a-z)</span>
                    </div>

                    <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-[#059669] font-medium' : 'text-[#64748b]'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasNumber ? 'bg-[#10b981] text-white' : 'bg-[#cbd5e1] text-[#475569]'}`}>
                        ✓
                      </span>
                      <span>Number / Digit (0-9)</span>
                    </div>

                    <div className={`col-span-2 flex items-center gap-1.5 ${hasSpecialChar ? 'text-[#059669] font-medium' : 'text-[#64748b]'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasSpecialChar ? 'bg-[#10b981] text-white' : 'bg-[#cbd5e1] text-[#475569]'}`}>
                        ✓
                      </span>
                      <span>Special Symbol (!@#$%^&* etc.)</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className="w-full py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>{isLoading ? 'Creating Account...' : 'Sign Up & Send Verification Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1 text-xs text-[#64748b]">
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

          {/* STEP 3: Mandatory Email Verification Screen */}
          {step === 'verify_email' && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#eff4ff] border border-[#bfdbfe] text-xs text-[#1e40af] space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#1e3a8a]">
                  <Mail className="w-4 h-4 text-[#2563eb]" />
                  <span>Mandatory Email Verification Gate</span>
                </div>
                <p className="text-[11px] text-[#3b82f6]">
                  A secure 6-digit confirmation code was dispatched to:
                  <br />
                  <strong className="text-[#0f2942] font-mono text-xs">{email}</strong>
                </p>
                <p className="text-[10px] text-[#64748b]">
                  Platform access remains locked until you verify ownership of this email address.
                </p>
              </div>

              {/* Secure Dispatch Preview Banner for instant dev/preview verification */}
              {dispatchedCode && (
                <div className="p-3 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] text-xs text-[#166534] flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#16a34a] shrink-0" />
                    <span>
                      Dispatched Code: <strong className="font-mono text-sm tracking-widest text-[#0f2942] bg-white px-2 py-0.5 rounded-lg border border-[#bbf7d0]">{dispatchedCode}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpCode(dispatchedCode)}
                    className="text-xs font-bold text-[#16a34a] hover:underline shrink-0"
                  >
                    Fill Code
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0f2942] mb-1">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="------"
                  className="w-full text-center tracking-widest font-mono text-2xl font-bold bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl py-3 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[#64748b]">
                <span>Didn&apos;t receive code?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={handleResendCode}
                  className="text-[#2563eb] font-semibold hover:underline disabled:opacity-50 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length < 6}
                className="w-full py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>{isLoading ? 'Verifying Code...' : 'Verify Email & Unlock Platform'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setStep('login');
                }}
                className="w-full text-center text-xs text-[#64748b] hover:text-[#0f2942]"
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
