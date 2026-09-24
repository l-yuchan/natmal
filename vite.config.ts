import { defineConfig } from "vite";
import cloudflareTunnel from "vite-plugin-cloudflare-tunnel";

export default defineConfig({
  plugins: [
    cloudflareTunnel({
      hostname: "vitedev.chanoil.com",
      tunnelName: "vite",
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? ""
    }),
  ],
});
