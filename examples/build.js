const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: ['browser-example.js'],
    bundle: true,
    outfile: 'bundle.js',
  })
  .catch(() => process.exit(1));
