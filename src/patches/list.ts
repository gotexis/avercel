import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { findVercelBin, vercelSpawnArgs } from '../utils/find-vercel-bin.js';

/**
 * Patched `list` / `ls` command.
 *
 * Default `vercel list` only shows Ready deployments and hides ERROR/CANCELED.
 * This silently misleads when investigating a broken site — the latest
 * Ready deployment is shown but the actual most-recent (failed) deployment
 * is missing. Agents wrongly conclude "webhook broken" instead of seeing
 * the build error.
 *
 * Patched behavior:
 *   - Default: include ALL deployment states (Ready, Error, Canceled, Building, Queued)
 *   - `--ready-only`: opt-in to legacy behavior (Ready only)
 *   - All other flags pass through to vercel CLI unchanged
 *
 * Implementation: Uses Vercel REST API directly because `vercel list`
 * doesn't expose a "show all states" flag.
 */

interface Deployment {
  uid: string;
  url: string;
  state: string;
  target: string | null;
  created: number;
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
  };
}

const STATE_ICON: Record<string, string> = {
  READY: '●',
  ERROR: '✖',
  CANCELED: '⊘',
  BUILDING: '⟳',
  QUEUED: '◌',
  INITIALIZING: '◌',
};

const STATE_COLOR: Record<string, string> = {
  READY: '\x1b[32m',     // green
  ERROR: '\x1b[31m',     // red
  CANCELED: '\x1b[90m',  // gray
  BUILDING: '\x1b[33m',  // yellow
  QUEUED: '\x1b[36m',    // cyan
  INITIALIZING: '\x1b[36m',
};
const RESET = '\x1b[0m';

function loadVercelToken(): string | null {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN.trim();
  const tokenFile = join(homedir(), '.vercel_token');
  if (existsSync(tokenFile)) {
    return readFileSync(tokenFile, 'utf-8').trim();
  }
  return null;
}

function findProjectInfo(cwd: string): { projectId: string; orgId: string } | null {
  const projectFile = join(cwd, '.vercel', 'project.json');
  if (!existsSync(projectFile)) return null;
  try {
    const data = JSON.parse(readFileSync(projectFile, 'utf-8'));
    return { projectId: data.projectId, orgId: data.orgId };
  } catch {
    return null;
  }
}

function parseFlag(args: string[], flag: string): string | null {
  const i = args.indexOf(flag);
  if (i === -1) return null;
  return args[i + 1] ?? null;
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function fmtAge(ms: number): string {
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

async function fetchDeployments(
  token: string,
  projectId: string,
  teamId: string,
  limit: number
): Promise<Deployment[]> {
  const url = `https://api.vercel.com/v6/deployments?projectId=${projectId}&teamId=${teamId}&limit=${limit}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    throw new Error(`Vercel API ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { deployments?: Deployment[] };
  return data.deployments ?? [];
}

function passthroughList(args: string[]): Promise<number> {
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
        console.error('avercel: `vercel` CLI not found.');
        resolve(127);
      } else reject(err);
    });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

export async function handleList(args: string[]): Promise<number> {
  // Opt-out: --ready-only restores legacy "Ready only" behavior via passthrough
  if (hasFlag(args, '--ready-only')) {
    const filtered = args.filter((a) => a !== '--ready-only');
    return passthroughList(filtered);
  }

  // Opt-out: --legacy uses raw vercel CLI directly
  if (hasFlag(args, '--legacy')) {
    const filtered = args.filter((a) => a !== '--legacy');
    return passthroughList(filtered);
  }

  const token = loadVercelToken();
  if (!token) {
    console.error('avercel: no token found (set VERCEL_TOKEN or ~/.vercel_token). Falling back to passthrough.');
    return passthroughList(args);
  }

  const projectInfo = findProjectInfo(process.cwd());
  if (!projectInfo) {
    console.error('avercel: no .vercel/project.json found in cwd. Falling back to passthrough.');
    return passthroughList(args);
  }

  const limitArg = parseFlag(args, '--limit') ?? parseFlag(args, '-l');
  const limit = limitArg ? parseInt(limitArg, 10) : 20;

  try {
    const deps = await fetchDeployments(token, projectInfo.projectId, projectInfo.orgId, limit);

    if (deps.length === 0) {
      console.log('No deployments found.');
      return 0;
    }

    // Header
    console.error(`avercel list — showing ALL states (use --ready-only for vercel default)\n`);
    console.log(
      `${'AGE'.padEnd(6)} ${'STATE'.padEnd(10)} ${'TARGET'.padEnd(11)} ${'COMMIT'.padEnd(9)} URL`
    );

    let errorCount = 0;
    for (const dep of deps) {
      const age = fmtAge(dep.created);
      const state = dep.state || 'UNKNOWN';
      const icon = STATE_ICON[state] ?? '·';
      const color = STATE_COLOR[state] ?? '';
      const target = dep.target ?? 'preview';
      const sha = (dep.meta?.githubCommitSha ?? '').slice(0, 7) || '       ';
      const msg = (dep.meta?.githubCommitMessage ?? '').slice(0, 50);
      const url = `https://${dep.url}`;

      console.log(
        `${age.padEnd(6)} ${color}${icon} ${state.padEnd(8)}${RESET} ${target.padEnd(11)} ${sha} ${url}${msg ? '  ' + color + msg + RESET : ''}`
      );

      if (state === 'ERROR') errorCount++;
    }

    if (errorCount > 0) {
      console.error(
        `\n⚠️  ${errorCount} deployment(s) in ERROR state. Inspect logs:\n   avercel inspect <url> --logs`
      );
    }

    return 0;
  } catch (err) {
    console.error(`avercel: API error — ${(err as Error).message}. Falling back to passthrough.`);
    return passthroughList(args);
  }
}
