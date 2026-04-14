import type { AVercelConfig } from '../config.js';

/**
 * Check if a command is disabled via config.
 * Returns the error message if disabled, null otherwise.
 *
 * Matches the top-level command (e.g., "deploy") and also
 * compound commands (e.g., "env add" matches disabled key "env add").
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
