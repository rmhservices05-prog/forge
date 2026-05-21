import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ["forge-l4fz.onrender.com", ".onrender.com"],
  },
});
