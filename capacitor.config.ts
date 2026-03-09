import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.74a9bfc366244915aba677472a91be10',
  appName: 'summitcommunity',
  webDir: 'dist',
  server: {
    url: 'https://74a9bfc3-6624-4915-aba6-77472a91be10.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    preferredContentMode: 'mobile',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
