#!/usr/bin/env node
/**
 * Build-time snapshot of @ATKasem GitHub activity for the portfolio.
 * Uses GITHUB_TOKEN in Actions (high rate limits). Writes data/github.json.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const USER = 'ATKasem';
const PR_LIMIT = 100;
const REPO_LIMIT = 8;
const HIDDEN_REPOS = new Set([
  'QAToolProject',
  'SalesIQ-Agent-Project-',
  'Frontend-API-Drag-Drop-project',
  'PCPartWebsite',
  'Portfolio',
  'Aaron-s-learning',
  '2024-web-dev-projects',
  'Aarons-portfolio',
  'Aarons-Portfolio',
]);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = join(root, 'data', 'github.json');
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'ATKasem-Portfolio-sync',
};
if (token) headers.Authorization = `Bearer ${token}`;

async function gh(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${url}\n${body.slice(0, 400)}`);
  }
  return res.json();
}

function repoFullName(item) {
  if (item.repository_url) {
    return item.repository_url.replace('https://api.github.com/repos/', '');
  }
  const m = (item.html_url || '').match(/github\.com\/([^/]+\/[^/]+)/);
  return m ? m[1] : 'unknown';
}

async function searchPrs(extraQuery) {
  const q = encodeURIComponent(
    `author:${USER} type:pr ${extraQuery} -user:${USER}`
  );
  const data = await gh(
    `https://api.github.com/search/issues?q=${q}&sort=updated&order=desc&per_page=${PR_LIMIT}`
  );
  return {
    total: data.total_count || 0,
    items: (data.items || []).map((item) => ({
      title: item.title,
      html_url: item.html_url,
      repo: repoFullName(item),
      date:
        item.pull_request?.merged_at ||
        item.closed_at ||
        item.updated_at ||
        item.created_at,
    })),
  };
}

async function fetchOtherRepos() {
  const repos = await gh(
    `https://api.github.com/users/${USER}/repos?sort=updated&per_page=100`
  );
  return (repos || [])
    .filter((r) => !r.fork && !r.private && !HIDDEN_REPOS.has(r.name))
    .slice(0, REPO_LIMIT)
    .map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      html_url: r.html_url,
      stars: r.stargazers_count || 0,
      pushed_at: r.pushed_at,
    }));
}

const [merged, open, repos] = await Promise.all([
  searchPrs('is:merged'),
  searchPrs('is:open'),
  fetchOtherRepos(),
]);

const payload = {
  fetchedAt: Date.now(),
  merged,
  open,
  repos,
};

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(
  `Wrote ${outFile} (merged=${merged.total}, open=${open.total}, repos=${repos.length})`
);
