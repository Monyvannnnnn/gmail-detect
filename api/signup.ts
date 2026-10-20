export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { email, name } = req.body || {};

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

  const apiKey = process.env.ABSTRACT_API_KEY || '20c168fc6ddf490fb4b2a4f3d29e5153';
  const url = `https://emailreputation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`;

  try {
    const apiRes = await fetch(url);
    const data = await apiRes.json();

    if (data.email_deliverability?.status === 'undeliverable') {
      return res.status(400).json({
        error: 'This email address does not exist or cannot receive mail.',
      });
    }

    if (data.email_quality?.is_free_email === true) {
      return res.status(400).json({
        error: 'Free email providers are not allowed. Please use your corporate email.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Account verified successfully.',
      user: {
        email,
        name: name || 'Enterprise Member',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
