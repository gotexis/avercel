import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Check if `link` command should warn about existing project link.
 * Returns warning message if .vercel/project.json exists, null otherwise.
 */
export function checkLinkGuard(args: string[]): string | null {
  if (args[0] !== 'link') return null;

  const projectJson = join(process.cwd(), '.vercel', 'project.json');
  if (!existsSync(projectJson)) return null;

  try {
    const data = JSON.parse(readFileSync(projectJson, 'utf-8'));
    const projectId = data.projectId || 'unknown';
    return (
      `⚠️  This directory is already linked to Vercel project: ${projectId}\n` +
      `   Running \`vercel link\` will overwrite this. Remove .vercel/project.json first if intentional.`
    );
  } catch {
    return null;
  }
}
