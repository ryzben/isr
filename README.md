# IslamicSchoolReview.com

A directory and review platform for Islamic schools across the United States. Helps Muslim families find, compare, and evaluate Islamic schools by state, city, and grade level.

**Live site:** [www.islamicschoolreview.com](https://www.islamicschoolreview.com)

---

## Tech stack

| Layer | Tool |
|---|---|
| Hosting | Vercel (auto-deploy from GitHub) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage (`school-photos` bucket) |
| Forms | Formspree (school submission emails) |
| Fonts | Google Fonts (Inter + Fraunces) |

No build step — plain HTML, CSS, and vanilla JS.

---

## Project structure

```
islamicschoolreview/
├── index.html               # Homepage
├── directory.html           # School directory with state/grade filters
├── school.html              # Individual school detail page + Write a Review button
├── add-school.html          # Public school submission form (Formspree + Supabase inbox)
├── admin.html               # Admin dashboard — publish, edit, delete, approve submissions
├── signin.html              # Sign in (Supabase Auth, stores session as isr_session)
├── signup.html              # Create account
├── account.html             # User dashboard (saved schools, reviews, settings)
├── write-review.html        # Review form — requires sign-in, saves to Supabase
├── compare.html             # Side-by-side school comparison
├── blog.html                # Resources / guides
├── about.html
├── contact.html
├── privacy.html
├── terms.html
├── assets/
│   ├── styles.css           # Global design system (CSS variables, components)
│   ├── main.js              # Nav, mobile menu, shared UI
│   └── schools-data.js      # Data layer — fetches schools from Supabase REST API
├── vercel.json              # Routing, redirects, security headers, cache rules
├── supabase-schema.sql      # Core database schema (run once in Supabase SQL editor)
├── supabase-submissions.sql # school_submissions table + RLS policies
├── supabase-admin-policies.sql # UPDATE + DELETE policies for schools table
├── user-auth-setup.sql      # RLS policies for user_profiles, favorites, reviews
└── _redirects               # Non-www → www redirect (keeps Formspree domain valid)
```

---

## Database schema (Supabase)

### `schools`
| Column | Type | Notes |
|---|---|---|
| id | text (PK) | URL slug, e.g. `al-furqan-academy` |
| name | text | |
| city | text | |
| state | text | 2-letter code |
| address | text | |
| phone | text | |
| website | text | |
| grades | text | e.g. `PreK–12` |
| tuition_range | text | |
| description | text | |
| photo_url | text | Main image URL |
| accreditation | text | |
| enrollment | text | |
| verified | boolean | Shows verified badge in directory |

### `school_submissions`
Stores public school submissions from `add-school.html` for admin review.

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| school_name, city, state | text | Required |
| phone, website, description | text | Optional |
| contact_name, contact_email | text | Submitter's info |
| programs | text | Comma-separated list |
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

### `user_profiles` / `user_favorites`
User-specific data protected by RLS — each user can only read and write their own rows.

---

## How school listings work

### Public submission (`add-school.html`)
1. Visitor fills out the form (school info, contact, programs, up to 3 photos)
2. Photos upload to Supabase Storage (`school-photos/submissions/…`) — public URLs returned
3. Form submits to Formspree — admin receives an email with all details + photo links
4. Submission is also saved to `school_submissions` table with `status = 'pending'`
5. Admin reviews in the **Pending tab** and clicks "Publish to directory" to approve

### Admin dashboard (`admin.html`)
- Password protected (`isr-admin-2026`) — change before sharing widely
- **Add School** — manually enter and publish a school directly to Supabase
- **All Schools** — list every published school with Edit and Delete buttons
- **Pending** — submissions inbox with one-click approve/reject and red badge count
- Edit mode reuses the Add School form; saves via PATCH to Supabase

---

## Auth flow

- `signup.html` → POSTs to `supabase.co/auth/v1/signup`
- `signin.html` → POSTs to `supabase.co/auth/v1/token`, stores session in `localStorage` as `isr_session` (`{ access_token, refresh_token, user, expires_at }`)
- `account.html` → reads `isr_session`, calls `supabase.auth.setSession()` to bridge tokens into the SDK before making authenticated queries
- `write-review.html` → checks `isr_session`, redirects to signin if not logged in, submits review using the user's `access_token`

> **Note:** Supabase's built-in email service has a rate limit of ~2 emails/hour on the free tier.
> For production, set up a custom SMTP provider (e.g. Resend) under Supabase → Auth → SMTP Settings.
> During development, email confirmation can be disabled under Supabase → Auth → Providers → Email.

---

## Supabase Storage

**Bucket:** `school-photos` (public)

**Policy:** INSERT allowed for all roles (anon) — lets unauthenticated visitors upload photos from the add-school form.

**Upload path:** `submissions/{timestamp}_{index}.{ext}`

---

## Deployment

Connected to GitHub (`ryzben/isr`). Vercel auto-deploys on every push to `master`.

`vercel.json` handles:
- Clean URLs (no `.html` extension)
- Non-www → www redirect (keeps Formspree domain validation working)
- Security headers (HSTS, X-Frame-Options, CSP)
- Long-term caching for `/assets/`

---

## First-time setup

1. **Supabase — database**
   - Run `supabase-schema.sql` in the SQL editor
   - Run `user-auth-setup.sql`
   - Run `supabase-submissions.sql`
   - Run `supabase-admin-policies.sql`

2. **Supabase — storage**
   - Create a public bucket named `school-photos`
   - Add an INSERT policy for the anon role: `bucket_id = 'school-photos'`

3. **Supabase — auth**
   - Disable "Confirm email" during development (Auth → Providers → Email)
   - For production: configure a custom SMTP provider (Resend recommended)

4. **Formspree**
   - Create a form, copy the form ID into `add-school.html` (`action="https://formspree.io/f/{id}"`)

5. **Vercel**
   - Connect the `ryzben/isr` GitHub repo
   - Set root directory to `islamicschoolreview/`
   - Deploy
