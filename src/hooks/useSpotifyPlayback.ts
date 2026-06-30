import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';

interface PlaybackState {
  isReady: boolean;
  isPlaying: boolean;
  currentTrackId: string | null;
  deviceId: string | null;
  error: string | null;
}

export function useSpotifyPlayback() {
  const { spotifyAccessToken } = useStore();
  const [state, setState] = useState<PlaybackState>({
    isReady: false,
    isPlaying: false,
    currentTrackId: null,
    deviceId: null,
    error: null,
  });

  const playerRef = useRef<InstanceType<typeof window.Spotify.Player> | null>(null);

  const initializePlayer = useCallback(() => {
    if (playerRef.current || !spotifyAccessToken) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Vante Player',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(spotifyAccessToken);
        },
        volume: 0.5,
      });

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        setState((prev) => ({
          ...prev,
          isReady: true,
          deviceId: device_id,
          error: null,
        }));
      });

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        setState((prev) => ({
          ...prev,
          isReady: false,
          deviceId: device_id,
        }));
      });

      player.addListener(
        'player_state_changed',
        (playbackState: { paused: boolean; track_window: { current_track: { id: string } } } | null) => {
          if (!playbackState) return;
          const isPlaying = !playbackState.paused;
          const trackId = playbackState.track_window?.current_track?.id || null;
          setState((prev) => ({
            ...prev,
            isPlaying,
            currentTrackId: trackId ? `spotify:track:${trackId}` : null,
          }));
        }
      );

      player.addListener(
        'initialization_error',
        ({ message }: { message: string }) => {
          setState((prev) => ({ ...prev, error: message }));
        }
      );

      player.addListener(
        'authentication_error',
        ({ message }: { message: string }) => {
          setState((prev) => ({ ...prev, error: message }));
        }
      );

      player.addListener(
        'account_error',
        ({ message }: { message: string }) => {
          setState((prev) => ({
            ...prev,
            error: 'Premium hesap gerekli: ' + message,
          }));
        }
      );

      player.connect();
      playerRef.current = player;
    };
  }, [spotifyAccessToken]);

  const playTrack = useCallback(
    async (spotifyUri: string) => {
      if (!state.deviceId || !spotifyAccessToken) {
        setState((prev) => ({ ...prev, error: 'Player hazır değil' }));
        return false;
      }

      try {
        const response = await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${spotifyAccessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uris: [spotifyUri],
            }),
          }
        );

        if (response.status === 204 || response.ok) {
          setState((prev) => ({
            ...prev,
            isPlaying: true,
            currentTrackId: spotifyUri,
            error: null,
          }));
          return true;
        }

        if (response.status === 401) {
          setState((prev) => ({ ...prev, error: 'Token süresi doldu' }));
          return false;
        }

        const errorData = await response.json().catch(() => ({}));
        setState((prev) => ({
          ...prev,
          error: errorData.error?.message || 'Oynatma başarısız',
        }));
        return false;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Oynatma hatası',
        }));
        return false;
      }
    },
    [state.deviceId, spotifyAccessToken]
  );

  /**
   * Şarkı adıyla Spotify'da arama yapıp ilk sonucu çal
   */
  const searchAndPlay = useCallback(
    async (query: string) => {
      if (!spotifyAccessToken) {
        setState((prev) => ({ ...prev, error: 'Spotify token yok' }));
        return false;
      }

      try {
        // 1. Şarkıyı ara
        const searchRes = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
          {
            headers: { Authorization: `Bearer ${spotifyAccessToken}` },
          }
        );

        if (!searchRes.ok) {
          throw new Error('Arama başarısız');
        }

        const searchData = await searchRes.json();
        const track = searchData.tracks?.items?.[0];

        if (!track) {
          setState((prev) => ({ ...prev, error: 'Şarkı bulunamadı' }));
          return false;
        }

        // 2. Player hazır değilse başlat
        if (!playerRef.current) {
          initializePlayer();
          // Device ID alınana kadar bekle (max 5 saniye)
          let attempts = 0;
          while (!playerRef.current && attempts < 50) {
            await new Promise((r) => setTimeout(r, 100));
            attempts++;
          }
          // Biraz daha bekle ki device_id gelsin
          await new Promise((r) => setTimeout(r, 500));
        }

        if (!state.deviceId && !playerRef.current) {
          setState((prev) => ({ ...prev, error: 'Player başlatılamadı' }));
          return false;
        }

        // 3. Çal
        const trackUri = `spotify:track:${track.id}`;
        return await playTrack(trackUri);
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Arama/çalma hatası',
        }));
        return false;
      }
    },
    [spotifyAccessToken, initializePlayer, playTrack, state.deviceId]
  );

  const togglePlayback = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return false;

    try {
      await player.togglePlay();
      setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
      return true;
    } catch {
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.disconnect();
      playerRef.current = null;
    }
    setState({
      isReady: false,
      isPlaying: false,
      currentTrackId: null,
      deviceId: null,
      error: null,
    });
  }, []);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, []);

  return {
    ...state,
    initializePlayer,
    playTrack,
    searchAndPlay,
    togglePlayback,
    disconnect,
  };
}
