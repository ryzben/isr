# IslamicSchoolReview.com

A directory and review platform for Islamic schools across the United States. Helps Muslim families find, compare, and evaluate Islamic schools by state, city, and grade level.

**Live site:** [www.islamicschoolreview.com](https://www.islamicschoolreview.com)
**GitHub:** [ryzben/isr](https://github.com/ryzben/isr) — Vercel auto-deploys on every push to `master` AND `main`

---

## Current state (as of June 2026)

- **35 schools** across FL, TX, CA, NY, NJ, IA
- Reviews are live and real end-to-end — school pages, the directory, and the homepage all pull actual Supabase review data (no more "coming soon" placeholders anywhere reviews should show)
- Claim Your School form at `/claim`
- Jobs board waitlist at `/jobs`
- Admin dashboard fully functional (publish, edit, delete, approve submissions)
- Auth working (signup, signin, forgot password, account page) — see **Pending** below for the one real gap (email delivery)
- Homepage search uses dynamic state/city dropdowns from Supabase
- Account page (`/account`) now has working password change, TOTP two-factor setup, a JSON data export, and inline review editing
- Newsletter sign-up (footer + homepage + blog sidebar) is wired to Formspree and actually captures emails
- Homepage prayer times widget pulls live data from the Aladhan API
- Compare tray on `/directory` works — "+ Compare" on a result card now actually adds it to the floating compare bar

### Pending before full launch
- [ ] Set up Resend SMTP (see Auth section below) — Supabase's default mailer is capped at ~2 emails/hour, so signup confirmation and password-reset emails are unreliable. Confirmed via DNS on 2026-06-21 that Resend has not been set up yet (no `resend._domainkey` TXT record, SPF only includes Hostinger).
- [ ] Customize email templates in Supabase → Auth → Email Templates
- [ ] Replace "Ibrahim Karim" placeholder on About page with real team member
- [ ] Test the new TOTP two-factor enrollment flow on `/account` end-to-end with a real account + authenticator app (built this session but not yet verified live — see June 2026 work below)

---

## Work done — June 2026 session

**Site audit fixes** (fake/stale content, broken links, data accuracy):
- Replaced fabricated About-page stats (2,400+ schools, 18,000 reviews, etc.) with real numbers
- Fixed the live school/state count everywhere it was hardcoded (was stuck at 33, corrected to 35 schools / 6 states across about.html, index.html, directory.html's JSON-LD and noscript fallback)
- Found and fixed real data corruption in Supabase: ~10 schools had wrong city/state (e.g. a NJ school tagged as being in CA) from a bad original import; ran a corrected `supabase-fix-schools.sql` and removed two leftover duplicate rows that turned out to be seed/test data (giveaway: identical-microsecond timestamps and `555-` fake phone numbers)
- Normalized canonical/`og:url` tags to drop `.html` (matches `vercel.json`'s `cleanUrls`)
- Added a static `<noscript>` fallback to `/directory` for crawlers and no-JS visitors
- Removed a stray "Example" badge job listing from the homepage jobs feed
- Removed footer links to directory views that can't actually be filtered yet (e.g. "Top-rated schools")
- Fixed dead `href="#"` links and fabricated per-user account details (fake "Last changed 58 days ago", fake "2 devices signed in") across about.html, blog.html, and account.html
- Connected the homepage prayer-times widget to the real Aladhan API instead of static placeholder times

**Reviews were already live but mislabeled "coming soon" almost everywhere except the school page itself** — fixed:
- Homepage's 3 featured-school rating blocks and the entire `/directory` result list now show real per-school average ratings and review counts (new `assets/featured-ratings.js`)
- Rewrote the homepage's "Reviews — coming soon" section, since reviews have been open since launch
- blog-post.html's related-schools block was showing 3 entirely fabricated schools with fake star ratings — replaced with real schools and honest "No reviews yet" wording

**Built real functionality instead of fake placeholders**, per a "everything listed on the site should work" pass:
- Newsletter forms (footer, homepage hero, blog sidebar) now POST to the existing Formspree endpoint via AJAX with inline success state — previously all of them did nothing
- `/account` settings: real password change (`supabase.auth.updateUser`), real TOTP 2FA enrollment (`supabase.auth.mfa`), real "download my data" JSON export, and real inline review editing (the owner-scoped RLS policy already existed — it just had no UI). Removed the "Active sessions" row entirely since listing sessions requires the Supabase Admin API, which isn't available client-side
- blog-post.html's fake "Checklist PDF — coming soon" button now opens a real print-friendly checklist via the browser's print-to-PDF

**Two real bugs found only by running the site in a browser (Playwright), not by reading the code:**
- `/account` was completely broken — `const supabase = window.supabase.createClient(...)` collided with the global `window.supabase` the SDK itself sets, throwing a `SyntaxError` that silently killed the entire inline script block. Profile loading, favorites, reviews, sign-out — none of it ever ran. Renamed the local client to `sb` throughout.
- `/directory`'s compare tray had working CSS/JS but the actual `#compareTray` markup and `.compare-btn` elements were never added to the page, throwing a `pageerror` on every load. Added the missing tray markup and a working "+ Compare" button on each result card.

---

## Tech stack

| Layer | Tool |
|---|---|
| Hosting | Vercel (auto-deploy from GitHub `master` + `main`) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage (`school-photos` bucket) |
| Forms | Formspree (school submissions + claim requests) |
| Fonts | Google Fonts (Inter + Fraunces) |

No build step — plain HTML, CSS, and vanilla JS.

---

## Project structure

```
islamicschoolreview/
├── index.html                    # Homepage — dynamic state/city search from Supabase
├── directory.html                # School directory with state/city/grade filters
├── school.html                   # School detail page — reviews, photos, claim button
├── add-school.html               # Public submission form → Formspree + Supabase inbox
├── admin.html                    # Admin dashboard (password: isr-admin-2026)
├── claim.html                    # Claim Your School form → Formspree + verified badge
├── jobs.html                     # Jobs board waitlist page (full launch Q3 2026)
├── signin.html                   # Sign in + forgot password (Supabase recover endpoint)
├── signup.html                   # Create account
├── account.html                  # User dashboard (saved schools, reviews, settings)
├── write-review.html             # Review form — requires sign-in, saves to Supabase
├── about.html                    # About page — team, editorial policy
├── blog.html                     # Resources / guides
├── contact.html
├── privacy.html / terms.html
├── assets/
│   ├── styles.css                # Global design system
│   ├── main.js                   # Nav, mobile menu, shared UI
│   ├── schools-data.js           # Data layer — fetches from Supabase REST API
│   └── images/schools/           # Curated school photos served from Vercel
│       ├── al-furqan-academy/    # AFA1.jpg, AFA2.jpg, AFA3.jpg
│       └── my-academy/           # MYA1.jpg, MYA2.jpg, MYA3.jpg
├── vercel.json                   # Clean URLs, redirects, security headers, caching
├── _redirects                    # Non-www → www (keeps Formspree domain valid)
│
│── SQL files (run in Supabase SQL Editor in this order):
├── supabase-schema.sql           # Core schema — run once on new project
├── user-auth-setup.sql           # RLS for user_profiles, favorites, reviews
├── supabase-submissions.sql      # school_submissions table + RLS
├── supabase-admin-policies.sql   # UPDATE + DELETE + INSERT policies for schools
├── supabase-add-lighthouse.sql   # Adds The Lighthouse Schools + INSERT policy fix
├── supabase-fix-schools.sql      # Fixes wrong city/state data for the original 33 schools — run June 2026
├── supabase-sample-reviews.sql   # Sample parent reviews for AFA + MY Academy
└── supabase-lighthouse-reviews.sql # Sample parent reviews for The Lighthouse Schools
```

---

## Database schema (Supabase)

### `schools`
| Column | Type | Notes |
|---|---|---|
| id | text (PK) | URL slug e.g. `al-furqan-academy` |
| name | text | |
| city | text | |
| state | text | 2-letter code |
| address | text | |
| phone | text | |
| website | text | |
| grades | text | e.g. `PreK-12` |
| tuition_range | text | |
| description | text | |
| photo_url | text | Main image URL (hosted on Vercel or external) |
| accreditation | text | |
| enrollment | text | |
| verified | boolean | Shows verified badge in directory |

### `school_submissions`
Stores public submissions from `add-school.html` for admin review in Pending tab.

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| school_name, city, state | text | Required |
| phone, website, description | text | Optional |
| contact_name, contact_email | text | Submitter's info |
| programs | text | Comma-separated |
| photo_url_1/2/3 | text | Supabase Storage public URLs |
| status | text | `pending` / `published` / `rejected` |
| created_at | timestamptz | |

### `reviews`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| school_id | text (FK → schools) | |
| user_id | uuid | Supabase Auth user UUID |
| user_name, user_email | text | |
| rating | integer | 1–5 |
| title, content | text | |
| verified_parent | boolean | |
| created_at | timestamptz | |

### `user_profiles` / `user_favorites`
User-specific data protected by RLS — each user can only read/write their own rows.

---

## Key flows

### School submission (`add-school.html`)
1. Visitor fills the form + selects up to 3 photos
2. Photos upload to Supabase Storage `school-photos/submissions/…`
3. Form POSTs to Formspree → admin email with all details + photo URLs
4. Submission also saved to `school_submissions` (status = `pending`)
5. Admin opens `/admin` → Pending tab → one-click approve/reject

### Claim a listing (`claim.html`)
- Linked from "Claim this listing →" on every unverified school page
- Pre-fills school name from URL params (`?school_id=&school_name=`)
- Submits to Formspree → admin manually verifies + sets `verified = true` in Supabase

### Admin dashboard (`admin.html`)
- Password: `isr-admin-2026` — **change this before wider sharing**
- **Add School** — manual publish directly to Supabase
- **All Schools** — list with Edit (PATCH) and Delete buttons
- **Pending** — submissions inbox, red badge count, one-click approve

### Reviews (`school.html` + `write-review.html`)
- Each school detail page loads reviews from Supabase and shows avg rating
- "Be the first to review" CTA shown if no reviews exist
- Writing a review requires sign-in (`isr_session`)
- Reviews INSERT policy: `auth.jwt() ->> 'sub' IS NOT NULL`

### Auth flow
- `signup.html` → `supabase.co/auth/v1/signup` → user gets confirmation email
- `signin.html` → `supabase.co/auth/v1/token` → stores as `isr_session` in localStorage
- `account.html` → reads `isr_session`, calls `supabase.auth.setSession()` before SDK queries
- **Forgot password** → `supabase.co/auth/v1/recover` → Supabase sends reset email

---

## Git / deployment

Two branches matter:
- `master` — all active development, push here
- `main` — Vercel production branch

**Always push to both:**
```
git push origin master
git push origin master:main
```

The branches have unrelated histories (force-pushed to sync). Always push to both or production won't update.

---

## Supabase Storage

**Bucket:** `school-photos` (public)
**INSERT policy:** anon allowed with `bucket_id = 'school-photos'`
**Upload path:** `submissions/{timestamp}_{index}.{ext}`

Note: direct file uploads from scripts require the service_role key (not anon). For curated school photos, commit them to `assets/images/schools/{school-id}/` and reference via absolute URL.

---

## Email (critical for production)

Supabase free tier = **~2 emails/hour**. This breaks signup confirmation and password reset.

**Fix: set up Resend (free, 3,000 emails/month)**
1. Create account at resend.com
2. Verify domain `islamicschoolreview.com` (add DNS TXT records)
3. Supabase → Project Settings → Auth → SMTP Settings:
   - Host: `smtp.resend.com` · Port: `465`
   - Username: `resend` · Password: your Resend API key
   - Sender: `noreply@islamicschoolreview.com`
4. Supabase → Auth → Email Templates → customize confirmation + reset emails

---

## First-time setup (new environment)

Run these SQL files in Supabase SQL Editor **in order:**

```
1. supabase-schema.sql
2. user-auth-setup.sql
3. supabase-submissions.sql
4. supabase-admin-policies.sql
5. supabase-add-lighthouse.sql      ← also restores INSERT policy if missing
6. supabase-fix-schools.sql         ← fixes city/state data
7. supabase-sample-reviews.sql      ← sample reviews for AFA + MY Academy
8. supabase-lighthouse-reviews.sql  ← sample reviews for Lighthouse
```

Then:
- Create Supabase Storage bucket `school-photos` (public) with anon INSERT policy
- Connect `ryzben/isr` repo to Vercel, root directory = `islamicschoolreview/`
- Set Vercel production branch to `master` (Project Settings → Git)
- Add Formspree form ID to `add-school.html` and `claim.html`
- Set up Resend SMTP (see Email section above)

---

## Schools currently listed

| State | Count | Notes |
|---|---|---|
| Florida | 13 | AFA + MY Academy have real photos and sample reviews |
| Texas | 11 | City/state data corrected (June 2026) |
| New York | 4 | Includes Muslim Center School (added since launch) |
| California | 3 | |
| New Jersey | 3 | |
| Iowa | 1 | The Lighthouse Schools — boarding school, Clinton IA |
| **Total** | **35** | |
