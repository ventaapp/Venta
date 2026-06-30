/**
 * Spotify OAuth Implicit Grant Flow - Callback Handler
 * 
 * Bu dosyayı feed sayfasında (veya redirect URI olarak belirtilen sayfada)
 * import edin. Popup'tan dönen token'ı yakalar ve parent pencereye iletir.
 * 
 * Kullanım: MainFeedScreen.tsx (veya redirect URI sayfası) içinde:
 * import '@/lib/spotifyAuth'; // Sadece import et, side-effect çalışır
 */

(function () {
  // Sadece popup/redirect sayfasında çalıştır
  const hash = window.location.hash;
  if (!hash) return;

  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  const error = params.get('error');

  if (accessToken) {
    // Parent pencereye token'ı ilet
    if (window.opener) {
      window.opener.postMessage(
        { type: 'SPOTIFY_AUTH_SUCCESS', access_token: accessToken },
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
