#!/usr/bin/env node

import { loadConfig } from './config.js';
import { isDisabled } from './utils/disabled.js';
import { checkBlockedEnvs } from './utils/blocked-envs.js';
import { handleEnvAdd } from './patches/env-add.js';
import { handleEnvCheck } from './commands/env-check.js';
import { handleConfigShow } from './commands/config.js';
import { passthrough } from './passthrough.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
      printHelp();
      // Still forward to vercel for its own help
      if (args.length === 0) {
        const code = await passthrough(args);
        process.exit(code);
      }
      return;
    }
  }

  const config = loadConfig();
  const command = args[0];

  // Check disabled commands
  const disabledMsg = isDisabled(command, args, config);
  if (disabledMsg) {
    console.error(disabledMsg);
    process.exit(1);
  }

  // Check blocked environment names
  const blockedMsg = checkBlockedEnvs(args, config);
  if (blockedMsg) {
    console.error(blockedMsg);
    process.exit(1);
  }

  // Built-in commands
  if (command === 'env' && args[1] === 'check') {
    const code = await handleEnvCheck(args.slice(2), config);
    process.exit(code);
  }

  if (command === 'config' && (args.length === 1 || args[1] === 'show')) {
    handleConfigShow(config);
    process.exit(0);
  }

  // Patched commands
  if (args[0] === 'env' && args[1] === 'add') {
    const code = await handleEnvAdd(args);
    process.exit(code);
  }

  // Default: passthrough to vercel
  const code = await passthrough(args);
  process.exit(code);
}

function printHelp(): void {
  console.log(`
  avercel — Agent-Vercel: opinionated Vercel CLI wrapper

  PATCHES:
    env add        Strips trailing whitespace/newlines from piped stdin

  EXTRA COMMANDS:
    env check      Audit env vars for trailing whitespace/newlines
    config [show]  Print active configuration

  GUARDS:
    disabled       Block specific commands with custom messages
    blocked_envs   Block specific environment names in env commands

  CONFIG:
    .avercel/avercel.yaml  (project-level, takes priority)
    ~/.avercel/avercel.yaml (global fallback)

  Everything else is forwarded to \`vercel\` as-is.
`);
}

main().catch((err: Error) => {
  console.error('avercel: fatal error:', err.message);
  process.exit(1);
});
