/**
 * Spotify OAuth PKCE Callback Handler
 *
 * CALISMA MANTIĞI:
 * 1. Spotify popup'tan callback URL'ye doner: /?code=xxx&state=xxx
 * 2. Bu script ilk olarak main.tsx'de calisir (render'dan once)
 * 3. URL'deki code parametresini okur
 * 4. Parent pencereye (popup acan sayfa) postMessage ile iletir
 * 5. Parent pencere SpotifyConnectScreen.tsx/SpotifyPlaybackModal.tsx'de
 *    bu mesaji dinler ve token almak icin /api/spotify-token'a istek atar
 *
 * NOT: Bu dosya side-effect icerir. Import edildiginde otomatik calisir.
 */

(function () {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const state = urlParams.get('state');

    // Spotify callback parametreleri yoksa - normal sayfa yukleniyor
    if (!code && !error) return;

    // Callback parametreleri var ama bu bir popup degilse - temizle
    if (!window.opener) {
      // URL'den code/error parametrelerini temizle (guvenlik)
      const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      return;
    }

    // Popup'tan parent pencereye mesaj ilet
    if (code) {
      window.opener.postMessage(
        { type: 'SPOTIFY_AUTH_CODE', code, state },
        window.location.origin
      );
      // Popup'i kapat (kullanici gormesin)
      setTimeout(() => window.close(), 500);
    } else if (error) {
      window.opener.postMessage(
        { type: 'SPOTIFY_AUTH_ERROR', error },
        window.location.origin
      );
      setTimeout(() => window.close(), 500);
    }
  } catch (err) {
    console.error('[spotifyAuth] Callback isleme hatasi:', err);
  }
})();

export {};
