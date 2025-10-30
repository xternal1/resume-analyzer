import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Jika deploy ke https://xternal1.github.io/resume-analyzer,
// set base ke '/resume-analyzer/'.
// Jika deploy ke custom domain (www.eventhorizon.com), gunakan base: '/'
export default defineConfig({

  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  build: {
    // outDir default = 'dist' (bisa diubah kalau perlu)
    outDir: "dist"
  }
});
