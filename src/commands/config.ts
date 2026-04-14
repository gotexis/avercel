import type { AVercelConfig } from '../config.js';
import { getConfigPaths } from '../config.js';

/**
 * `config [show]` — print the active configuration.
 */
export function handleConfigShow(config: AVercelConfig): void {
  const paths = getConfigPaths();

  console.log('avercel configuration\n');

  console.log('Config files:');
  for (const p of paths) {
    const status = p.exists ? '✓ loaded' : '✗ not found';
    console.log(`  ${status}  ${p.path}`);
  }

  console.log('\nDisabled commands:');
  const disabled = config.disabled ?? {};
  if (Object.keys(disabled).length === 0) {
    console.log('  (none)');
  } else {
    for (const [cmd, msg] of Object.entries(disabled)) {
      console.log(`  ${cmd}: ${msg}`);
    }
  }

  console.log('\nBlocked environments:');
  const blockedEnvs = config.blocked_envs ?? {};
  if (Object.keys(blockedEnvs).length === 0) {
    console.log('  (none)');
  } else {
    for (const [env, msg] of Object.entries(blockedEnvs)) {
      console.log(`  ${env}: ${msg}`);
    }
  }
}
