import { build } from 'esbuild';
import { copyFileSync } from 'node:fs';
await build({ entryPoints: ['app.js'], bundle: true, format: 'esm', outfile: 'dist/app.js' });
copyFileSync('contracts/orderproof.py', 'dist/orderproof.py');
