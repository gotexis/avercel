import type { AVercelConfig } from '../config.js';

const VERCEL_SUBCOMMANDS = new Set([
  'dev', 'env', 'domains', 'dns', 'certs', 'secrets', 'logs', 'inspect',
  'deploy', 'remove', 'rm', 'ls', 'list', 'alias', 'bisect', 'build',
  'link', 'login', 'logout', 'pull', 'rollback', 'promote', 'redeploy',
  'switch', 'teams', 'whoami', 'project', 'projects', 'integration', 'target',
  'telemetry', 'blob', 'help', 'init', 'git', 'config', 'takeover',
  'domain', 'cert', 'secret', 'log', 'aliases',
]);

const DEPLOY_FLAGS = new Set([
  '--prod', '--yes', '--confirm', '--prebuilt', '--archive',
]);

/**
 * Check if a command is disabled via config.
 * Returns the error message if disabled, null otherwise.
 *
 * Matches the top-level command (e.g., "deploy") and also
 * compound commands (e.g., "env add" matches disabled key "env add").
 *
 * When "deploy" is disabled, also catches implicit deploy forms:
 * - No args (vercel's default = deploy)
 * - First arg is a deploy flag (--prod, --yes, etc.)
 * - First arg is a path (not a known subcommand and not a flag)
 */
export function isDisabled(
  command: string,
  args: string[],
  config: AVercelConfig
): string | null {
  const disabled = config.disabled;
  if (!disabled || Object.keys(disabled).length === 0) return null;

  // Check compound command first (e.g., "env add")
  if (args.length >= 2) {
    const compound = `${args[0]} ${args[1]}`;
    if (disabled[compound]) {
      return disabled[compound];
    }
  }

  // Check single command
  if (disabled[command]) {
    return disabled[command];
  }

  return null;
}

const IMPLICIT_DEPLOY_MSG = '❌ agent be-advised — you must use git push to deploy via GitHub integration. !!!DO NOT TRY TO CIRCUMVENT BY USING VERCEL BIN DIRECTLY!!!';

/**
 * Check for implicit deploy forms — HARDCODED block, not config-dependent.
 * Returns error message if implicit deploy detected, null otherwise.
 *
 * Catches: no args, --prod, --yes, path args (anything not a known subcommand/flag).
 */
export function isImplicitDeploy(args: string[]): string | null {
  if (args.length === 0) return IMPLICIT_DEPLOY_MSG;

  const first = args[0];
  if (DEPLOY_FLAGS.has(first)) return IMPLICIT_DEPLOY_MSG;
  if (!first.startsWith('-') && !VERCEL_SUBCOMMANDS.has(first)) return IMPLICIT_DEPLOY_MSG;

  return null;
}
