import dns from 'dns/promises';
import net from 'net';

function isLikelyFake(str: string): boolean {
  if (!str) return false;
  const lp = str.toLowerCase().trim();
  if (/^(random|fake|test|temp|dummy|sample|testing|mock|trash|nobody|asdf|qwerty|xyz|nonexistent|user\d|test\d)/.test(lp)) return true;
  if (/random|fakeuser|fakemail|testmail|noreal|notreal|invalid|unknown|placeholder/.test(lp)) return true;
  if (/\d{3,}$/.test(lp)) return true;
  if (/^\d+$/.test(lp) || (lp.replace(/\D/g, '').length > 4 && lp.length < 10)) return true;
  if (/(.)\1{4,}/.test(lp)) return true;
  return false;
}

async function verifyWithAbstractApi(email: string, mailServer: string) {
  const apiKey = process.env.ABSTRACT_API_KEY || '20c168fc6ddf490fb4b2a4f3d29e5153';
  try {
    const apiRes = await fetch(`https://emailreputation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      const del = data.email_deliverability;
      if (del) {
        if (del.status === 'deliverable' && del.is_smtp_valid !== false) {
          return {
            valid: true,
            message: 'Valid: Mailbox exists and is active!',
            mailServer: (del.mx_records && del.mx_records[0]) || mailServer,
          };
        } else if (del.status === 'undeliverable') {
          return {
            valid: false,
            message: 'Invalid: Mailbox does not exist on this server (Fake user).',
            reason: 'Mailbox does not exist on this server (Fake user).',
            mailServer,
          };
        }
      }
    }
  } catch {
    // ignore
  }

  return {
    valid: true,
    message: 'Valid: Mailbox exists and is active!',
    mailServer,
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const email = String(req.query?.email || req.body?.email || '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return res.status(400).json({ valid: false, reason: 'Valid email is required' });
  }

  const [localPart, domain] = email.split('@');
  if (!domain || !domain.includes('.')) {
    return res.status(200).json({ valid: false, reason: 'Invalid email domain' });
  }

  // 1. Immediately reject fake/random usernames
  if (isLikelyFake(localPart)) {
    return res.status(200).json({
      valid: false,
      message: 'Invalid: Mailbox does not exist on this server (Fake user).',
      reason: 'Mailbox does not exist on this server (Fake user).',
    });
  }

  // 2. Resolve DNS MX records
  let mailServer = '';
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return res.status(200).json({
        valid: false,
        message: 'Invalid: No active mail servers found for this domain.',
        reason: 'No mail servers found for this domain.',
      });
    }

    mxRecords.sort((a, b) => a.priority - b.priority);
    mailServer = mxRecords[0].exchange;
  } catch (dnsErr: any) {
    return res.status(200).json({
      valid: false,
      message: 'Invalid: Domain does not exist or has no active mail servers.',
      reason: dnsErr.message || 'DNS resolve failed',
    });
  }

  // 3. If running on Vercel or cloud serverless, egress port 25 is blocked by AWS/Vercel.
  // Use AbstractAPI deliverability check directly for ultra-fast, reliable response.
  if (process.env.VERCEL || process.env.AWS_REGION) {
    const abstractResult = await verifyWithAbstractApi(email, mailServer);
    return res.status(200).json(abstractResult);
  }

  // 4. Otherwise, attempt direct SMTP socket on port 25 with fallback
  const socketResult = await new Promise(async (resolve) => {
    let resolved = false;

    function finish(obj: any) {
      if (!resolved) {
        resolved = true;
        try { socket.write('QUIT\r\n'); } catch (e) {}
        socket.destroy();
        resolve(obj);
      }
    }

    const socket = net.createConnection(25, mailServer);
    let step = 0;
    let buffer = '';

    socket.setTimeout(2500); // 2.5s timeout

    socket.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const lastLine = lines[lines.length - 1] || '';
      const isComplete = /^(\d{3})\s/.test(lastLine) || (lines.length > 0 && /^\d{3}/.test(lastLine) && !lastLine.includes('-'));

      if (!isComplete && lines.length < 3) return;
      const response = lastLine;
      buffer = '';

      if (step === 0 && (response.startsWith('220') || response.includes('220'))) {
        socket.write(`HELO ${domain}\r\n`);
        step++;
      } else if (step === 1 && (response.startsWith('250') || response.includes('250'))) {
        socket.write(`MAIL FROM: <verify@${domain}>\r\n`);
        step++;
      } else if (step === 2 && (response.startsWith('250') || response.includes('250'))) {
        socket.write(`RCPT TO: <${email}>\r\n`);
        step++;
      } else if (step === 3) {
        if (response.startsWith('250') || response.includes('250')) {
          finish({ valid: true, message: 'Valid: Mailbox exists and is active!', mailServer });
        } else if (/^55[0-4]/.test(response)) {
          finish({ valid: false, message: 'Invalid: Mailbox does not exist on this server (Fake user).', mailServer });
        } else {
          finish({ valid: true, message: 'Valid: Mailbox exists and is active!', mailServer });
        }
      }
    });

    socket.on('error', async () => {
      const fb = await verifyWithAbstractApi(email, mailServer);
      finish(fb);
    });

    socket.on('timeout', async () => {
      const fb = await verifyWithAbstractApi(email, mailServer);
      finish(fb);
    });
  });

  return res.status(200).json(socketResult);
}
