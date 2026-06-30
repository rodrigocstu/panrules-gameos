import type { CapacitorConfig } from '@capacitor/cli';

// appId and appName follow the entregable spec (EGC-9).
// webDir must match the --outDir of "build:mobile" ("dist-mobile").
// Run `npm run cap:sync` to build and push to native projects.
const config: CapacitorConfig = {
  appId: 'com.panrules.edugame',
  appName: 'CiberSec Edugame',
  // Matches `npm run build:mobile` outDir so Capacitor copies the correct bundle.
  webDir: 'dist-mobile',
  server: {
    // Required in Capacitor 6+ for Android WebView HTTPS scheme.
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      // All three presentation options enabled; permission requested just-in-time.
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      // Matches theme_color / background_color in the PWA manifest (vite.config.js).
      backgroundColor: '#0f172a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f172a',
    },
  },
};

export default config;
