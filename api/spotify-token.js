/**
 * Vercel Serverless Function - Spotify Token Exchange
 * Endpoint: POST /api/spotify-token
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { code, redirect_uri, code_verifier } = req.body;

  if (!code || !redirect_uri) {
    return res.status(400).json({ error: 'code ve redirect_uri gerekli' });
  }

  const CLIENT_ID = process.env.VITE_SPOTIFY_CLIENT_ID || '';
  const CLIENT_SECRET = process.env.VITE_SPOTIFY_CLIENT_SECRET || '';

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: 'Spotify Client ID/Secret ayarlanmamis' });
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri,
    });
    if (code_verifier) params.append('code_verifier', code_verifier);

    const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
      },
      body: params,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || 'Token exchange failed',
        error_description: data.error_description || '',
      });
    }

    return res.status(200).json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
