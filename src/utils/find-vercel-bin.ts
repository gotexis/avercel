import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

/**
 * Find the real vercel binary from our own node_modules.
 *
 * Since avercel registers itself as the `vercel` bin, we can't just
 * spawn('vercel', ...) — that would call ourselves recursively.
 * Instead, we resolve vercel's entry point from our bundled dependency.
 */
export function findVercelBin(): string {
  const require_ = createRequire(__filename);

  try {
    const vercelPkg = require_.resolve('vercel/package.json');
    const vercelDir = dirname(vercelPkg);
    const pkg = JSON.parse(readFileSync(vercelPkg, 'utf-8'));

    // vercel's bin is usually "dist/index.js"
    const binPath =
      typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.vercel;

    if (binPath) {
      const fullPath = join(vercelDir, binPath);
      if (existsSync(fullPath)) return fullPath;
    }

    // Fallback: try known path
    const fallback = join(vercelDir, 'dist', 'index.js');
    if (existsSync(fallback)) return fallback;
  } catch {
    // vercel not found as a dependency — will fall through
  }

  // Last resort: warn and return 'vercel' (may recurse if we ARE the vercel bin)
  console.error(
    'avercel: warning — could not find bundled vercel. Falling back to PATH lookup (may recurse).'
  );
  return 'vercel';
}

/**
 * Build spawn arguments for the vercel binary.
 * If it's a .js file, run with node; otherwise run directly.
 */
export function vercelSpawnArgs(
  vercelBin: string,
  args: string[]
): { command: string; args: string[] } {
  if (vercelBin.endsWith('.js')) {
    return { command: process.execPath, args: [vercelBin, ...args] };
  }
  return { command: vercelBin, args };
}
