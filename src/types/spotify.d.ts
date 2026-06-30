export {};

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: SpotifyNamespace;
  }
}

interface SpotifyNamespace {
  Player: new (config: SpotifyPlayerConfig) => SpotifyPlayer;
}

interface SpotifyPlayerConfig {
  name: string;
  getOAuthToken: (cb: (token: string) => void) => void;
  volume: number;
}

interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  togglePlay(): Promise<void>;
  addListener(event: 'ready', callback: (data: { device_id: string }) => void): void;
  addListener(event: 'not_ready', callback: (data: { device_id: string }) => void): void;
  addListener(
    event: 'player_state_changed',
    callback: (state: {
      paused: boolean;
      track_window: { current_track: { id: string; name: string; artists: Array<{ name: string }>; album: { images: Array<{ url: string }> } } };
    } | null) => void
  ): void;
  addListener(event: 'initialization_error', callback: (data: { message: string }) => void): void;
  addListener(event: 'authentication_error', callback: (data: { message: string }) => void): void;
  addListener(event: 'account_error', callback: (data: { message: string }) => void): void;
  removeListener(event: string, callback?: (data: unknown) => void): void;
}
