import { spawn } from 'node:child_process';
import { findVercelBin, vercelSpawnArgs } from './utils/find-vercel-bin.js';

/**
 * Passthrough all args to the real `vercel` CLI with full stdio inheritance.
 * Returns the exit code from vercel.
 */
export function passthrough(args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const vercelBin = findVercelBin();
    const { command, args: spawnArgs } = vercelSpawnArgs(vercelBin, args);

    const child = spawn(command, spawnArgs, {
      stdio: 'inherit',
      env: process.env,
      shell: false,
    });

    child.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        console.error(
          'avercel: `vercel` CLI not found. Install it with `npm i -g avercel` (vercel is bundled).'
        );
        resolve(127);
      } else {
        reject(err);
      }
    });

    child.on('close', (code) => {
      resolve(code ?? 1);
    });
  });
}
