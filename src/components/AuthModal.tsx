import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, X, Eye, EyeOff, Check, RefreshCw, ExternalLink, Globe, HelpCircle, KeyRound } from 'lucide-react';

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

type AuthStep = 'login' | 'signup' | 'verify_email' | 'google_setup_info';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onAuthenticated }) => {
  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [testMailboxUrl, setTestMailboxUrl] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const googleBtnContainerRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

  // 60-second cooldown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Google Identity Services (GSI) ONLY when a genuine Client ID is present
  useEffect(() => {
    if (!googleClientId) return;

    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        const googleObj = (window as any).google.accounts.id;
        googleObj.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response?.credential) {
              await handleVerifyGoogleCredential(response.credential);
            }
          }
        });

        if (googleBtnContainerRef.current) {
          googleObj.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'rectangular'
          });
        }
      } catch (err) {
        console.warn('Google Identity initialization error:', err);
      }
    }
  }, [googleClientId, step]);

  if (!isOpen) return null;

  // Password Complexity Verification Calculations (8+ chars, upper, lower, number, special char)
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=\\/\[\]~`]/.test(password);

  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  // 1. Handle Email Sign Up -> Creates account and sends 6-digit verification code
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
      setErrorMessage('Password must satisfy all 5 security complexity requirements.');
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

      setTestMailboxUrl(data.previewUrl || null);
      setDevCode(data.devCode || null);
      setSuccessMessage(data.message || `A 6-digit confirmation code was dispatched to ${cleanEmail}.`);
      setResendCooldown(60);
      setOtpCode('');
      setStep('verify_email');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration error');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle 6-Digit Email Verification Confirmation
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
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: otpCode.trim() })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code. Please check your code and try again.');
      }

      const verifiedUser: AuthUser = {
        email: data.user.email,
        name: data.user.name,
        token: data.sessionToken,
        isVerified: true,
        provider: 'email'
      };

      // Save strictly to this browser session
      localStorage.setItem('sc_auth_session', JSON.stringify(verifiedUser));
      setSuccessMessage('Email verified successfully! Welcome to the interview platform.');
      setTimeout(() => {
        onAuthenticated(verifiedUser);
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Code is invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Email Login (Checks credentials and verification state)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Email address is required.');
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
        setTestMailboxUrl(data.previewUrl || null);
        setErrorMessage(data.error || 'Please verify your email address before accessing the platform.');
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

      // Save strictly to this browser session
      localStorage.setItem('sc_auth_session', JSON.stringify(verifiedUser));
      setSuccessMessage('Login successful! Entering platform...');
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

      setTestMailboxUrl(data.previewUrl || null);
      setSuccessMessage(data.message || `A fresh 6-digit code has been dispatched to ${email}.`);
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Complete Google Auth when a real Google JWT is received
  const handleVerifyGoogleCredential = async (credential: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
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
      setErrorMessage(err.message || 'Google Auth error');
    } finally {
      setIsLoading(false);
    }
  };

  // 6. When user clicks "Continue with Google"
  const handleGoogleClick = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (googleClientId) {
      // If client ID is present, trigger Google prompt
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.prompt();
      }
    } else {
      // If client ID is not configured, show clear setup guide and direct to email login
      setStep('google_setup_info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#001428]/85 backdrop-blur-md flex items-center justify-center p-4">
      {/* ------------------------------------------------------------- */}
      {/* GOOGLE SETUP INFO MODAL (Explains why real Client ID is needed)*/}
      {/* ------------------------------------------------------------- */}
      {step === 'google_setup_info' && (
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#e2e8f0] overflow-hidden animate-in fade-in zoom-in-95 duration-150 space-y-5">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#0f2942]">Google OAuth Setup</h3>
            </div>
            <button
              onClick={() => setStep('login')}
              className="p-1 text-[#64748b] hover:text-[#0f2942] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs text-[#334155]">
            <div className="p-3.5 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] space-y-1.5">
              <span className="font-bold text-[#1e40af] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>Google Client ID kyu chahiye?</span>
              </span>
              <p className="text-[11px] text-[#3b82f6] leading-relaxed">
                Google ke official servers (<code>accounts.google.com</code>) sirf tab login allow karte hain jab aapke Google Cloud Project se bana hua valid Client ID ho. Dummy Client ID dalne par Google <strong>&quot;Error 401: invalid_client&quot;</strong> dikhata hai.
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-[#0f2942]">Google Sign-In activate karne ke 3 steps:</span>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-[#64748b]">
                <li><strong>console.cloud.google.com</strong> par jaakar naya project banayein.</li>
                <li><strong>APIs & Services &rarr; Credentials</strong> me <strong>OAuth 2.0 Client ID</strong> (Web application) create karein.</li>
                <li>Milne wali Client ID ko <code>VITE_GOOGLE_CLIENT_ID</code> me set karein.</li>
              </ol>
            </div>

            <div className="p-3 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] text-[11px] text-[#475569]">
              <strong className="text-[#0f2942]">Abhi Bina Setup ke Access Karein:</strong>
              <p className="mt-0.5">
                Aapko Google Cloud setup karne ki zaroorat nahi hai! Aap niche <strong>Email & Password</strong> se turant Sign Up / Sign In karke app ko 100% securely access kar sakte hain.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStep('login')}
              className="w-full py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Email & Password Se Login Karein</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PRIMARY AUTH CARD (Login, Signup, Verify Email)               */}
      {/* ------------------------------------------------------------- */}
      {step !== 'google_setup_info' && (
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
                    placeholder="name@example.com"
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
                  <span className="bg-white px-2 text-[#94a3b8]">or</span>
                </div>
              </div>

              {/* If Google Client ID is configured, render official GSI button, else show Google setup info */}
              <button
                type="button"
                onClick={handleGoogleClick}
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
                  Create an Account
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
                    placeholder="Candidate Name"
                    className="w-full text-xs bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl pl-9 pr-3 py-2 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
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
                    placeholder="name@example.com"
                    className="w-full text-xs bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl pl-9 pr-3 py-2 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
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
                    placeholder="Create secure password"
                    className="w-full text-xs bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl pl-9 pr-9 py-2 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
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

              {/* Password Complexity Checklist */}
              {password.length > 0 && (
                <div className="p-2.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-1 text-[11px]">
                  <span className="font-semibold text-[#0f2942] block">Password Security Requirements:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[#64748b]">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-[#16a34a] font-semibold' : ''}`}>
                      <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'text-[#16a34a]' : 'text-[#cbd5e1]'}`} />
                      <span>8+ Characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-[#16a34a] font-semibold' : ''}`}>
                      <Check className={`w-3.5 h-3.5 ${hasUppercase ? 'text-[#16a34a]' : 'text-[#cbd5e1]'}`} />
                      <span>Uppercase (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-[#16a34a] font-semibold' : ''}`}>
                      <Check className={`w-3.5 h-3.5 ${hasLowercase ? 'text-[#16a34a]' : 'text-[#cbd5e1]'}`} />
                      <span>Lowercase (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-[#16a34a] font-semibold' : ''}`}>
                      <Check className={`w-3.5 h-3.5 ${hasNumber ? 'text-[#16a34a]' : 'text-[#cbd5e1]'}`} />
                      <span>Number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 sm:col-span-2 ${hasSpecialChar ? 'text-[#16a34a] font-semibold' : ''}`}>
                      <Check className={`w-3.5 h-3.5 ${hasSpecialChar ? 'text-[#16a34a]' : 'text-[#cbd5e1]'}`} />
                      <span>Special Symbol (!@#$%^&* etc.)</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className="w-full py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>{isLoading ? 'Creating Account...' : 'Sign Up & Verify Email'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1 text-xs text-[#64748b]">
                Already have an account?{' '}
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

          {/* STEP 3: Verify Email Code Form */}
          {step === 'verify_email' && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-[#eff4ff] text-[#2563eb] flex items-center justify-center mx-auto">
                  <Mail className="w-5 h-5" />
                </div>
                <p className="text-xs text-[#0f2942] font-semibold">
                  A 6-digit verification code was dispatched to:
                </p>
                <div className="text-xs font-mono font-bold text-[#2563eb] bg-[#f8f9ff] py-1 px-3 rounded-lg inline-block border border-[#e2e8f0]">
                  {email}
                </div>
                <p className="text-[11px] text-[#64748b]">
                  Please enter the 6-digit confirmation code below to activate your account.
                </p>
              </div>

              {/* Live Test Mailbox Link (If Ethereal or test mailer is active) */}
              {testMailboxUrl && (
                <div className="p-3 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] text-xs text-[#1e40af] space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Globe className="w-4 h-4 text-[#2563eb] shrink-0" />
                    <span>Live Test Mailbox Dispatched</span>
                  </div>
                  <p className="text-[11px] text-[#3b82f6]">
                    Email has been delivered to a live test mailbox. Click below to view the delivered email and 6-digit code:
                  </p>
                  <a
                    href={testMailboxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563eb] text-white text-xs font-semibold hover:bg-[#1d4ed8] transition-colors"
                  >
                    <span>📬 Open Delivered Email in Mailbox</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0f2942] mb-1">
                  Enter 6-Digit Code
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
                <span>{isLoading ? 'Verifying...' : 'Verify Email & Enter Platform'}</span>
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
