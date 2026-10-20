import React, { useState, useId, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Building2, ShieldCheck, ArrowRight } from 'lucide-react';
import { validateCorporateEmail, calculatePasswordStrength, DomainValidationResult } from '../utils/domainValidator';

export interface UserAccount {
  name: string;
  email: string;
  companyName: string;
  domain: string;
  createdAt: string;
}

interface AuthCardProps {
  onSuccess: (user: UserAccount) => void;
  registeredUsers: UserAccount[];
}

export const AuthCard: React.FC<AuthCardProps> = ({ onSuccess, registeredUsers }) => {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form error & validation state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state on signup or signin
  const [successData, setSuccessData] = useState<{
    mode: 'signup' | 'signin';
    user: UserAccount;
  } | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!successData) return;

    if (countdown <= 0) {
      onSuccess(successData.user);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [successData, countdown, onSuccess]);

  // Unique IDs for accessibility
  const nameInputId = useId();
  const emailInputId = useId();
  const passwordInputId = useId();

  // Real-time domain validation
  const domainValidation: DomainValidationResult = validateCorporateEmail(email);
  const isEmailDirty = email.length > 0;
  const hasAtSymbol = email.includes('@');

  // Password strength
  const strength = calculatePasswordStrength(password);

  const handleTestDomain = (testEmail: string) => {
    setEmail(testEmail);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate email
    const val = validateCorporateEmail(email);
    if (!val.isValid) {
      setErrorMessage(val.error || 'Please enter a valid corporate email address.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long.');
        return;
      }

      // Check if already registered
      const existing = registeredUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        setErrorMessage('An account with this corporate email already exists. Please sign in instead.');
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        const newUser: UserAccount = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          companyName: val.companyName || 'Corporate',
          domain: val.domain,
          createdAt: new Date().toISOString(),
        };
        setCountdown(3);
        setSuccessData({ mode: 'signup', user: newUser });
      }, 500);
    } else {
      // Sign in mode
      if (!password) {
        setErrorMessage('Please enter your password.');
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        const found = registeredUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        const userToLogin: UserAccount = found || {
          name: name || 'Enterprise Member',
          email: email.trim().toLowerCase(),
          companyName: val.companyName || 'Corporate Workspace',
          domain: val.domain,
          createdAt: new Date().toISOString(),
        };
        setCountdown(3);
        setSuccessData({ mode: 'signin', user: userToLogin });
      }, 500);
    }
  };

  if (successData) {
    return (
      <div className="w-full h-full bg-[#0B63F6] text-white flex flex-col justify-center items-center p-7 sm:p-10 lg:p-12 relative overflow-hidden text-center min-h-[580px] lg:min-h-[640px]">
        {/* Subtle decorative radial glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-700/40 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
          {/* Animated Success Badge */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-emerald-400/20 border-2 border-emerald-400/40 flex items-center justify-center animate-pulse">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            {successData.mode === 'signup' ? 'Account Created!' : 'Signed In Successfully!'}
          </h2>
          <p className="text-blue-100/90 text-sm mb-6 max-w-sm">
            {successData.mode === 'signup'
              ? `Welcome aboard, ${successData.user.name}! Your enterprise account has been created.`
              : `Welcome back, ${successData.user.name}! Authenticated with your organization domain.`}
          </p>

          {/* Verification Details Box */}
          <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4.5 mb-6 text-left space-y-2.5">
            <div className="flex items-center justify-between text-xs border-b border-white/15 pb-2">
              <span className="text-blue-200">Email:</span>
              <span className="font-semibold text-white font-mono">{successData.user.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-white/15 pb-2">
              <span className="text-blue-200">Organization:</span>
              <span className="font-semibold text-white">{successData.user.companyName}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-200">Domain Status:</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                <ShieldCheck className="w-3 h-3" />
                Verified Google Workspace (@{successData.user.domain})
              </span>
            </div>
          </div>

          {/* Action Button & Countdown */}
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={() => onSuccess(successData.user)}
              className="w-full h-12 rounded-full bg-[#FFA000] hover:bg-[#FFB300] active:scale-[0.98] font-bold text-sm text-slate-950 shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Enter Workspace Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-blue-100/80">
              <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
              <span>Redirecting to dashboard in {countdown}s...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#0B63F6] text-white flex flex-col justify-between p-7 sm:p-10 lg:p-12 relative overflow-hidden">
      {/* Subtle decorative radial glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-700/40 rounded-full blur-2xl pointer-events-none" />

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-md mx-auto my-auto">
        {/* Title Header */}
        <div className="mb-7">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-2 font-['Plus_Jakarta_Sans']">
            {mode === 'signup' ? 'Welcome!' : 'Welcome back!'}
          </h1>
          <p className="text-blue-100/90 text-sm font-normal">
            {mode === 'signup'
              ? 'Create your enterprise account with company Google Workspace.'
              : 'Sign in to access your company dashboard.'}
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-100 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
            <div className="leading-snug">{errorMessage}</div>
          </div>
        )}

        {/* Form Inputs matching the screenshot UI */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Name Input (Sign Up Mode only) */}
          {mode === 'signup' && (
            <div className="relative">
              <label htmlFor={nameInputId} className="sr-only">Your name</label>
              <div className="relative flex items-center">
                <div className="absolute left-5 text-[#8CB4F8] pointer-events-none">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id={nameInputId}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className="w-full h-13 pl-13 pr-5 rounded-full bg-white text-slate-800 placeholder-[#9DB9E8] font-normal text-sm focus:outline-none focus:ring-4 focus:ring-blue-300/40 shadow-sm transition-all"
                  required={mode === 'signup'}
                />
              </div>
            </div>
          )}

          {/* 2. Email Input */}
          <div className="space-y-1.5">
            <div className="relative">
              <label htmlFor={emailInputId} className="sr-only">Your e-mail</label>
              <div className="relative flex items-center">
                <div className="absolute left-5 text-[#8CB4F8] pointer-events-none">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id={emailInputId}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Your e-mail"
                  autoComplete="email"
                  className={`w-full h-13 pl-13 pr-5 rounded-full bg-white text-slate-800 placeholder-[#9DB9E8] font-normal text-sm focus:outline-none focus:ring-4 shadow-sm transition-all ${
                    isEmailDirty && hasAtSymbol && domainValidation.isFreeDomain
                      ? 'focus:ring-rose-400 border-2 border-rose-400'
                      : isEmailDirty && domainValidation.isValid
                      ? 'focus:ring-emerald-400 border-2 border-emerald-400'
                      : 'focus:ring-blue-300/40 border-2 border-transparent'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Real-time Domain Feedback Notification */}
            {isEmailDirty && hasAtSymbol && (
              <div className="px-2">
                {domainValidation.isFreeDomain ? (
                  <div className="p-3 bg-red-950/40 border border-red-400/40 rounded-xl text-xs text-red-100 flex items-start gap-2 shadow-inner">
                    <AlertCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-red-200">
                        {domainValidation.domain.includes('gmail')
                          ? 'Free Gmail domain detected'
                          : 'Public consumer domain detected'}
                      </p>
                      <p className="text-red-100/90 text-[11px] leading-relaxed">
                        Registration is restricted to <strong className="underline">company Google Workspace</strong> domains. Free domains (@{domainValidation.domain}) are strictly not permitted.
                      </p>
                    </div>
                  </div>
                ) : domainValidation.isValid ? (
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-400/40 rounded-xl text-xs text-emerald-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-medium">
                        Corporate domain verified: <strong className="text-white">{domainValidation.companyName}</strong>
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                        G-Suite OK
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* 3. Password Input */}
          <div className="relative">
            <label htmlFor={passwordInputId} className="sr-only">Password</label>
            <div className="relative flex items-center">
              <div className="absolute left-5 text-[#8CB4F8] pointer-events-none">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id={passwordInputId}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Create password' : 'Enter password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full h-13 pl-13 pr-12 rounded-full bg-white text-slate-800 placeholder-[#9DB9E8] font-normal text-sm focus:outline-none focus:ring-4 focus:ring-blue-300/40 shadow-sm transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator (Matches the 4-bar yellow indicator in the screenshot) */}
          {mode === 'signup' && (
            <div className="pt-1.5 pb-2">
              <div className="flex items-center justify-between text-xs text-blue-100 font-medium mb-1.5 px-1">
                <span className="tracking-wide">Password strength</span>
                <span className="text-[11px] text-blue-200/90 font-semibold">{strength.label}</span>
              </div>
              {/* 4 horizontal segments */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((segIndex) => {
                  const isActive = password.length > 0 && strength.score >= segIndex;
                  return (
                    <div
                      key={segIndex}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isActive
                          ? 'bg-[#FFCC00] shadow-[0_0_8px_rgba(255,204,0,0.6)]'
                          : 'bg-[#063C9E]'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Sign In Extras: Remember Me & Forgot Password */}
          {mode === 'signin' && (
            <div className="flex items-center justify-between text-xs text-blue-100 pt-1 pb-2 px-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5 border-white/40"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setErrorMessage('Password reset instructions will be dispatched to your corporate admin.')}
                className="text-blue-200 hover:text-white underline underline-offset-2"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Action Buttons row (Exact pair from the screenshot) */}
          <div className="pt-3 flex flex-row items-center gap-3">
            {mode === 'signup' ? (
              <>
                {/* Primary: Orange 'Create account' button */}
                <button
                  type="submit"
                  disabled={isSubmitting || (isEmailDirty && domainValidation.isFreeDomain)}
                  className={`flex-1 h-12 px-6 rounded-full font-bold text-sm text-slate-900 transition-all flex items-center justify-center gap-2 ${
                    isEmailDirty && domainValidation.isFreeDomain
                      ? 'bg-amber-500/50 cursor-not-allowed text-slate-700'
                      : 'bg-[#FFA000] hover:bg-[#FFB300] active:scale-[0.98] shadow-lg shadow-amber-900/20 text-slate-950 cursor-pointer'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Create account'
                  )}
                </button>

                {/* Secondary: White outlined 'Sign in' button */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                  }}
                  className="flex-1 h-12 px-6 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                {/* In Sign In mode: Primary is Sign in */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 px-6 rounded-full bg-[#FFA000] hover:bg-[#FFB300] active:scale-[0.98] font-bold text-sm text-slate-950 shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Sign in'
                  )}
                </button>

                {/* Switch to Create Account */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage(null);
                  }}
                  className="flex-1 h-12 px-6 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
                >
                  Create account
                </button>
              </>
            )}
          </div>
        </form>

        {/* Quick Test Chips for user convenience */}
        <div className="mt-8 pt-5 border-t border-blue-400/30">
          <div className="text-[11px] uppercase tracking-wider text-blue-200/80 font-semibold mb-2 flex items-center justify-between">
            <span>Quick Test Domain Scenarios:</span>
            <span className="text-[10px] text-blue-300">Click to fill</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleTestDomain('sarah.connor@gmail.com')}
              className="px-2.5 py-1 rounded-full text-xs bg-rose-500/20 border border-rose-300/40 text-rose-100 hover:bg-rose-500/30 transition-colors flex items-center gap-1 cursor-pointer"
              title="Test blocked consumer gmail domain"
            >
              <span className="text-rose-400 font-bold">✕</span> @gmail.com (Blocked)
            </button>
            <button
              type="button"
              onClick={() => handleTestDomain('alex.turner@yahoo.com')}
              className="px-2.5 py-1 rounded-full text-xs bg-rose-500/20 border border-rose-300/40 text-rose-100 hover:bg-rose-500/30 transition-colors flex items-center gap-1 cursor-pointer"
              title="Test blocked yahoo domain"
            >
              <span className="text-rose-400 font-bold">✕</span> @yahoo.com (Blocked)
            </button>
            <button
              type="button"
              onClick={() => handleTestDomain('jordan.lee@nexuscorp.io')}
              className="px-2.5 py-1 rounded-full text-xs bg-emerald-500/20 border border-emerald-300/40 text-emerald-100 hover:bg-emerald-500/30 transition-colors flex items-center gap-1 cursor-pointer"
              title="Test allowed company domain"
            >
              <span className="text-emerald-400 font-bold">✓</span> @nexuscorp.io (Allowed)
            </button>
            <button
              type="button"
              onClick={() => handleTestDomain('dev@stripe.com')}
              className="px-2.5 py-1 rounded-full text-xs bg-emerald-500/20 border border-emerald-300/40 text-emerald-100 hover:bg-emerald-500/30 transition-colors flex items-center gap-1 cursor-pointer"
              title="Test allowed corporate domain"
            >
              <span className="text-emerald-400 font-bold">✓</span> @stripe.com (Allowed)
            </button>
          </div>
        </div>
      </div>

      {/* Footer reassurance */}
      <div className="relative z-10 pt-4 text-center text-[11px] text-blue-200/70">
        Enterprise Workspace SSO Protection &bull; Zero Free Domain Policy Enforced
      </div>
    </div>
  );
};
