import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.examprep.app',
  appName: 'Exam Prep OS',
  webDir: 'public',
  server: {
    url: 'https://exam-prep-os.vercel.app',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  }
};

export default config;
