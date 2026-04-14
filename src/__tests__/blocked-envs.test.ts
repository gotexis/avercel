import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkBlockedEnvs } from '../utils/blocked-envs.js';

describe('checkBlockedEnvs', () => {
  const config = {
    blocked_envs: {
      preview: "❌ This project uses 'dev' not 'preview'. Use: avercel env pull dev",
      staging: '❌ No staging environment configured.',
    },
  };

  it('should block `env pull preview`', () => {
    const result = checkBlockedEnvs(['env', 'pull', 'preview'], config);
    assert.ok(result);
    assert.ok(result.includes('preview'));
  });

  it('should block `env add VAR preview`', () => {
    const result = checkBlockedEnvs(
      ['env', 'add', 'MY_VAR', 'preview'],
      config
    );
    assert.ok(result);
    assert.ok(result.includes('preview'));
  });

  it('should block `env ls staging`', () => {
    const result = checkBlockedEnvs(['env', 'ls', 'staging'], config);
    assert.ok(result);
    assert.ok(result.includes('staging'));
  });

  it('should block `env rm VAR staging`', () => {
    const result = checkBlockedEnvs(
      ['env', 'rm', 'MY_VAR', 'staging'],
      config
    );
    assert.ok(result);
    assert.ok(result.includes('staging'));
  });

  it('should NOT block `env pull production`', () => {
    const result = checkBlockedEnvs(['env', 'pull', 'production'], config);
    assert.strictEqual(result, null);
  });

  it('should NOT block `env pull dev`', () => {
    const result = checkBlockedEnvs(['env', 'pull', 'dev'], config);
    assert.strictEqual(result, null);
  });

  it('should NOT block non-env commands', () => {
    const result = checkBlockedEnvs(['deploy', '--prod'], config);
    assert.strictEqual(result, null);
  });

  it('should pass through with no blocked_envs config', () => {
    const result = checkBlockedEnvs(['env', 'pull', 'preview'], {});
    assert.strictEqual(result, null);
  });

  it('should pass through with empty blocked_envs', () => {
    const result = checkBlockedEnvs(['env', 'pull', 'preview'], {
      blocked_envs: {},
    });
    assert.strictEqual(result, null);
  });

  it('should skip flags when checking', () => {
    const result = checkBlockedEnvs(
      ['env', 'pull', '--yes', 'production'],
      config
    );
    assert.strictEqual(result, null);
  });

  it('should handle env command with no subcommand', () => {
    const result = checkBlockedEnvs(['env'], config);
    assert.strictEqual(result, null);
  });

  it('should not block unknown env subcommands', () => {
    const result = checkBlockedEnvs(
      ['env', 'unknown', 'preview'],
      config
    );
    assert.strictEqual(result, null);
  });
});
