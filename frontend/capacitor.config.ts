import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.timetable.app',
  appName: 'Timetable App',
  webDir: 'build',
  server: {
    cleartext: true
  }
};

export default config;
