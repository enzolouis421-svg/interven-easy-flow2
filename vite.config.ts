import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5000,
    strictPort: false, // Si le port 5000 est occupé, utilise le prochain port disponible
    // Note: Si vous voulez forcer le port 5000, changez strictPort à true
    // et désactivez AirPlay Receiver dans Préférences Système > Partage
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
