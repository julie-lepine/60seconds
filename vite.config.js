import { defineConfig } from 'vite';

const nativeBuild = process.env.npm_lifecycle_event === 'build:native';

export default defineConfig({
  base: nativeBuild ? './' : (process.env.GITHUB_ACTIONS ? '/60seconds/' : '/'),
});
