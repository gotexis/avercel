import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isDisabled } from '../utils/disabled.js';
import type { AVercelConfig } from '../config.js';

const MSG = '🚫 Deploy is disabled.';

function cfg(disabled: Record<string, string> = {}): AVercelConfig {
  return { disabled } as AVercelConfig;
}

describe('implicit deploy detection', () => {
  const config = cfg({ deploy: MSG });

  it('empty args → deploy disabled', () => {
    assert.strictEqual(isDisabled('', [], config), MSG);
  });

  it('--prod → deploy disabled', () => {
    assert.strictEqual(isDisabled('--prod', ['--prod'], config), MSG);
  });

  it('--yes → deploy disabled', () => {
    assert.strictEqual(isDisabled('--yes', ['--yes'], config), MSG);
  });

  it('. (dot path) → deploy disabled', () => {
    assert.strictEqual(isDisabled('.', ['.'], config), MSG);
  });

  it('./src → deploy disabled', () => {
    assert.strictEqual(isDisabled('./src', ['./src'], config), MSG);
  });

  it('ls → NOT deploy (known subcommand)', () => {
    assert.strictEqual(isDisabled('ls', ['ls'], config), null);
  });

  it('env pull → NOT deploy', () => {
    assert.strictEqual(isDisabled('env', ['env', 'pull'], config), null);
  });

  it('empty args without deploy disabled → null', () => {
    assert.strictEqual(isDisabled('', [], cfg({})), null);
  });

  it('explicit deploy → still caught', () => {
    assert.strictEqual(isDisabled('deploy', ['deploy'], config), MSG);
  });
});
