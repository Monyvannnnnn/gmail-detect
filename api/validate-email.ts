export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const email = String(req.query?.email || '').trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const apiKey = process.env.ABSTRACT_API_KEY || '20c168fc6ddf490fb4b2a4f3d29e5153';
  const apiUrl = `https://emailreputation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`;

  try {
    const apiRes = await fetch(apiUrl);
    const data = await apiRes.json();
    return res.status(200).json(data);
  } catch (fetchErr: any) {
    return res.status(500).json({ error: fetchErr.message });
  }
}
