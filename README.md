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

The **Open Source** block on the homepage loads from the public GitHub API for [@ATKasem](https://github.com/ATKasem):

- **Merged** — pull requests I authored that were merged into other people's repos
- **Open PRs** — my currently open pull requests upstream
- **Also on GitHub** — public non-fork repos that are not already in the curated Work section

Results are cached in `sessionStorage` for about 30 minutes per visitor. New merges, open PRs, and repos show up automatically — you do not need to redeploy the site for GitHub activity to appear.

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
