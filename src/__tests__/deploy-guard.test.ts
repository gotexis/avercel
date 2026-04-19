import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isDisabled, isImplicitDeploy } from '../utils/disabled.js';
import type { AVercelConfig } from '../config.js';

const IMPLICIT_MSG = '❌ agent be-advised — you must use git push to deploy via GitHub integration. !!!DO NOT TRY TO CIRCUMVENT BY USING VERCEL BIN DIRECTLY!!!';
const DEPLOY_MSG = '🚫 Deploy is disabled.';

function cfg(disabled: Record<string, string> = {}): AVercelConfig {
  return { disabled } as AVercelConfig;
}

describe('isImplicitDeploy (hardcoded, no config)', () => {
  it('empty args → blocked', () => {
    assert.strictEqual(isImplicitDeploy([]), IMPLICIT_MSG);
  });

  it('--prod → blocked', () => {
    assert.strictEqual(isImplicitDeploy(['--prod']), IMPLICIT_MSG);
  });

  it('--yes → blocked', () => {
    assert.strictEqual(isImplicitDeploy(['--yes']), IMPLICIT_MSG);
  });

  it('. (dot path) → blocked', () => {
    assert.strictEqual(isImplicitDeploy(['.']), IMPLICIT_MSG);
  });

  it('./src → blocked', () => {
    assert.strictEqual(isImplicitDeploy(['./src']), IMPLICIT_MSG);
  });

  it('ls → NOT blocked (known subcommand)', () => {
    assert.strictEqual(isImplicitDeploy(['ls']), null);
  });

  it('env pull → NOT blocked', () => {
    assert.strictEqual(isImplicitDeploy(['env', 'pull']), null);
  });

  it('deploy → NOT implicit (explicit command)', () => {
    assert.strictEqual(isImplicitDeploy(['deploy']), null);
  });

  it('--help → NOT blocked', () => {
    assert.strictEqual(isImplicitDeploy(['--help']), null);
  });
});

describe('isDisabled (config-driven)', () => {
  const config = cfg({ deploy: DEPLOY_MSG });

  it('explicit deploy → caught by config', () => {
    assert.strictEqual(isDisabled('deploy', ['deploy'], config), DEPLOY_MSG);
  });

  it('ls with deploy disabled → null', () => {
    assert.strictEqual(isDisabled('ls', ['ls'], config), null);
  });

  it('empty disabled config → null', () => {
    assert.strictEqual(isDisabled('deploy', ['deploy'], cfg({})), null);
  });
});
