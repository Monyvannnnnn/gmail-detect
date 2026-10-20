import React, { useState, useEffect } from 'react';
import { IllustrationLeft } from './components/IllustrationLeft';
import { AuthCard, UserAccount } from './components/AuthCard';
import { EnterpriseDashboard } from './components/EnterpriseDashboard';


const STORAGE_USERS_KEY = 'corp_auth_registered_users';
const STORAGE_CURRENT_USER_KEY = 'corp_auth_current_user';

const INITIAL_DEMO_USERS: UserAccount[] = [
  {
    name: 'Jordan Lee',
    email: 'jordan.lee@nexuscorp.io',
    companyName: 'Nexus Corp',
    domain: 'nexuscorp.io',
    createdAt: '2026-03-01T10:00:00.000Z',
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_DEMO_USERS;
    } catch {
      return INITIAL_DEMO_USERS;
    }
  });


  // Load current user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAuthSuccess = (user: UserAccount) => {
    // Add user to registered users if not exists
    const exists = registeredUsers.some((u) => u.email.toLowerCase() === user.email.toLowerCase());
    let updated = registeredUsers;
    if (!exists) {
      updated = [user, ...registeredUsers];
      setRegisteredUsers(updated);
      try {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    } catch {
      // ignore
    }
  };

  if (currentUser) {
    return <EnterpriseDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-[#F0F5FF] text-slate-800 flex items-center justify-center p-3 sm:p-6 md:p-8 lg:p-10 font-['Plus_Jakarta_Sans'] antialiased">
      {/* Main Center Split Container */}
      <main className="w-full max-w-md lg:max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-900/10 border border-blue-100/60 overflow-hidden grid grid-cols-1 lg:grid-cols-2 min-h-0 lg:min-h-[640px]">
        {/* Left Column: Security Vector Illustration (Desktop / Large Tablet only) */}
        <div className="hidden lg:flex bg-[#FFFFFF] flex-col justify-center items-center border-r border-slate-100">
          <IllustrationLeft />
        </div>

        {/* Right Column: Royal Blue Auth Form */}
        <div className="flex flex-col w-full">
          <AuthCard
            onSuccess={handleAuthSuccess}
            registeredUsers={registeredUsers}
          />
        </div>
      </main>
    </div>
  );
}
