import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sawtak.app",
  appName: "Sawtak",
  webDir: "out",
  server: {
    // During development, point to your local Next.js dev server for live reload
    // url: "http://192.168.1.X:3000",
    // cleartext: true,
  },
  plugins: {
    Browser: {
      // Native browser configuration
    },
  },
};

export default config;
