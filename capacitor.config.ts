import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vante.app',
  appName: 'Vante',
  webDir: 'dist',
  // Android'de HTTP/HTTPS cleartext trafige izin ver (dev sirasinda)
  android: {
    allowMixedContent: true,
  },
  // iOS'ta HTTP baglantilara izin ver (dev sirasinda)
  ios: {
    contentInset: 'always',
  },
};

export default config;
