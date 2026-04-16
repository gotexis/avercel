import type { AVercelConfig } from '../config.js';

const VERCEL_SUBCOMMANDS = new Set([
  'dev', 'env', 'domains', 'dns', 'certs', 'secrets', 'logs', 'inspect',
  'deploy', 'remove', 'rm', 'ls', 'list', 'alias', 'bisect', 'build',
  'link', 'login', 'logout', 'pull', 'rollback', 'promote', 'redeploy',
  'switch', 'teams', 'whoami', 'project', 'integration', 'target',
  'telemetry', 'blob', 'help', 'init', 'git', 'config', 'takeover',
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

  // Implicit deploy detection: if "deploy" is disabled, catch disguised deploy forms
  if (disabled['deploy']) {
    if (args.length === 0) {
      return disabled['deploy'];
    }
    const first = args[0];
    // Deploy flag as first arg (e.g. avercel --prod)
    if (DEPLOY_FLAGS.has(first)) {
      return disabled['deploy'];
    }
    // Path argument (not a flag, not a known subcommand)
    if (!first.startsWith('-') && !VERCEL_SUBCOMMANDS.has(first)) {
      return disabled['deploy'];
    }
  }

  return null;
}
