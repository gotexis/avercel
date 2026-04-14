import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findVercelBin, vercelSpawnArgs } from '../utils/find-vercel-bin.js';

describe('findVercelBin', () => {
  it('should return a string', () => {
    const result = findVercelBin();
    assert.equal(typeof result, 'string');
    assert.ok(result.length > 0, 'vercel bin path should not be empty');
  });

  it('should not crash when called multiple times', () => {
    const result1 = findVercelBin();
    const result2 = findVercelBin();
    assert.equal(result1, result2);
  });
});

describe('vercelSpawnArgs', () => {
  it('should use node for .js files', () => {
    const result = vercelSpawnArgs('/path/to/vercel/dist/index.js', [
      'ls',
    ]);
    assert.equal(result.command, process.execPath);
    assert.deepEqual(result.args, [
      '/path/to/vercel/dist/index.js',
      'ls',
    ]);
  });

  it('should use binary directly for non-.js files', () => {
    const result = vercelSpawnArgs('/usr/local/bin/vercel', ['ls']);
    assert.equal(result.command, '/usr/local/bin/vercel');
    assert.deepEqual(result.args, ['ls']);
  });

  it('should pass all args through', () => {
    const result = vercelSpawnArgs('/path/index.js', [
      'env',
      'add',
      'KEY',
      'production',
    ]);
    assert.equal(result.command, process.execPath);
    assert.deepEqual(result.args, [
      '/path/index.js',
      'env',
      'add',
      'KEY',
      'production',
    ]);
  });
});
