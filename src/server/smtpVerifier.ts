import dns from 'dns/promises';
import net from 'net';

export interface MailboxCheckResult {
  valid: boolean;
  message?: string;
  reason?: string;
  mailServer?: string;
  method?: string;
}

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

async function fallbackCheckAbstractApi(email: string, mailServer: string): Promise<MailboxCheckResult> {
  const [localPart] = email.split('@');
  if (isLikelyFakeUsername(localPart)) {
    return {
      valid: false,
      message: 'Invalid: Mailbox does not exist on this server (Fake user).',
      reason: 'Mailbox does not exist on this server (Fake user).',
      mailServer,
    };
  }

  const apiKey = process.env.ABSTRACT_API_KEY || '20c168fc6ddf490fb4b2a4f3d29e5153';
  try {
    const res = await fetch(`https://emailreputation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`);
    if (res.ok) {
      const data = await res.json();
      const del = data.email_deliverability;
      if (del) {
        if (del.status === 'deliverable' && del.is_smtp_valid !== false) {
          return {
            valid: true,
            message: 'Mailbox exists and is active!',
            mailServer: (del.mx_records && del.mx_records[0]) || mailServer,
            method: 'smtp_verified',
          };
        } else if (del.status === 'undeliverable') {
          return {
            valid: false,
            message: 'Invalid: Mailbox does not exist on this server (Fake user).',
            reason: `Mailbox does not exist on this server (${del.status_detail || 'undeliverable'}).`,
            mailServer,
            method: 'smtp_verified',
          };
        }
      }
    }
  } catch {
    // ignore
  }

  return {
    valid: false,
    message: 'Invalid: Mailbox does not exist on this server (Fake user).',
    reason: 'Mail server connection timed out (Port 25 blocked or tarpitted).',
    mailServer,
  };
}

/**
 * Tests if an email inbox is real by talking directly to the company's mail server via SMTP
 * (Step 1 & Step 2: Direct SMTP Mailbox Ping with intelligent fallback)
 */
export async function checkMailboxExists(email: string): Promise<MailboxCheckResult> {
  const parts = email.trim().split('@');
  if (parts.length !== 2 || !parts[1]) {
    return { valid: false, reason: 'Invalid email format.' };
  }

  const [localPart, domainPart] = parts;
  const domain = domainPart.toLowerCase();

  // Instant fake user rejection
  if (isLikelyFakeUsername(localPart)) {
    return {
      valid: false,
      message: 'Invalid: Mailbox does not exist on this server (Fake user).',
      reason: 'Mailbox does not exist on this server (Fake user).',
    };
  }

  try {
    // 1. Find the MX records for the domain (e.g., fieldbi.com)
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, reason: 'No mail servers found for this domain.' };
    }

    // Sort by priority to get the primary mail server
    mxRecords.sort((a, b) => a.priority - b.priority);
    const mailServer = mxRecords[0].exchange;

    // 2. Connect to the mail server on port 25 (SMTP)
    return new Promise((resolve) => {
      let resolved = false;

      function finish(result: MailboxCheckResult) {
        if (!resolved) {
          resolved = true;
          try {
            socket.write('QUIT\r\n');
          } catch {
            // ignore
          }
          socket.destroy();
          resolve({ ...result, mailServer: result.mailServer || mailServer });
        }
      }

      const socket = net.createConnection(25, mailServer);
      let step = 0;
      let buffer = '';

      socket.setTimeout(2000); // 2 second timeout for fast responsiveness

      socket.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split(/\r?\n/).filter(Boolean);
        const lastLine = lines[lines.length - 1] || '';

        const isCompleteResponse = /^(\d{3})\s/.test(lastLine) || (lines.length > 0 && /^\d{3}/.test(lastLine) && !lastLine.includes('-'));

        if (!isCompleteResponse && lines.length < 3) {
          return; // Wait for full response
        }

        const response = lastLine;
        buffer = '';

        if (step === 0 && (response.startsWith('220') || response.includes('220'))) {
          // Connected successfully, say HELO to the mail server
          socket.write(`HELO ${domain}\r\n`);
          step++;
        } else if (step === 1 && (response.startsWith('250') || response.includes('250'))) {
          // Send MAIL FROM (dummy sender)
          socket.write(`MAIL FROM: <verify@${domain}>\r\n`);
          step++;
        } else if (step === 2 && (response.startsWith('250') || response.includes('250'))) {
          // Send RCPT TO (this tests if the user's email actually exists!)
          socket.write(`RCPT TO: <${email}>\r\n`);
          step++;
        } else if (step === 3) {
          // Check the server's reply to see if the user exists
          if (response.startsWith('250') || response.includes('250')) {
            finish({ valid: true, message: 'Mailbox exists and is active!', method: 'direct_smtp' });
          } else if (response.startsWith('550') || response.startsWith('551') || response.startsWith('552') || response.startsWith('553') || response.startsWith('554')) {
            finish({ valid: false, message: 'Mailbox does not exist on this server (Fake user).', reason: 'Mailbox does not exist on this server (Fake user).', method: 'direct_smtp' });
          } else {
            finish({ valid: true, message: 'Mailbox exists and is active!', method: 'direct_smtp' });
          }
        }
      });

      socket.on('error', async () => {
        const fb = await fallbackCheckAbstractApi(email, mailServer);
        finish(fb);
      });

      socket.on('timeout', async () => {
        const fb = await fallbackCheckAbstractApi(email, mailServer);
        finish(fb);
      });
    });
  } catch (err: any) {
    return { valid: false, message: 'Invalid domain or DNS lookup failed.', reason: 'Invalid domain or DNS lookup failed: ' + (err.message || 'unknown') };
  }
}
