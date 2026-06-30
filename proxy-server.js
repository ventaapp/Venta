/**
 * Spotify Token Exchange Proxy Server
 *
 * GELISTIRME: HTTP (localhost:3001) - Vite HTTPS proxy uzerinden erisilir
 * PRODUCTION: HTTPS olmalidir (reverse proxy veya Node.js native https ile)
 *
 * Calistirma:
 *   npm run proxy  (sadece proxy)
 *   npm run dev    (proxy + vite birlikte)
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.VITE_SPOTIFY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.VITE_SPOTIFY_CLIENT_SECRET || '';
const PORT = process.env.PROXY_PORT || 3001;

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// Spotify Token Exchange
app.post('/api/spotify/token', async (req, res) => {
  const { code, redirect_uri, code_verifier } = req.body;

  if (!code || !redirect_uri) {
    return res.status(400).json({ error: 'code ve redirect_uri gerekli' });
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri,
    });

    // PKCE kullaniliyorsa code_verifier ekle
    if (code_verifier) {
      params.append('code_verifier', code_verifier);
    }

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

    res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    });
  } catch (err) {
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

// Spotify Token Refresh
app.post('/api/spotify/refresh', async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'refresh_token gerekli' });
  }

  try {
    const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || 'Token refresh failed',
      });
    }

    res.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    });
  } catch (err) {
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Spotify Proxy Server http://localhost:${PORT}`);
  console.log(`Token exchange: http://localhost:${PORT}/api/spotify/token`);
  console.log(`Token refresh:  http://localhost:${PORT}/api/spotify/refresh`);
});
