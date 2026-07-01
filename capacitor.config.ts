import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vante.app',
  appName: 'Vante',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#000000',
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#000000',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
