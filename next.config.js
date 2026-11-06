const path = require('path');

/** @type {import('next').NextConfig} */
module.exports = {
  // The local test server (npm run dev:test) builds into its own folder so it can
  // run next to the normal dev server without the two overwriting each other.
  distDir: process.env.NEXT_DIST_DIR || '.next',

  webpack(config) {
    // Direct path to the one-file-per-icon folder, so components/ui/DynamicIcon.tsx
    // can load single icons on demand (the package's export map hides the folder).
    config.resolve.alias['phosphor-icons-csr'] = path.join(__dirname, 'node_modules/@phosphor-icons/react/dist/csr');
    return config;
  },
};
