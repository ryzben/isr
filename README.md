# IslamicSchoolReview.com

Static prototype for islamicschoolreview.com. 17 pages, shared CSS/JS, no build step, no dependencies.

## Project layout

```
.
├── prototype/                 # ← deploy this folder as the site root
│   ├── index.html
│   ├── directory.html
│   ├── school.html
│   ├── about.html
│   ├── ... (14 more pages)
│   ├── _headers               # Cloudflare Pages / Netlify headers
│   ├── _redirects             # clean URLs + legacy redirects
│   ├── favicon.svg
│   ├── robots.txt
│   ├── sitemap.xml
│   └── assets/
│       ├── styles.css
│       ├── main.js
│       └── og-image.svg
├── verify_prototype.py        # CI verifier (431 checks)
├── .github/workflows/verify.yml
└── README.md
```

## Local preview

```bash
cd prototype
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy — Cloudflare Pages (recommended)

Free, global CDN, free SSL, auto-deploys on every push.

1. **Push this repo to GitHub** (create a new empty repo on github.com first):
   ```bash
   git remote add origin git@github.com:YOUR_USERNAME/islamicschoolreview.git
   git push -u origin main
   ```

2. **Create a Cloudflare Pages project**:
   - Go to https://dash.cloudflare.com/ → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
   - Select the GitHub repo
   - Build settings:
     - **Framework preset:** None
     - **Build command:** *(leave empty)*
     - **Build output directory:** `prototype`
   - Click **Save and Deploy**

3. **Add the custom domain**:
   - In the Pages project → **Custom domains** → **Set up a custom domain**
   - Enter `islamicschoolreview.com` and `www.islamicschoolreview.com`
   - If your DNS is on Cloudflare, it configures automatically. Otherwise point a CNAME to `<project>.pages.dev`.

Every `git push` to `main` now re-deploys the site in ~30 seconds. Preview URLs appear for every PR.

## Deploy — Netlify (alternate)

1. Push to GitHub as above.
2. netlify.com → **Add new site** → **Import from Git** → pick the repo.
3. Build settings:
   - **Base directory:** *(empty)*
   - **Build command:** *(empty)*
   - **Publish directory:** `prototype`
4. **Domain settings** → **Add custom domain** → follow DNS instructions.

`_headers` and `_redirects` are auto-detected by both hosts.

## Deploy — GitHub Pages (simplest, no host account needed)

1. Repo → **Settings** → **Pages**
2. **Source:** Deploy from a branch → **main** / `/prototype`
3. Add `CNAME` file inside `prototype/` containing `islamicschoolreview.com`
4. Point DNS: apex `A` records to GitHub Pages IPs (185.199.108.153, …109, …110, …111) and `www` CNAME to `YOUR_USERNAME.github.io`.

Note: GitHub Pages won't honor `_headers` or `_redirects` — the clean URLs in `_redirects` will stop working. Cloudflare Pages or Netlify are better here.

## DNS cheat-sheet

| Record | Host | Value | TTL |
|--------|------|-------|-----|
| CNAME (or A/AAAA via Cloudflare proxy) | `@` | Cloudflare Pages project | Auto |
| CNAME | `www` | `<project>.pages.dev` | Auto |

Cloudflare Pages gives you a free `*.pages.dev` subdomain immediately, so you can test before pointing DNS.

## Continuous integration

`.github/workflows/verify.yml` runs `verify_prototype.py` on every push and PR. The verifier checks HTML5 validity, internal link integrity, required meta tags, Schema.org presence, asset paths, and required content strings across all 17 pages. Current baseline: **431 PASS / 0 FAIL**.

## Editing

No build step. Edit the HTML/CSS/JS directly and push. Cloudflare Pages or Netlify rebuild in seconds.

## Things to wire up before going public

- Replace `confirmation.html` form-only flow with a real form backend (Formspree, Cloudflare Pages Functions, or Netlify Forms).
- Set up analytics (Cloudflare Web Analytics is free and cookieless — paste the snippet into every `<head>`).
- Decide on a review-moderation workflow before enabling `write-review.html` in production.
- Claim/verify the real schools listed in the directory (currently all in "Preview listing" state).
