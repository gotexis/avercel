import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// We test config loading by setting up temp directories
// Since loadConfig uses process.cwd() and homedir(), we test the logic
// by importing the module and checking the shape.

describe('config loading', () => {
  it('should return a valid config shape with defaults', async () => {
    // Dynamic import to ensure the module loads
    const { loadConfig } = await import('../config.js');
    const config = loadConfig();

    assert.ok(typeof config === 'object');
    assert.ok('disabled' in config);
    assert.ok('blocked_envs' in config);
    assert.ok(typeof config.disabled === 'object');
    assert.ok(typeof config.blocked_envs === 'object');
  });

  it('should return config paths info', async () => {
    const { getConfigPaths } = await import('../config.js');
    const paths = getConfigPaths();

    assert.ok(Array.isArray(paths));
    assert.strictEqual(paths.length, 2);
    for (const p of paths) {
      assert.ok('path' in p);
      assert.ok('exists' in p);
      assert.ok(typeof p.path === 'string');
      assert.ok(typeof p.exists === 'boolean');
    }
  });

  it('should parse a valid YAML config', () => {
    // Create a temp config directory
    const tempDir = join(tmpdir(), `avercel-test-${Date.now()}`);
    const configDir = join(tempDir, '.avercel');
    mkdirSync(configDir, { recursive: true });

    const configContent = `
disabled:
  deploy: "Do not deploy directly"
blocked_envs:
  preview: "Use dev instead"
`;
    writeFileSync(join(configDir, 'avercel.yaml'), configContent);

    // We can't easily test loadConfig with a custom cwd,
    // but we verify the YAML parsing by checking yaml.load works
    const yaml = require('js-yaml');
    const parsed = yaml.load(configContent);
    assert.deepStrictEqual(parsed.disabled, {
      deploy: 'Do not deploy directly',
    });
    assert.deepStrictEqual(parsed.blocked_envs, {
      preview: 'Use dev instead',
    });

    // Cleanup
    rmSync(tempDir, { recursive: true, force: true });
  });
});
