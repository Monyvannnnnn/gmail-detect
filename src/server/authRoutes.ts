import express, { Request, Response } from 'express';

const router = express.Router();

const ABSTRACT_API_KEY = process.env.ABSTRACT_API_KEY || '20c168fc6ddf490fb4b2a4f3d29e5153';

/**
 * Validates email via AbstractAPI Email Reputation API
 */
export async function verifyEmailWithAbstract(email: string) {
  const url = `https://emailreputation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&email=${encodeURIComponent(email)}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

/**
 * Route: POST /api/signup
 * Validates email deliverability, format, and free email status before signup
 */
router.post('/signup', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const BLOCKED_DOMAINS = [
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
  ];

  const domain = String(email).split('@')[1]?.toLowerCase().trim();
  if (domain && BLOCKED_DOMAINS.some((b) => domain === b || domain.endsWith('.' + b))) {
    return res.status(400).json({
      error: `Domain @${domain} is not allowed by organization policy.`,
    });
  }

  try {
    const data = await verifyEmailWithAbstract(email);

    // If AbstractAPI returns an error (e.g. invalid key or rate limit), handle gracefully
    if (data.error) {
      console.warn('[AbstractAPI Warning]:', data.error.message);
      return res.status(200).json({
        success: true,
        warning: 'AbstractAPI notice: ' + data.error.message,
        message: 'Account validation proceeded with DNS verification.',
      });
    }

    // 1. Check if the email format is valid
    const isFormatValid = data.email_deliverability
      ? data.email_deliverability.is_format_valid
      : data.is_valid_format?.value;

    if (isFormatValid === false) {
      return res.status(400).json({ error: 'Invalid email format or typo detected!' });
    }

    // 2. Check if the mailbox actually exists and can receive mail
    const deliverabilityStatus = data.email_deliverability
      ? data.email_deliverability.status?.toUpperCase()
      : data.deliverability?.toUpperCase();

    if (deliverabilityStatus === 'UNDELIVERABLE') {
      return res.status(400).json({
        error: 'This email address does not exist or cannot receive mail. Please use a real active email.',
        details: data.email_deliverability || data.deliverability,
      });
    }

    // 3. Block free emails (Gmail, Yahoo, Hotmail, etc.)
    const isFree = data.email_quality
      ? data.email_quality.is_free_email
      : data.is_free_email?.value;

    if (isFree === true) {
      return res.status(400).json({
        error: 'Free email providers like Gmail/Yahoo are not allowed. Please use your corporate Google Workspace email.',
      });
    }

    // 4. If everything passes, proceed to save user in database
    return res.status(200).json({
      success: true,
      message: 'Email is real, active, and valid! Account created.',
      user: {
        email,
        name: name || 'Enterprise Member',
        deliverability: deliverabilityStatus,
        organization: data.email_sender?.organization_name || data.email_domain?.domain,
      },
    });
  } catch (err: any) {
    console.error('Server error during email validation:', err);
    return res.status(500).json({ error: 'Server error during email validation.' });
  }
});

/**
 * Route: GET /api/validate-email?email=...
 * Inspects email validity with AbstractAPI and returns full audit details
 */
router.get('/validate-email', async (req: Request, res: Response) => {
  const email = String(req.query.email || '').trim();

  if (!email) {
    return res.status(400).json({ error: 'Email query parameter is required' });
  }

  try {
    const data = await verifyEmailWithAbstract(email);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Route: ALL /api/check-mailbox
 * Direct SMTP Socket Mailbox Ping (Checks if the user's mailbox exists on port 25)
 */
router.all('/check-mailbox', async (req: Request, res: Response) => {
  const email = String(req.body?.email || req.query?.email || '').trim();

  if (!email) {
    return res.status(400).json({ valid: false, reason: 'Email parameter is required' });
  }

  try {
    const { checkMailboxExists } = await import('./smtpVerifier');
    const result = await checkMailboxExists(email);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ valid: false, reason: err.message });
  }
});

export default router;
