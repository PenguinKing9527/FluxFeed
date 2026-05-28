import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';
import path from 'node:path';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    permissions: ['storage', 'contextMenus', 'activeTab', 'scripting', 'tabs', 'alarms'],
    host_permissions: ['*://*/*'],
    name: 'FluxFeed',
    description: 'A browser extension that provides a feed of updates from various sources, such as social media, news, and more.',
    action: {
      default_title: "FluxFeed",
    },
    commands: {
    }
  },
  modules: ['@wxt-dev/module-react'],
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      manifest.options_ui = {
        page: 'options.html',
        open_in_tab: true,
      };
    },
  },
  vite: () => ({
    plugins: [tailwindcss() as any],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  }),
});
