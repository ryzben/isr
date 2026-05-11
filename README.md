# IslamicSchoolReview.com

A directory and review platform for Islamic schools across the United States. Helps Muslim families find, compare, and evaluate Islamic schools by state, city, and grade level.

**Live site:** [www.islamicschoolreview.com](https://www.islamicschoolreview.com)
**GitHub:** [ryzben/isr](https://github.com/ryzben/isr) — Vercel auto-deploys on every push to `master` AND `main`

---

## Current state (as of May 2026)

- **34 schools** across FL, TX, CA, NY, NJ, IA
- Reviews section live on school detail pages (sample reviews in Supabase SQL files below)
- Claim Your School form at `/claim`
- Jobs board waitlist at `/jobs`
- Admin dashboard fully functional (publish, edit, delete, approve submissions)
- Auth working (signup, signin, forgot password, account page)
- Homepage search uses dynamic state/city dropdowns from Supabase

### Pending before full launch
- [ ] Run `supabase-sample-reviews.sql` — adds sample reviews for AFA + MY Academy
- [ ] Run `supabase-lighthouse-reviews.sql` — adds sample reviews for The Lighthouse Schools
- [ ] Run `supabase-fix-schools.sql` — fixes wrong city/state data on 30+ schools
- [ ] Set up Resend SMTP (see Auth section below) — fixes email confirmation + password reset
- [ ] Customize email templates in Supabase → Auth → Email Templates
- [ ] Replace "Ibrahim Karim" placeholder on About page with real team member

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
├── supabase-fix-schools.sql      # Fixes wrong city/state data for all 33 schools
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
| Texas | 11 | Data from schools.json — run supabase-fix-schools.sql to correct |
| California | 4 | |
| New York | 3 | |
| New Jersey | 3 | |
| Iowa | 1 | The Lighthouse Schools — boarding school, Clinton IA |
| **Total** | **34** | |
