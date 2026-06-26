export type TrackResult = {
  id: string;
  title: string;
  artist: string;
  cover: string;
  previewUrl?: string;
};

export async function searchTracks(query: string): Promise<TrackResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(trimmed)}&entity=song&limit=6&country=tr`
  );

  if (!res.ok) return [];

  const data = await res.json();
  const results = Array.isArray(data.results) ? data.results : [];

  return results.map((track: Record<string, unknown>) => ({
    id: String(track.trackId ?? track.collectionId ?? Math.random()),
    title: String(track.trackName ?? ''),
    artist: String(track.artistName ?? ''),
    cover: String(track.artworkUrl100 ?? '').replace('100x100bb', '300x300bb'),
    previewUrl: typeof track.previewUrl === 'string' ? track.previewUrl : undefined,
  }));
}
