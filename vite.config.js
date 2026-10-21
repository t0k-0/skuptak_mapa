import {defineConfig} from "vite";

export default defineConfig({
  // Relative assets work both at username.github.io and at
  // username.github.io/repository-name without repository-specific config.
  base: "./"
});
