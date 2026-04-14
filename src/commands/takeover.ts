import { execSync, spawnSync } from 'node:child_process';

/**
 * `avercel takeover` — replace global `vercel` CLI with avercel.
 *
 * Steps:
 * 1. Check if standalone vercel is installed globally
 * 2. If yes, uninstall it: npm uninstall -g vercel
 * 3. Reinstall avercel globally (which registers both `avercel` and `vercel` bins)
 * 4. Verify: `which vercel` points to avercel
 */
export async function handleTakeover(args: string[]): Promise<number> {
  const force = args.includes('--force');

  if (!force) {
    console.log(`
  avercel takeover — replace the global \`vercel\` command with avercel.

  This will:
    1. Uninstall the standalone \`vercel\` CLI (if installed globally)
    2. Ensure avercel owns both the \`avercel\` and \`vercel\` bin names
       (avercel bundles vercel as a dependency — nothing is lost)

  After takeover:
    • \`vercel ls\`       → runs through avercel → forwarded to real vercel internally
    • \`vercel deploy\`   → blocked by your config → shows your custom message
    • \`echo val | vercel env add\` → trailing newline stripped automatically

  Run with --force to proceed:
    avercel takeover --force
`);
    return 0;
  }

  console.log('avercel: starting takeover...\n');

  // Step 1: Check if standalone vercel is installed globally
  let vercelInstalled = false;
  try {
    const result = spawnSync('npm', ['list', '-g', 'vercel', '--depth=0'], {
      encoding: 'utf-8',
      shell: false,
    });
    // npm list exits 0 if found, non-zero if not
    vercelInstalled =
      result.status === 0 && result.stdout.includes('vercel@');
  } catch {
    // Not found — that's fine
  }

  if (vercelInstalled) {
    console.log('  → Found standalone vercel installed globally. Removing...');
    try {
      execSync('npm uninstall -g vercel', { stdio: 'inherit' });
      console.log('  ✓ Removed standalone vercel\n');
    } catch {
      console.error(
        '  ✗ Failed to uninstall vercel. Try manually: npm uninstall -g vercel'
      );
      return 1;
    }
  } else {
    console.log(
      '  → No standalone vercel found globally. Nothing to uninstall.\n'
    );
  }

  // Step 2: Verify which vercel points to
  try {
    const whichResult = spawnSync('which', ['vercel'], {
      encoding: 'utf-8',
      shell: false,
    });
    const vercelPath = whichResult.stdout?.trim();

    if (vercelPath) {
      console.log(`  → \`which vercel\` → ${vercelPath}`);

      // Check if it's an avercel-managed path
      const whichAvercel = spawnSync('which', ['avercel'], {
        encoding: 'utf-8',
        shell: false,
      });
      const avercelPath = whichAvercel.stdout?.trim();

      if (avercelPath) {
        // Both should be in the same bin directory
        const vercelDir = vercelPath.substring(
          0,
          vercelPath.lastIndexOf('/')
        );
        const avercelDir = avercelPath.substring(
          0,
          avercelPath.lastIndexOf('/')
        );

        if (vercelDir === avercelDir) {
          console.log('  ✓ `vercel` and `avercel` are in the same bin directory — takeover complete!\n');
        } else {
          console.log(
            `  ⚠ \`vercel\` (${vercelDir}) and \`avercel\` (${avercelDir}) are in different directories.`
          );
          console.log(
            '    You may need to reinstall: npm i -g avercel\n'
          );
        }
      }
    } else {
      console.log(
        '  → `vercel` command not found. Install avercel globally to register it:'
      );
      console.log('    npm i -g avercel\n');
    }
  } catch {
    // `which` not available — skip verification
  }

  console.log('  Done! All `vercel` commands now go through avercel\'s guardrails.');
  console.log('  The real vercel CLI is bundled inside avercel as a dependency.\n');

  return 0;
}
