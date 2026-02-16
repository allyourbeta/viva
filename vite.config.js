/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Storybook imports removed for build compatibility
// import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
// import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

function mutableNamespacePlugin() {
  const replacement = (src) =>
    `import { saveSession as __ss, loadSessions as __ls, loadSession as __lo } from '${src}';\nlet supabaseApi = { saveSession: __ss, loadSessions: __ls, loadSession: __lo }`;

  return {
    name: 'mutable-namespace',
    enforce: 'pre',
    transform(code, id) {
      const cleanId = id.split('?')[0];
      if (!cleanId.endsWith('LearningCard.stories.jsx')) return null;
      if (!code.includes('import * as supabaseApi')) return null;
      const transformed = code.replace(
        /import \* as supabaseApi from '([^']+)'/,
        (_, src) => replacement(src)
      );
      return { code: transformed, map: null };
    },
    config() {
      return {
        optimizeDeps: {
          esbuildOptions: {
            plugins: [{
              name: 'mutable-namespace-esbuild',
              setup(build) {
                build.onLoad({ filter: /LearningCard\.stories\.jsx$/ }, async (args) => {
                  const fs = await import('node:fs');
                  let code = fs.readFileSync(args.path, 'utf8');
                  if (code.includes('import * as supabaseApi')) {
                    code = code.replace(
                      /import \* as supabaseApi from '([^']+)'/,
                      (_, src) => replacement(src)
                    );
                  }
                  return { contents: code, loader: 'jsx' };
                });
              }
            }]
          }
        }
      };
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  }
});
