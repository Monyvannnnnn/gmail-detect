/**
 * Corporate Email & Domain Validation Utilities
 * Specifically designed to enforce company Google Workspace / corporate domains
 * and strictly block free consumer email domains (e.g. @gmail.com, @yahoo.com, etc.)
 */

// List of popular free/consumer public email provider domains
export const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'ymail.com',
  'rocketmail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'aim.com',
  'mail.com',
  'email.com',
  'zoho.com',
  'zohomail.com',
  'proton.me',
  'protonmail.com',
  'protonmail.ch',
  'gmx.com',
  'gmx.net',
  'gmx.de',
  'yandex.com',
  'yandex.ru',
  'fastmail.com',
  'tutanota.com',
  'tutamail.com',
  'tuta.io',
  'inbox.com',
  'lycos.com',
  'rediffmail.com',
  'web.de',
]);

export interface DomainValidationResult {
  isValid: boolean;
  isFreeDomain: boolean;
  domain: string;
  companyName?: string;
  error?: string;
  suggestedAction?: string;
}

/**
 * Extracts and cleans the domain from an email address
 */
export function extractDomain(email: string): string {
  if (!email || !email.includes('@')) return '';
  const parts = email.trim().toLowerCase().split('@');
  return parts.length > 1 ? parts[1].trim() : '';
}

/**
 * Formats a raw domain like 'stripe.com' or 'acme-corp.io' into a human-friendly Company Name
 */
export function formatCompanyNameFromDomain(domain: string): string {
  if (!domain) return '';
  const mainPart = domain.split('.')[0] || domain;
  return mainPart
    .split(/[-_.]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Validates whether an email belongs to a corporate/company domain
 * and not a free consumer email domain.
 */
export function validateCorporateEmail(email: string): DomainValidationResult {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return {
      isValid: false,
      isFreeDomain: false,
      domain: '',
      error: 'Please enter your corporate email address.',
    };
  }

  // Basic RFC email format test
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      isFreeDomain: false,
      domain: extractDomain(trimmed),
      error: 'Please enter a valid email address format (e.g. name@company.com).',
    };
  }

  const domain = extractDomain(trimmed);

  // Check if domain is in the list of free consumer providers
  if (FREE_EMAIL_DOMAINS.has(domain)) {
    const isGmail = domain === 'gmail.com' || domain === 'googlemail.com';
    return {
      isValid: false,
      isFreeDomain: true,
      domain,
      error: isGmail
        ? 'Free consumer @gmail.com is not allowed. Only corporate Google Workspace / company domains are accepted.'
        : `Free public email provider (@${domain}) is not allowed. Please use your official company domain.`,
      suggestedAction: isGmail
        ? 'Use your organization’s Google Workspace email (e.g. yourname@yourcompany.com).'
        : 'Enter your business or organization email address.',
    };
  }

  // Valid company domain
  const companyName = formatCompanyNameFromDomain(domain);
  return {
    isValid: true,
    isFreeDomain: false,
    domain,
    companyName,
  };
}

/**
 * Calculates password strength (0 to 4 score)
 */
export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: 'Too weak' | 'Weak' | 'Medium' | 'Strong' | 'Enterprise';
  feedback: string;
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { score: 0, label: 'Too weak', feedback: 'Enter at least 8 characters' };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 0.5;
  if (/[^A-Za-z0-9]/.test(password)) score += 0.5;

  const roundedScore = Math.min(4, Math.floor(score));

  switch (roundedScore) {
    case 1:
      return { score: 1, label: 'Weak', feedback: 'Add capital letters & numbers' };
    case 2:
      return { score: 2, label: 'Medium', feedback: 'Good, add special characters for security' };
    case 3:
      return { score: 3, label: 'Strong', feedback: 'Strong password' };
    case 4:
      return { score: 4, label: 'Enterprise', feedback: 'Meets enterprise security guidelines' };
    case 0:
    default:
      return { score: 0, label: 'Too weak', feedback: 'Must be at least 8 characters' };
  }
}
