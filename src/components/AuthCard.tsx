import React, { useState, useId, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Building2, ShieldCheck, ArrowRight, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import {
  validateCorporateEmail,
  calculatePasswordStrength,
  DomainValidationResult,
  checkDomainMxLive,
  MxCheckResult,
  detectDomainTypo,
  detectLocalPartTypo,
} from '../utils/domainValidator';

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

  // Live DNS MX Checking state
  const [isCheckingMx, setIsCheckingMx] = useState(false);
  const [mxResult, setMxResult] = useState<MxCheckResult | null>(null);

  // Live Mailbox Ping State (SMTP / Direct Mailbox Verification)
  const [isCheckingMailbox, setIsCheckingMailbox] = useState(false);
  const [mailboxResult, setMailboxResult] = useState<{
    valid: boolean;
    message?: string;
    reason?: string;
    mailServer?: string;
  } | null>(null);

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

  // Real-time domain validation (synchronous format & free domain check)
  const domainValidation: DomainValidationResult = validateCorporateEmail(email);
  const isEmailDirty = email.length > 0;
  const hasAtSymbol = email.includes('@');

  // Debounced live DNS MX checking
  useEffect(() => {
    if (!email || !email.includes('@')) {
      setMxResult(null);
      setIsCheckingMx(false);
      return;
    }

    const val = validateCorporateEmail(email);
    if (!val.isValid || val.isFreeDomain) {
      setMxResult(null);
      setIsCheckingMx(false);
      return;
    }

    setIsCheckingMx(true);
    const timer = setTimeout(async () => {
      try {
        const res = await checkDomainMxLive(val.domain, email);
        setMxResult(res);
      } catch {
        setMxResult(null);
      } finally {
        setIsCheckingMx(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [email]);

  // Debounced live Mailbox Ping checking
  useEffect(() => {
    if (!email || !email.includes('@')) {
      setMailboxResult(null);
      setIsCheckingMailbox(false);
      return;
    }

    const [, domainPart] = email.split('@');
    if (!domainPart || !domainPart.includes('.') || domainValidation.isFreeDomain || domainValidation.isFakeUser) {
      setMailboxResult(null);
      setIsCheckingMailbox(false);
      return;
    }

    setIsCheckingMailbox(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-mailbox?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        if (res.ok) {
          const data = await res.json();
          setMailboxResult(data);
        } else {
          setMailboxResult(null);
        }
      } catch {
        setMailboxResult(null);
      } finally {
        setIsCheckingMailbox(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [email]);

  const localPartTypo = isEmailDirty && hasAtSymbol ? detectLocalPartTypo(email) : null;
  const isDomainInvalid = Boolean(
    isEmailDirty && hasAtSymbol && !domainValidation.isFreeDomain && mxResult && !mxResult.hasMx && mxResult.status === 'NOT_FOUND'
  );

  // Password strength
  const strength = calculatePasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Strictly block free consumer emails and explicitly blocked domains
    if (domainValidation.isBlockedDomain) {
      setErrorMessage(`Domain @${domainValidation.domain} is not allowed by organization policy.`);
      return;
    }

    if (domainValidation.isFreeDomain) {
      setErrorMessage(`Free email provider (@${domainValidation.domain}) is not allowed. Only company email is accepted.`);
      return;
    }

    // 2. Strictly block fake / random usernames
    if (domainValidation.isFakeUser) {
      setErrorMessage('Invalid: Mailbox does not exist on this server (Fake user).');
      return;
    }

    // 3. Reject if mailbox check confirmed invalid / fake user
    if (mailboxResult && !mailboxResult.valid) {
      setErrorMessage(mailboxResult.reason || mailboxResult.message || 'Invalid corporate email: Mailbox does not exist on this server.');
      return;
    }

    // 3. Validate corporate email format and domain
    const val = validateCorporateEmail(email);
    if (!val.isValid) {
      setErrorMessage(val.error || 'Please enter a valid company email address.');
      return;
    }

    if (mxResult && !mxResult.hasMx && mxResult.status === 'NOT_FOUND') {
      setErrorMessage(`Domain @${val.domain || email.split('@')[1]} does not exist or has no active mail exchange (MX) servers.`);
      return;
    }

    const domainName = val.domain || (email.includes('@') ? email.split('@')[1] : '');
    const companyDisplayName = val.companyName || (domainName ? domainName.split('.')[0].toUpperCase() : 'Workspace');

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
          companyName: companyDisplayName,
          domain: domainName,
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
          companyName: companyDisplayName,
          domain: domainName,
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
    <div className="w-full h-full bg-[#0B63F6] text-white flex flex-col justify-between p-6 sm:p-9 lg:p-12 relative overflow-hidden">
      {/* Subtle decorative radial glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-700/40 rounded-full blur-2xl pointer-events-none" />

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-md mx-auto my-auto">
        {/* Mobile-only Enterprise Badge */}
        <div className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold text-blue-100 backdrop-blur-sm mb-3.5 border border-white/20">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
          <span>Google Workspace SSO Protected</span>
        </div>

        {/* Title Header */}
        <div className="mb-5 sm:mb-7">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-2 font-['Plus_Jakarta_Sans']">
            {mode === 'signup' ? 'Welcome!' : 'Welcome back!'}
          </h1>
          <p className="text-blue-100/90 text-xs sm:text-sm font-normal">
            {mode === 'signup'
              ? 'Create your enterprise account with company Google Workspace.'
              : 'Sign in to access your company dashboard.'}
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-4 sm:mb-5 p-3 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-100 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
            <div className="leading-snug">{errorMessage}</div>
          </div>
        )}

        {/* Form Inputs matching the screenshot UI */}
        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
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
                  placeholder="Your corporate e-mail"
                  autoComplete="email"
                  className={`w-full h-13 pl-13 pr-11 rounded-full bg-white text-slate-800 placeholder-[#9DB9E8] font-normal text-sm focus:outline-none focus:ring-4 shadow-sm transition-all ${
                    isEmailDirty && hasAtSymbol && (domainValidation.isFreeDomain || domainValidation.isFakeUser)
                      ? 'focus:ring-rose-400 border-2 border-rose-400'
                      : !domainValidation.isFreeDomain && !domainValidation.isFakeUser && mailboxResult?.valid
                      ? 'focus:ring-emerald-400 border-2 border-emerald-400'
                      : !domainValidation.isFreeDomain && ((mailboxResult && !mailboxResult.valid) || isDomainInvalid)
                      ? 'focus:ring-rose-400 border-2 border-rose-400'
                      : isEmailDirty && domainValidation.isValid
                      ? 'focus:ring-blue-400 border-2 border-blue-400'
                      : 'focus:ring-blue-300/40 border-2 border-transparent'
                  }`}
                  required
                />
                <div className="absolute right-4 flex items-center pointer-events-none">
                  {isCheckingMailbox || isCheckingMx ? (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  ) : isEmailDirty && hasAtSymbol && (domainValidation.isFreeDomain || domainValidation.isFakeUser) ? (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  ) : !domainValidation.isFreeDomain && !domainValidation.isFakeUser && mailboxResult?.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : !domainValidation.isFreeDomain && ((mailboxResult && !mailboxResult.valid) || isDomainInvalid) ? (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  ) : null}
                </div>
              </div>
            </div>

            {/* Real-time Domain, MX & Mailbox Feedback Notification */}
            {isEmailDirty && hasAtSymbol && (
              <div className="px-2 space-y-2">
                {/* 1. Free Gmail / Consumer Domain -> NOT ALLOWED */}
                {domainValidation.isFreeDomain ? (
                  <div className="p-2.5 bg-red-950/80 border border-red-400/70 rounded-xl text-xs text-red-100 flex items-center justify-between shadow-md backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="font-semibold text-red-200 text-xs">
                        {domainValidation.isBlockedDomain
                          ? `@${domainValidation.domain} is not allowed!`
                          : domainValidation.domain.toLowerCase().includes('gmail')
                          ? 'Free @gmail.com is not allowed!'
                          : `Free @${domainValidation.domain} is not allowed!`}
                      </p>
                    </div>
                    <span className="text-[10px] bg-red-500/30 text-red-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-red-400/40">
                      Not Allowed
                    </span>
                  </div>
                ) : domainValidation.isFakeUser ? (
                  /* 2. Detected Fake User immediately */
                  <div className="p-2.5 bg-red-950/80 border border-red-400/70 rounded-xl text-xs text-red-100 flex items-center justify-between shadow-md backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="font-semibold text-red-200 text-xs">
                        Invalid: Mailbox does not exist on this server (Fake user).
                      </p>
                    </div>
                    <span className="text-[10px] bg-red-500/30 text-red-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-red-400/40">
                      Invalid
                    </span>
                  </div>
                ) : isCheckingMailbox ? (
                  /* 2. Company Email Pinging in progress */
                  <div className="p-2.5 bg-slate-900/90 border border-blue-400/50 rounded-xl text-xs text-blue-100 flex items-center gap-2 shadow-md">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                    <span className="text-blue-100 font-medium text-xs">
                      Verifying mailbox existence...
                    </span>
                  </div>
                ) : mailboxResult ? (
                  mailboxResult.valid ? (
                    /* 3. Company Email -> VALID */
                    <div className="p-2.5 bg-emerald-950/80 border border-emerald-400/70 rounded-xl text-xs text-emerald-100 flex items-center justify-between shadow-md backdrop-blur-sm animate-in fade-in duration-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <p className="font-semibold text-emerald-100 text-xs">
                          Valid: Mailbox exists and is active!
                        </p>
                      </div>
                      <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-emerald-400/40">
                        Valid
                      </span>
                    </div>
                  ) : (
                    /* 4. Company Email -> INVALID */
                    <div className="p-2.5 bg-red-950/80 border border-red-400/70 rounded-xl text-xs text-red-100 flex items-center justify-between shadow-md backdrop-blur-sm animate-in fade-in duration-200">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <p className="font-semibold text-red-200 text-xs">
                          Invalid: Mailbox does not exist on this server (Fake user).
                        </p>
                      </div>
                      <span className="text-[10px] bg-red-500/30 text-red-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-red-400/40">
                        Invalid
                      </span>
                    </div>
                  )
                ) : null}

                {/* Local-part typo suggestion (e.g. saless -> sales) */}
                {localPartTypo && !domainValidation.isFreeDomain && (
                  <div className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-200 text-[11px] flex items-center justify-between">
                    <span>
                      Typo hint: Did you mean <strong>{localPartTypo}@{domainValidation.domain}</strong>?
                    </span>
                    <button
                      type="button"
                      onClick={() => setEmail(`${localPartTypo}@${domainValidation.domain}`)}
                      className="text-[10px] underline hover:text-white cursor-pointer font-semibold ml-2"
                    >
                      Auto-fix
                    </button>
                  </div>
                )}
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
                  disabled={
                    isSubmitting ||
                    isCheckingMx ||
                    (isEmailDirty && (domainValidation.isFreeDomain || isDomainInvalid))
                  }
                  className={`flex-1 h-12 px-6 rounded-full font-bold text-sm text-slate-900 transition-all flex items-center justify-center gap-2 ${
                    isEmailDirty && (domainValidation.isFreeDomain || isDomainInvalid)
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
                  disabled={
                    isSubmitting ||
                    isCheckingMx ||
                    (isEmailDirty && (domainValidation.isFreeDomain || isDomainInvalid))
                  }
                  className={`flex-1 h-12 px-6 rounded-full font-bold text-sm text-slate-950 shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2 ${
                    isEmailDirty && (domainValidation.isFreeDomain || isDomainInvalid)
                      ? 'bg-amber-500/50 cursor-not-allowed text-slate-700'
                      : 'bg-[#FFA000] hover:bg-[#FFB300] active:scale-[0.98] cursor-pointer'
                  }`}
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

      </div>
    </div>
  );
};
