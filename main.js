/* Aaron Thomas — Portfolio interactions */
(() => {
  'use strict';

  const nav = document.getElementById('nav');
  const burger = document.querySelector('.nav__burger');
  const progress = document.querySelector('.scroll-progress');
  const year = document.getElementById('year');

  if (year) year.textContent = new Date().getFullYear();

  /* Sticky nav state + scroll progress */
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 20);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  if (burger) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('.nav__links a').forEach((a) =>
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* Scroll reveal */
  let revealObserver = null;
  const observeReveal = (nodes) => {
    const list = nodes instanceof NodeList || Array.isArray(nodes)
      ? Array.from(nodes)
      : [nodes];
    if ('IntersectionObserver' in window) {
      if (!revealObserver) {
        revealObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) {
                e.target.classList.add('is-in');
                revealObserver.unobserve(e.target);
              }
            });
          },
          { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
        );
      }
      list.forEach((el, i) => {
        if (!(el instanceof Element) || el.classList.contains('is-in')) return;
        el.style.transitionDelay = Math.min(i * 60, 240) + 'ms';
        revealObserver.observe(el);
      });
    } else {
      list.forEach((el) => el.classList.add('is-in'));
    }
  };

  observeReveal(document.querySelectorAll('.reveal'));

  /* Subtle parallax on hero orbs */
  const orbs = document.querySelectorAll('.orb');
  if (window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      orbs.forEach((orb, i) => {
        const depth = (i + 1) * 12;
        orb.style.transform = `translate3d(${x * depth}px, ${y * depth}px, 0)`;
      });
    }, { passive: true });
  }

  /* =========================================================
     Live GitHub — merged PRs, open PRs, other repos
     ========================================================= */
  const GITHUB_USER = 'ATKasem';
  const CACHE_KEY = 'atkasem-github-oss-v1';
  const CACHE_TTL_MS = 30 * 60 * 1000;
  const PR_LIMIT = 12;
  const REPO_LIMIT = 8;

  /* Curated Work + learning noise — excluded from "Also on GitHub" */
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

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const relativeTime = (iso) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const sec = Math.round(diff / 1000);
    if (sec < 60) return 'just now';
    const min = Math.round(sec / 60);
    if (min < 60) return min + 'm ago';
    const hr = Math.round(min / 60);
    if (hr < 48) return hr + 'h ago';
    const day = Math.round(hr / 24);
    if (day < 45) return day + 'd ago';
    const mo = Math.round(day / 30);
    if (mo < 18) return mo + 'mo ago';
    return Math.round(day / 365) + 'y ago';
  };

  const repoFullName = (item) => {
    if (item.repository_url) {
      return item.repository_url.replace('https://api.github.com/repos/', '');
    }
    const m = (item.html_url || '').match(/github\.com\/([^/]+\/[^/]+)/);
    return m ? m[1] : 'unknown';
  };

  const readCache = () => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.fetchedAt || Date.now() - parsed.fetchedAt > CACHE_TTL_MS) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const writeCache = (data) => {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      /* quota / private mode — ignore */
    }
  };

  const ghFetch = async (url) => {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (res.status === 403 || res.status === 429) {
      const err = new Error('rate_limited');
      err.code = 'rate_limited';
      throw err;
    }
    if (!res.ok) {
      const err = new Error('fetch_failed');
      err.code = 'fetch_failed';
      throw err;
    }
    return res.json();
  };

  const searchPrs = async (extraQuery) => {
    const q = encodeURIComponent(
      `author:${GITHUB_USER} type:pr ${extraQuery} -user:${GITHUB_USER}`
    );
    const data = await ghFetch(
      `https://api.github.com/search/issues?q=${q}&sort=updated&order=desc&per_page=${PR_LIMIT}`
    );
    return {
      total: data.total_count || 0,
      items: (data.items || []).map((item) => ({
        title: item.title,
        html_url: item.html_url,
        repo: repoFullName(item),
        date: item.pull_request?.merged_at || item.closed_at || item.updated_at || item.created_at,
      })),
    };
  };

  const fetchOtherRepos = async () => {
    /* per_page=100 so original projects are not buried under contribution forks */
    const repos = await ghFetch(
      `https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=100`
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
  };

  const renderPrList = (el, items, kind) => {
    if (!el) return;
    if (!items.length) {
      el.innerHTML = `<li class="oss__empty">No ${kind} pull requests yet.</li>`;
      return;
    }
    el.innerHTML = items
      .map((pr) => {
        const badge =
          kind === 'merged'
            ? '<span class="oss__pill oss__pill--merged">Merged</span>'
            : '<span class="oss__pill oss__pill--open">Open</span>';
        return `
          <li class="oss__item">
            <a class="oss__link" href="${escapeHtml(pr.html_url)}" target="_blank" rel="noopener">
              <span class="oss__repo">${escapeHtml(pr.repo)}</span>
              <span class="oss__title">${escapeHtml(pr.title)}</span>
              <span class="oss__meta">
                ${badge}
                <time datetime="${escapeHtml(pr.date)}">${escapeHtml(relativeTime(pr.date))}</time>
              </span>
            </a>
          </li>`;
      })
      .join('');
  };

  const renderRepos = (el, repos) => {
    if (!el) return;
    if (!repos.length) {
      el.innerHTML =
        '<p class="oss__empty">No extra public repos right now. Featured work is above.</p>';
      return;
    }
    el.innerHTML = repos
      .map(
        (r) => `
        <a class="oss__repo-card reveal" href="${escapeHtml(r.html_url)}" target="_blank" rel="noopener">
          <span class="oss__repo-name">${escapeHtml(r.name)}</span>
          <span class="oss__repo-desc">${escapeHtml(r.description || 'No description yet.')}</span>
          <span class="oss__repo-meta">
            ${r.language ? `<span>${escapeHtml(r.language)}</span>` : ''}
            <span>★ ${escapeHtml(r.stars)}</span>
            <span>${escapeHtml(relativeTime(r.pushed_at))}</span>
          </span>
        </a>`
      )
      .join('');
    observeReveal(el.querySelectorAll('.reveal'));
  };

  const showError = (root, message) => {
    const errEl = document.getElementById('oss-error');
    if (errEl) {
      errEl.hidden = false;
      if (message) {
        errEl.innerHTML =
          escapeHtml(message) +
          ` <a href="https://github.com/${GITHUB_USER}" target="_blank" rel="noopener">View profile on GitHub →</a>`;
      }
    }
    if (root) root.setAttribute('aria-busy', 'false');
  };

  const paint = (payload) => {
    const root = document.getElementById('oss-root');
    const mergedEl = document.getElementById('oss-merged');
    const openEl = document.getElementById('oss-open');
    const reposEl = document.getElementById('oss-repos');
    const mergedCount = document.getElementById('oss-merged-count');
    const openCount = document.getElementById('oss-open-count');
    const updated = document.getElementById('oss-updated');
    const errEl = document.getElementById('oss-error');

    if (errEl) errEl.hidden = true;

    renderPrList(mergedEl, payload.merged.items, 'merged');
    renderPrList(openEl, payload.open.items, 'open');
    renderRepos(reposEl, payload.repos);

    if (mergedCount) mergedCount.textContent = String(payload.merged.total);
    if (openCount) openCount.textContent = String(payload.open.total);

    if (updated) {
      updated.hidden = false;
      updated.textContent = ` Updated ${relativeTime(new Date(payload.fetchedAt).toISOString())}.`;
    }

    if (root) root.setAttribute('aria-busy', 'false');
  };

  const loadGithub = async () => {
    const section = document.getElementById('opensource');
    if (!section) return;

    const cached = readCache();
    if (cached) {
      paint(cached);
      return;
    }

    try {
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
      writeCache(payload);
      paint(payload);
    } catch (err) {
      const msg =
        err && err.code === 'rate_limited'
          ? "GitHub rate limit hit for this network."
          : "Couldn't load live GitHub data right now.";
      showError(document.getElementById('oss-root'), msg);

      const mergedEl = document.getElementById('oss-merged');
      const openEl = document.getElementById('oss-open');
      const reposEl = document.getElementById('oss-repos');
      if (mergedEl) mergedEl.innerHTML = '';
      if (openEl) openEl.innerHTML = '';
      if (reposEl) reposEl.innerHTML = '';
    }
  };

  loadGithub();
})();
