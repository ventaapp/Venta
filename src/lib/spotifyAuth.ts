/**
 * Spotify OAuth Authorization Code Flow - Callback Handler (PKCE)
 *
 * Bu dosyayı redirect URI olarak belirtilen sayfada (örn. /feed)
 * import edin. Popup'tan dönen code'u yakalar ve parent pencereye ilet.
 *
 * Kullanım: MainFeedScreen.tsx (veya redirect URI sayfası) içinde:
 * import '../lib/spotifyAuth'; // Sadece import et, side-effect çalışır
 */

(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');
  const state = urlParams.get('state');

  // URL'den code parametresi varsa (Spotify callback)
  if (code) {
    // Parent pencereye code'u ilet
    if (window.opener) {
      window.opener.postMessage(
        { type: 'SPOTIFY_AUTH_CODE', code, state },
        window.location.origin
      );
      window.close();
    }
  } else if (error) {
    if (window.opener) {
      window.opener.postMessage(
        { type: 'SPOTIFY_AUTH_ERROR', error },
        window.location.origin
      );
      window.close();
    }
  }
})();

export {};
