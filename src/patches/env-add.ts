import { spawn } from 'node:child_process';
import { findVercelBin, vercelSpawnArgs } from '../utils/find-vercel-bin.js';

/**
 * Patched `env add` command.
 * Intercepts piped stdin, strips trailing whitespace/newlines,
 * then forwards the cleaned value to `vercel env add`.
 *
 * If stdin is a TTY (interactive), just passthrough normally.
 */
export async function handleEnvAdd(args: string[]): Promise<number> {
  // If stdin is a TTY, no piped input to sanitize — just passthrough
  if (process.stdin.isTTY) {
    return passthroughEnvAdd(args);
  }

  // Read all stdin
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk as Buffer));
  }
  const rawValue = Buffer.concat(chunks).toString('utf-8');

  // Strip trailing whitespace/newlines
  const cleanValue = rawValue.replace(/[\s]+$/, '');

  if (rawValue !== cleanValue) {
    const stripped = rawValue.length - cleanValue.length;
    console.error(
      `avercel: stripped ${stripped} trailing whitespace/newline character(s) from piped input`
    );
  }

  // Forward to vercel with cleaned stdin
  return new Promise((resolve, reject) => {
    const vercelBin = findVercelBin();
    const { command, args: spawnArgs } = vercelSpawnArgs(vercelBin, args);

    const child = spawn(command, spawnArgs, {
      stdio: ['pipe', 'inherit', 'inherit'],
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

    child.stdin!.write(cleanValue);
    child.stdin!.end();

    child.on('close', (code) => {
      resolve(code ?? 1);
    });
  });
}

function passthroughEnvAdd(args: string[]): Promise<number> {
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
