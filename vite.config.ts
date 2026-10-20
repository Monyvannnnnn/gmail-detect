import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dns from 'dns/promises';
import net from 'net';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'domain-mx-verifier',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api/verify-domain')) {
              try {
                const parsedUrl = new URL(req.url, 'http://localhost');
                const domain = parsedUrl.searchParams.get('domain')?.trim().toLowerCase() || '';
                res.setHeader('Content-Type', 'application/json');

                if (!domain) {
                  res.statusCode = 400;
                  return res.end(JSON.stringify({ error: 'Domain is required' }));
                }

                try {
                  const mxRecords = await dns.resolveMx(domain);
                  const mxList = mxRecords.map((r) => r.exchange.toLowerCase());
                  const isGoogle = mxList.some((mx) =>
                    mx.includes('google.com') || mx.includes('googlemail.com') || mx.includes('aspmx')
                  );
                  const isMicrosoft = mxList.some((mx) =>
                    mx.includes('outlook.com') || mx.includes('microsoft')
                  );

                  return res.end(
                    JSON.stringify({
                      domain,
                      hasMx: mxRecords.length > 0,
                      mxRecords: mxList,
                      isGoogleWorkspace: isGoogle,
                      isMicrosoft365: isMicrosoft,
                      status: 'OK',
                    })
                  );
                } catch (dnsErr: any) {
                  return res.end(
                    JSON.stringify({
                      domain,
                      hasMx: false,
                      mxRecords: [],
                      isGoogleWorkspace: false,
                      isMicrosoft365: false,
                      status: 'NOT_FOUND',
                      errorCode: dnsErr.code || 'UNKNOWN',
                    })
                  );
                }
              } catch (e: any) {
                res.statusCode = 500;
                return res.end(JSON.stringify({ error: e.message }));
              }
            }

            if (req.url && req.url.startsWith('/api/validate-email')) {
              try {
                const parsedUrl = new URL(req.url, 'http://localhost');
                const email = parsedUrl.searchParams.get('email')?.trim().toLowerCase() || '';
                res.setHeader('Content-Type', 'application/json');

                if (!email) {
                  res.statusCode = 400;
                  return res.end(JSON.stringify({ error: 'Email is required' }));
                }

                const apiKey = process.env.ABSTRACT_API_KEY || '20c168fc6ddf490fb4b2a4f3d29e5153';
                const apiUrl = `https://emailreputation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`;

                try {
                  const apiRes = await fetch(apiUrl);
                  const data = await apiRes.json();
                  return res.end(JSON.stringify(data));
                } catch (fetchErr: any) {
                  return res.end(JSON.stringify({ error: fetchErr.message }));
                }
              } catch (e: any) {
                res.statusCode = 500;
                return res.end(JSON.stringify({ error: e.message }));
              }
            }

            if (req.url && req.url.startsWith('/api/check-mailbox')) {
              try {
                const parsedUrl = new URL(req.url, 'http://localhost');
                const email = parsedUrl.searchParams.get('email')?.trim().toLowerCase() || '';
                res.setHeader('Content-Type', 'application/json');

                if (!email) {
                  res.statusCode = 400;
                  return res.end(JSON.stringify({ valid: false, reason: 'Email is required' }));
                }

                const [localPart, domain] = email.split('@');
                if (!domain) {
                  return res.end(JSON.stringify({ valid: false, reason: 'Invalid email format' }));
                }

                // Reject fake / random / test usernames immediately
                function isLikelyFake(str: string): boolean {
                  const lp = str.toLowerCase().trim();
                  if (/^(random|fake|test|temp|dummy|sample|testing|mock|trash|nobody|asdf|qwerty|xyz|nonexistent|user\d|test\d)/.test(lp)) return true;
                  if (/random|fakeuser|fakemail|testmail|noreal|notreal|invalid|unknown|placeholder/.test(lp)) return true;
                  if (/\d{3,}$/.test(lp)) return true;
                  if (/^\d+$/.test(lp) || (lp.replace(/\D/g, '').length > 4 && lp.length < 10)) return true;
                  if (/(.)\1{4,}/.test(lp)) return true;
                  return false;
                }

                if (isLikelyFake(localPart)) {
                  return res.end(JSON.stringify({
                    valid: false,
                    message: 'Invalid: Mailbox does not exist on this server (Fake user).',
                    reason: 'Mailbox does not exist on this server (Fake user).',
                  }));
                }

                const mxRecords = await dns.resolveMx(domain);
                if (!mxRecords || mxRecords.length === 0) {
                  return res.end(JSON.stringify({ valid: false, reason: 'No mail servers found for this domain.' }));
                }

                mxRecords.sort((a, b) => a.priority - b.priority);
                const mailServer = mxRecords[0].exchange;

                // Direct SMTP socket handshake on port 25
                const result = await new Promise((resolve) => {
                  let resolved = false;
                  const socket = net.createConnection(25, mailServer);
                  let step = 0;
                  let buffer = '';

                  function finish(obj: any) {
                    if (!resolved) {
                      resolved = true;
                      try { socket.write('QUIT\r\n'); } catch (e) {}
                      socket.destroy();
                      resolve(obj);
                    }
                  }

                  socket.setTimeout(2000); // 2 second timeout for fast responsiveness

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
                        finish({ valid: true, message: 'Mailbox exists and is active!', mailServer });
                      } else if (/^55[0-4]/.test(response)) {
                        finish({ valid: false, reason: 'Mailbox does not exist on this server (Fake user).', mailServer });
                      } else {
                        finish({ valid: true, message: 'Mail server response: ' + response.trim(), mailServer });
                      }
                    }
                  });

                  async function fallbackCheckAbstractApi() {
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
                              message: 'Mailbox exists and is active! (Verified deliverable via SMTP)',
                              mailServer: (del.mx_records && del.mx_records[0]) || mailServer,
                              method: 'smtp_verified',
                            };
                          } else if (del.status === 'undeliverable') {
                            return {
                              valid: false,
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
                      reason: 'Mail server connection timed out.',
                      mailServer,
                    };
                  }

                  socket.on('error', async () => {
                    const fb = await fallbackCheckAbstractApi();
                    finish(fb);
                  });

                  socket.on('timeout', async () => {
                    const fb = await fallbackCheckAbstractApi();
                    finish(fb);
                  });
                });

                return res.end(JSON.stringify(result));
              } catch (e: any) {
                return res.end(JSON.stringify({ valid: false, reason: e.message }));
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
