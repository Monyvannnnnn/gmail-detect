import React, { useState, useEffect } from 'react';
import { Building2, ShieldCheck, Users, Key, LogOut, CheckCircle, CheckCircle2, ExternalLink, Mail, Copy, Check, X } from 'lucide-react';
import { UserAccount } from './AuthCard';

interface EnterpriseDashboardProps {
  user: UserAccount;
  onLogout: () => void;
}

export const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({ user, onLogout }) => {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(user.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dummyTeamMembers = [
    { name: user.name, email: user.email, role: 'Workspace Administrator (You)', status: 'Active' },
    { name: 'Marcus Vance', email: `m.vance@${user.domain}`, role: 'Security Architect', status: 'Active' },
    { name: 'Elena Rostova', email: `elena@${user.domain}`, role: 'Lead DevOps', status: 'Active' },
    { name: 'David Kim', email: `dkim@${user.domain}`, role: 'Engineering Manager', status: 'Active' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-['Plus_Jakarta_Sans'] relative">
      {/* Success Notification Toast */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 text-white px-4.5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-md transition-all">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              Authentication Successful
            </p>
            <p className="text-[11px] text-slate-300">
              Welcome, <span className="text-white font-medium">{user.name}</span>! Session established.
            </p>
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors ml-2 cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Corporate Nav */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B63F6] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {user.companyName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base leading-tight">{user.companyName}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Verified Google Workspace
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">@{user.domain}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium">{user.email}</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8 space-y-6">
        {/* Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-[#0B63F6] to-blue-700 text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium backdrop-blur-sm mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
              Corporate Identity Authorized
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome to {user.companyName} Workspace
            </h1>
            <p className="mt-2 text-blue-100 text-sm leading-relaxed">
              Your account has been successfully verified via your organization’s enterprise domain (<span className="font-semibold text-white">@{user.domain}</span>). Public webmail domains (@gmail.com, etc.) are blocked by organizational security policy.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleCopyEmail}
                className="px-4 py-2 rounded-full bg-white text-blue-900 font-bold text-xs hover:bg-blue-50 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Work Email'}
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white font-medium text-xs hover:bg-white/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                Switch Account / Test Sign Up
              </button>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Domain Verification</h3>
                <p className="text-xs text-slate-500">Google Workspace DNS</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Domain:</span>
                <span className="font-mono font-medium text-slate-800">@{user.domain}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Public @gmail:</span>
                <span className="font-semibold text-rose-600">Restricted (403)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">MX Provider:</span>
                <span className="font-semibold text-emerald-600">Google Workspace (Enterprise)</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Security Invariants</h3>
                <p className="text-xs text-slate-500">Zero-Trust Directory</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Authentication:</span>
                <span className="font-medium text-slate-800">SAML 2.0 / OAuth</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Password Policy:</span>
                <span className="font-medium text-slate-800">Min 8 chars, 4-tier check</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Session ID:</span>
                <span className="font-mono text-slate-600">auth_corp_{Date.now().toString(36)}</span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Directory Provisioning</h3>
                <p className="text-xs text-slate-500">Company Seat Allocation</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Role:</span>
                <span className="font-medium text-slate-800">Authorized Employee</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Joined:</span>
                <span className="text-slate-800">Today</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">License:</span>
                <span className="font-semibold text-blue-600">Enterprise Standard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Directory Members in this domain */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Workspace Colleagues</h2>
              <p className="text-xs text-slate-500">Members authorized with company domain @{user.domain}</p>
            </div>
            <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-full font-mono text-slate-700">
              {dummyTeamMembers.length} Accounts
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {dummyTeamMembers.map((member, idx) => (
              <div key={idx} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0B63F6] font-semibold text-xs flex items-center justify-center">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{member.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{member.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 hidden sm:inline">{member.role}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {member.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
