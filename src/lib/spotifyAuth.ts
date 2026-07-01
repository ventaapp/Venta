/**
 * Spotify OAuth PKCE Callback Handler
 *
 * ÇALIŞMA MANTIĞI:
 *
 * WEB (tarayıcı) ortamı:
 * 1. Spotify popup'tan callback URL'ye döner: /?code=xxx&state=xxx
 * 2. Bu script main.tsx'de çalışır (render'dan önce)
 * 3. URL'deki code parametresini okur
 * 4. Parent pencereye (popup açan sayfa) postMessage ile iletir
 * 5. Parent pencere SpotifyConnectScreen.tsx'de bu mesajı dinler
 *
 * NATIVE (Capacitor/Android) ortamı:
 * 1. Spotify, com.vante.app://callback?code=xxx&state=xxx adresine yönlendirir
 * 2. Capacitor App plugin'i appUrlOpen event'ini tetikler
 * 3. SpotifyConnectScreen.tsx bu event'i dinler ve token alır
 *
 * NOT: Bu dosya side-effect içerir. Import edildiğinde otomatik çalışır.
 */

import { Capacitor } from '@capacitor/core';

(function () {
  try {
    // Native ortamda bu dosyanın web kısmı çalışmaz
    // Native deep link işleme SpotifyConnectScreen.tsx'deki App.addListener ile yapılır
    if (Capacitor.isNativePlatform()) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const state = urlParams.get('state');

    // Spotify callback parametreleri yoksa - normal sayfa yükleniyor
    if (!code && !error) return;

    // Callback parametreleri var ama bu bir popup değilse - temizle
    if (!window.opener) {
      // URL'den code/error parametrelerini temizle (güvenlik)
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
      // Popup'ı kapat (kullanıcı görmesin)
      setTimeout(() => window.close(), 500);
    } else if (error) {
      window.opener.postMessage(
        { type: 'SPOTIFY_AUTH_ERROR', error },
        window.location.origin
      );
      setTimeout(() => window.close(), 500);
    }
  } catch (err) {
    console.error('[spotifyAuth] Callback işleme hatası:', err);
  }
})();

export {};
