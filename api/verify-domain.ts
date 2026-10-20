import dns from 'dns/promises';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const domain = String(req.query?.domain || '').trim().toLowerCase();

  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
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

    return res.status(200).json({
      domain,
      hasMx: mxRecords.length > 0,
      mxRecords: mxList,
      isGoogleWorkspace: isGoogle,
      isMicrosoft365: isMicrosoft,
      status: 'OK',
    });
  } catch (dnsErr: any) {
    return res.status(200).json({
      domain,
      hasMx: false,
      mxRecords: [],
      isGoogleWorkspace: false,
      isMicrosoft365: false,
      status: 'NOT_FOUND',
      errorCode: dnsErr.code || 'UNKNOWN',
    });
  }
}
