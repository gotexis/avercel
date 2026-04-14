import type { AVercelConfig } from '../config.js';

/**
 * ENV subcommands where an environment name argument is expected.
 * These are the commands where we check for blocked environment names.
 */
const ENV_SUBCOMMANDS = ['pull', 'add', 'ls', 'rm'];

/**
 * Check if args contain a blocked environment name.
 * Returns the error message if blocked, null otherwise.
 *
 * Scans args for `env <subcommand> ... <env-name>` patterns and checks
 * whether any argument matches a key in config.blocked_envs.
 */
export function checkBlockedEnvs(
  args: string[],
  config: AVercelConfig
): string | null {
  const blockedEnvs = config.blocked_envs;
  if (!blockedEnvs || Object.keys(blockedEnvs).length === 0) return null;

  // Only applies to `env` commands
  if (args[0] !== 'env' || args.length < 2) return null;

  const subcommand = args[1];
  if (!ENV_SUBCOMMANDS.includes(subcommand)) return null;

  // Check all remaining args (after env <subcommand>) for blocked env names
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    // Skip flags
    if (arg.startsWith('-')) continue;
    if (blockedEnvs[arg]) {
      return blockedEnvs[arg];
    }
  }

  return null;
}
