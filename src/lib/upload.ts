function getImgbbApiKey(): string {
  const key = import.meta.env.VITE_IMGBB_API_KEY;
  if (!key) {
    throw new Error('Görsel yükleme yapılandırması eksik.');
  }
  return key;
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${getImgbbApiKey()}`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!data.success || !data.data?.url) {
    throw new Error('Görsel yüklenemedi.');
  }

  return data.data.url as string;
}
