import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import https from 'node:https';
import type { AVercelConfig } from '../config.js';

interface EnvVar {
  key: string;
  value: string;
  target: string[];
  type: string;
  id: string;
}

interface VercelProjectJson {
  projectId?: string;
  orgId?: string;
}

/**
 * `env check` — audit all env vars for trailing whitespace/newlines.
 * Uses Vercel API: GET /v9/projects/{projectId}/env
 */
export async function handleEnvCheck(
  args: string[],
  _config: AVercelConfig
): Promise<number> {
  // Parse flags
  let token = process.env['VERCEL_TOKEN'] ?? '';
  let projectId = '';
  let teamId = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--token' && args[i + 1]) {
      token = args[++i];
    } else if (args[i] === '--project' && args[i + 1]) {
      projectId = args[++i];
    } else if (args[i] === '--team' && args[i + 1]) {
      teamId = args[++i];
    }
  }

  // Try to find token from file
  if (!token) {
    const tokenFile = join(homedir(), '.vercel_token');
    if (existsSync(tokenFile)) {
      token = readFileSync(tokenFile, 'utf-8').trim();
    }
  }

  if (!token) {
    console.error(
      'avercel env check: No Vercel token found.\n' +
        'Provide one via --token, VERCEL_TOKEN env var, or ~/.vercel_token file.'
    );
    return 1;
  }

  // Try to find project ID from .vercel/project.json
  if (!projectId) {
    const projectJsonPath = join(process.cwd(), '.vercel', 'project.json');
    if (existsSync(projectJsonPath)) {
      try {
        const projectJson: VercelProjectJson = JSON.parse(
          readFileSync(projectJsonPath, 'utf-8')
        );
        projectId = projectJson.projectId ?? '';
        if (!teamId) teamId = projectJson.orgId ?? '';
      } catch {
        // ignore parse errors
      }
    }
  }

  if (!projectId) {
    console.error(
      'avercel env check: No project ID found.\n' +
        'Provide one via --project flag or link with `vercel link`.'
    );
    return 1;
  }

  console.log(`Checking env vars for project ${projectId}...`);

  try {
    const envVars = await fetchEnvVars(projectId, teamId, token);

    if (envVars.length === 0) {
      console.log('No environment variables found.');
      return 0;
    }

    const issues: { key: string; target: string[]; problem: string }[] = [];

    for (const env of envVars) {
      // Skip secret type (value is encrypted, can't check)
      if (env.type === 'encrypted' || !env.value) continue;

      const problems: string[] = [];
      if (env.value.endsWith('\n'))
        problems.push('trailing newline (\\n)');
      if (env.value.endsWith('\r'))
        problems.push('trailing carriage return (\\r)');
      if (
        env.value.endsWith(' ') ||
        env.value.endsWith('\t')
      )
        problems.push('trailing whitespace');
      if (env.value !== env.value.trimEnd() && problems.length === 0)
        problems.push('trailing whitespace characters');

      if (problems.length > 0) {
        issues.push({
          key: env.key,
          target: env.target,
          problem: problems.join(', '),
        });
      }
    }

    if (issues.length === 0) {
      console.log(`✅ All clean — ${envVars.length} env vars checked, no trailing whitespace found.`);
      return 0;
    }

    console.log(
      `\n⚠️  Found ${issues.length} env var(s) with trailing whitespace/newlines:\n`
    );
    console.log(
      padRight('Variable', 30) +
        padRight('Targets', 25) +
        'Problem'
    );
    console.log('─'.repeat(80));

    for (const issue of issues) {
      console.log(
        padRight(issue.key, 30) +
          padRight(issue.target.join(', '), 25) +
          issue.problem
      );
    }

    console.log(
      `\nFix: Use \`avercel env add\` with piped input — it auto-strips trailing whitespace.`
    );
    return 1;
  } catch (err) {
    console.error(
      'avercel env check: API error:',
      err instanceof Error ? err.message : err
    );
    return 1;
  }
}

function padRight(str: string, len: number): string {
  return str.length >= len ? str + ' ' : str + ' '.repeat(len - str.length);
}

function fetchEnvVars(
  projectId: string,
  teamId: string,
  token: string
): Promise<EnvVar[]> {
  return new Promise((resolve, reject) => {
    let path = `/v9/projects/${encodeURIComponent(projectId)}/env`;
    if (teamId) path += `?teamId=${encodeURIComponent(teamId)}`;

    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data) as { envs?: EnvVar[]; error?: { message: string } };
          if (res.statusCode !== 200) {
            reject(
              new Error(
                parsed.error?.message ?? `HTTP ${res.statusCode}: ${data}`
              )
            );
            return;
          }
          resolve(parsed.envs ?? []);
        } catch {
          reject(new Error(`Failed to parse API response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}
