import {defineConfig} from "vite";

export default defineConfig({
  // Relative assets work both at username.github.io and at
  // username.github.io/repository-name without repository-specific config.
  base: "./",
  // Keep a committed production build for repositories whose Pages source is
  // still configured as a branch. The root index redirects to this directory.
  build: {outDir: "site"}
});
