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

// Explicitly blocked domains by organizational policy
export const BLOCKED_DOMAINS = new Set([
  'tsdsolution.com',
  'newwavetech.ai',
  'bikay.asia',
  'bizsolution.com.kh',
  'mangobyte.com.kh',
  'dotfusion.com',
  'closo.asia',
  'blue.com.kh',
  'kdigitalsolutions.com',
  'odoo.com',
  'cuscen.com',
]);

export function isBlockedDomain(domain: string): boolean {
  if (!domain) return false;
  const d = domain.toLowerCase().trim();
  if (BLOCKED_DOMAINS.has(d)) return true;
  for (const blocked of BLOCKED_DOMAINS) {
    if (d.endsWith('.' + blocked)) return true;
  }
  return false;
}

export interface DomainValidationResult {
  isValid: boolean;
  isFreeDomain: boolean;
  isBlockedDomain?: boolean;
  domain: string;
  companyName?: string;
  error?: string;
  suggestedAction?: string;
  isFakeUser?: boolean;
}

/**
 * Detects fake / test / random email user patterns
 */
export function isLikelyFakeUsername(localPart: string): boolean {
  if (!localPart) return false;
  const lp = localPart.toLowerCase().trim();

  // 1. Explicit fake/test/random prefix or keywords
  if (/^(random|fake|test|temp|dummy|sample|testing|mock|trash|nobody|asdf|qwerty|xyz|nonexistent|user\d|test\d)/.test(lp)) {
    return true;
  }

  // 2. Contains explicit fake/random terms
  if (/random|fakeuser|fakemail|testmail|noreal|notreal|invalid|unknown|placeholder/.test(lp)) {
    return true;
  }

  // 3. Trailing random numbers (3 or more digits at end, e.g. randomtest99812, user12345, test998)
  if (/\d{3,}$/.test(lp)) {
    return true;
  }

  // 4. Pure digits or excessive numbers
  if (/^\d+$/.test(lp) || (lp.replace(/\D/g, '').length > 4 && lp.length < 10)) {
    return true;
  }

  // 5. Repeated characters (e.g. aaaaa, zzzzz)
  if (/(.)\1{4,}/.test(lp)) {
    return true;
  }

  return false;
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
 * and not a free consumer email domain or fake user.
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

  const [localPart, domain] = trimmed.split('@');

  // Check if username is a fake / test / random user
  if (isLikelyFakeUsername(localPart)) {
    return {
      isValid: false,
      isFreeDomain: false,
      isFakeUser: true,
      domain,
      error: 'Invalid: Mailbox does not exist on this server (Fake user).',
    };
  }

  // Check if domain is in the list of explicitly blocked domains
  if (isBlockedDomain(domain)) {
    return {
      isValid: false,
      isFreeDomain: true,
      isBlockedDomain: true,
      domain,
      error: `@${domain} is not allowed!`,
      suggestedAction: 'Please use an authorized corporate email domain.',
    };
  }

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

export interface MxCheckResult {
  hasMx: boolean;
  mxRecords: string[];
  isGoogleWorkspace: boolean;
  isMicrosoft365: boolean;
  provider: 'google' | 'microsoft' | 'custom' | 'none';
  status: 'OK' | 'NOT_FOUND' | 'ERROR';
  suggestedDomain?: string;
  note?: string;
}

/**
 * Common domain typo detector
 */
export function detectDomainTypo(domain: string): string | null {
  const d = domain.toLowerCase().trim();
  if (d.endsWith('.cm') && !d.endsWith('.com.cm')) {
    return d.replace(/\.cm$/, '.com');
  }
  if (d.endsWith('.cmo')) {
    return d.replace(/\.cmo$/, '.com');
  }
  if (d === 'gmal.com' || d === 'gmaill.com' || d === 'gmial.com') {
    return 'gmail.com';
  }
  if (d === 'yaho.com' || d === 'yahooo.com') {
    return 'yahoo.com';
  }
  if (d === 'hotmial.com' || d === 'hotmai.com') {
    return 'hotmail.com';
  }
  if (d === 'outlok.com' || d === 'outloo.com') {
    return 'outlook.com';
  }
  return null;
}

/**
 * Common local part typo detector (e.g. saless -> sales)
 */
export function detectLocalPartTypo(email: string): string | null {
  const [localPart] = email.split('@');
  if (!localPart) return null;
  const l = localPart.toLowerCase();
  if (l === 'saless') return 'sales';
  if (l === 'supportt') return 'support';
  if (l === 'adminn') return 'admin';
  if (l === 'infoo') return 'info';
  if (l === 'contactt') return 'contact';
  return null;
}

export interface AbstractValidationResult {
  deliverable: boolean;
  statusDetail: string;
  isFormatValid: boolean;
  isSmtpValid: boolean;
  isMxValid: boolean;
  isFreeEmail: boolean;
  organizationName?: string;
  mxRecords?: string[];
  qualityScore?: number;
}

/**
 * Validates email deliverability via AbstractAPI Email Reputation endpoint
 */
export async function validateEmailWithAbstractApi(email: string): Promise<AbstractValidationResult | null> {
  try {
    const res = await fetch(`/api/validate-email?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;

    const del = data.email_deliverability;
    const qual = data.email_quality;
    const sender = data.email_sender;

    return {
      deliverable: del?.status === 'deliverable',
      statusDetail: del?.status_detail || '',
      isFormatValid: del?.is_format_valid ?? true,
      isSmtpValid: del?.is_smtp_valid ?? true,
      isMxValid: del?.is_mx_valid ?? true,
      isFreeEmail: qual?.is_free_email ?? false,
      organizationName: sender?.organization_name,
      mxRecords: del?.mx_records,
      qualityScore: qual?.score,
    };
  } catch {
    return null;
  }
}

export interface SmtpPingResult {
  valid: boolean;
  message?: string;
  reason?: string;
  mailServer?: string;
}

/**
 * Pings the target mail server on port 25 to check if mailbox exists
 */
export async function pingMailboxSmtp(email: string): Promise<SmtpPingResult | null> {
  try {
    const res = await fetch(`/api/check-mailbox?email=${encodeURIComponent(email)}`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Performs real-time DNS MX lookup to check if domain exists and whether it uses Google Workspace
 */
export async function checkDomainMxLive(domain: string, email?: string): Promise<MxCheckResult> {
  const cleanDomain = domain.toLowerCase().trim();
  if (!cleanDomain) {
    return {
      hasMx: false,
      mxRecords: [],
      isGoogleWorkspace: false,
      isMicrosoft365: false,
      provider: 'none',
      status: 'NOT_FOUND',
    };
  }

  // Optional: Check AbstractAPI if email is provided
  if (email && email.includes('@')) {
    try {
      const abstractData = await validateEmailWithAbstractApi(email);
      if (abstractData && abstractData.mxRecords && abstractData.mxRecords.length > 0) {
        const mxList = abstractData.mxRecords.map((m) => m.toLowerCase());
        const isGoogle = mxList.some((mx) =>
          mx.includes('google.com') || mx.includes('googlemail.com') || mx.includes('aspmx')
        );
        const isMs = mxList.some((mx) =>
          mx.includes('outlook.com') || mx.includes('microsoft')
        );

        return {
          hasMx: true,
          mxRecords: mxList,
          isGoogleWorkspace: isGoogle,
          isMicrosoft365: isMs,
          provider: isGoogle ? 'google' : isMs ? 'microsoft' : 'custom',
          status: 'OK',
          note: isGoogle
            ? 'Google Workspace MX confirmed (AbstractAPI)'
            : isMs
            ? 'Microsoft 365 MX confirmed (AbstractAPI)'
            : `Mail server: ${mxList[0]} (AbstractAPI Deliverable)`,
        };
      } else if (abstractData && !abstractData.deliverable && abstractData.statusDetail === 'dns_record_not_found') {
        const typo = detectDomainTypo(cleanDomain);
        return {
          hasMx: false,
          mxRecords: [],
          isGoogleWorkspace: false,
          isMicrosoft365: false,
          provider: 'none',
          status: 'NOT_FOUND',
          suggestedDomain: typo || undefined,
        };
      }
    } catch {
      // fallback to internal DNS check
    }
  }

  // 1. Try local Vite dev server API first
  try {
    const res = await fetch(`/api/verify-domain?domain=${encodeURIComponent(cleanDomain)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'OK' && data.hasMx) {
        const mxList: string[] = data.mxRecords || [];
        const isGoogle = Boolean(data.isGoogleWorkspace);
        const isMs = Boolean(data.isMicrosoft365);
        return {
          hasMx: true,
          mxRecords: mxList,
          isGoogleWorkspace: isGoogle,
          isMicrosoft365: isMs,
          provider: isGoogle ? 'google' : isMs ? 'microsoft' : 'custom',
          status: 'OK',
          note: isGoogle
            ? 'Google Workspace MX confirmed'
            : isMs
            ? 'Microsoft 365 MX confirmed'
            : `Custom mail server: ${mxList[0] || 'active'}`,
        };
      } else if (data.status === 'NOT_FOUND') {
        const typo = detectDomainTypo(cleanDomain);
        return {
          hasMx: false,
          mxRecords: [],
          isGoogleWorkspace: false,
          isMicrosoft365: false,
          provider: 'none',
          status: 'NOT_FOUND',
          suggestedDomain: typo || undefined,
        };
      }
    }
  } catch {
    // Fallback to Cloudflare DoH
  }

  // 2. Fallback to Cloudflare DNS-over-HTTPS (CORS enabled public DNS)
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(cleanDomain)}&type=MX`, {
      headers: { accept: 'application/dns-json' },
    });
    const data = await res.json();
    if (data.Status !== 0 || !data.Answer || data.Answer.length === 0) {
      const typo = detectDomainTypo(cleanDomain);
      return {
        hasMx: false,
        mxRecords: [],
        isGoogleWorkspace: false,
        isMicrosoft365: false,
        provider: 'none',
        status: 'NOT_FOUND',
        suggestedDomain: typo || undefined,
      };
    }

    const mxList: string[] = data.Answer.map((a: any) =>
      String(a.data).split(' ').pop()?.replace(/\.$/, '').toLowerCase() || ''
    ).filter(Boolean);

    const isGoogle = mxList.some((mx) =>
      mx.includes('google.com') || mx.includes('googlemail.com') || mx.includes('aspmx')
    );
    const isMs = mxList.some((mx) =>
      mx.includes('outlook.com') || mx.includes('microsoft')
    );

    return {
      hasMx: true,
      mxRecords: mxList,
      isGoogleWorkspace: isGoogle,
      isMicrosoft365: isMs,
      provider: isGoogle ? 'google' : isMs ? 'microsoft' : 'custom',
      status: 'OK',
      note: isGoogle
        ? 'Google Workspace MX confirmed'
        : isMs
        ? 'Microsoft 365 MX confirmed'
        : `Custom mail server: ${mxList[0] || 'active'}`,
    };
  } catch {
    return {
      hasMx: true,
      mxRecords: [],
      isGoogleWorkspace: false,
      isMicrosoft365: false,
      provider: 'custom',
      status: 'OK',
    };
  }
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
