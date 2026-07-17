# Portfolio

My personal portfolio and blog. I'm Aaron Thomas, a software engineer building AI tools, Go services, and thoughtful web experiences.

I built this as a static site with plain HTML, CSS, and JavaScript. No framework, no build step. The `blog/` section is where I write up the projects I build.

## Structure

```
index.html      Landing page (hero, projects, open source, about, contact)
styles.css      Site styles
main.js         Interactions + live GitHub section
netlify.toml    Free static hosting config
blog/
  index.html    Blog index
  *.html        Individual posts
```

## Live GitHub section

The **Open Source** block on the homepage shows:

- **Contributed to** — rotating companies/orgs marquee inside Open Source
- **Merged** / **Open PRs** — sectioned lists of upstream pull requests
- **Also on GitHub** — public non-fork repos that are not already in the curated Work section

On each deploy, GitHub Actions runs `scripts/sync-github.mjs` and writes `data/github.json` (using the Actions token so visitors are not hit by the unauthenticated Search API limit). The page loads that snapshot. A short `sessionStorage` cache avoids refetch noise for the same visitor.

The Pages workflow also runs on a **schedule every 2 hours**, so merged/open PRs and company chips refresh automatically without you pushing. You can still trigger it anytime with **Actions → Deploy to GitHub Pages → Run workflow**, or by pushing to `main`.

Locally: `GITHUB_TOKEN=$(gh auth token) node scripts/sync-github.mjs`.

Featured Work cards stay hand-written. To hide a repo from **Also on GitHub**, add its name to `HIDDEN_REPOS` in `main.js`.

## Running locally

You can open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000

Serving over HTTP (not `file://`) is recommended so the live GitHub fetch works reliably.

## Deploy for free (Netlify)

This is a static site, so hosting is free. A `netlify.toml` is included that sets the
publish directory and some security headers.

**Recommended — connect the GitHub repo (auto deploy on push):**

1. Push this folder to a GitHub repo (if it is not already there).
2. Go to [app.netlify.com](https://app.netlify.com), sign in, and choose **Add new site → Import an existing project**.
3. Pick the repo. Leave the build command empty and set the publish directory to `.`
   (`netlify.toml` already does this).
4. Deploy. Every push to the main branch redeploys the site.
5. Optional: add a custom domain under **Site settings → Domain management**.

**Quick test — drag and drop:**

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag this whole folder onto the page.
3. It goes live at a `something.netlify.app` address in a few seconds.

Note: drag-and-drop does not auto-update on git push. Prefer the Git-connected flow for an ongoing site.

## Contributors

- [ATKasem](https://github.com/ATKasem) (Aaron Thomas)
