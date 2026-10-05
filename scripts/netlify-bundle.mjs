import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipFunctions } from '@netlify/zip-it-and-ship-it';

const root = fileURLToPath(new URL('../', import.meta.url));
// Mirrors [functions] in netlify.toml; this command only builds local files.
const functions = await zipFunctions(
  resolve(root, 'apps/api/functions'),
  resolve(root, '.local/netlify-functions'),
  {
    archiveFormat: 'zip',
    basePath: root,
    config: {
      '*': {
        nodeBundler: 'esbuild',
        nodeVersion: '22',
        externalNodeModules: ['@prisma/client'],
        includedFiles: [
          'node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**',
        ],
      },
    },
  },
);

if (functions.length !== 1 || functions[0].runtimeAPIVersion !== 2) {
  throw new Error('Expected one Request/Response API function.');
}
for (const fn of functions) {
  if (fn.inputs.some((input) => /^\.env(?:\.|$)/.test(basename(input)))) {
    throw new Error(
      'Refusing a Functions artifact containing an environment file.',
    );
  }
  console.log(
    `${fn.name}: ${fn.bundler}, API v${fn.runtimeAPIVersion}, ${fn.runtimeVersion}`,
  );
}
