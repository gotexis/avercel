import { spawn } from 'node:child_process';

/**
 * Passthrough all args to `vercel` CLI with full stdio inheritance.
 * Returns the exit code from vercel.
 */
export function passthrough(args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn('vercel', args, {
      stdio: 'inherit',
      env: process.env,
      shell: false,
    });

    child.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        console.error(
          'avercel: `vercel` CLI not found. Install it with `npm i -g vercel`.'
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
