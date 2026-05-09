# IslamicSchoolReview.com

A directory and review platform for Islamic schools across the United States. Helps Muslim families find, compare, and evaluate Islamic schools by state, city, and grade level.

**Live site:** [www.islamicschoolreview.com](https://www.islamicschoolreview.com)

---

## Tech stack

| Layer | Tool |
|---|---|
| Hosting | Vercel |
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
├── index.html          # Homepage
├── directory.html      # School directory with state/grade filters
├── school.html         # Individual school detail page
├── add-school.html     # Public school submission form (→ Formspree email)
├── admin.html          # Admin dashboard — publish/delete schools in Supabase
├── signin.html         # Sign in (Supabase Auth, stores session as isr_session)
├── signup.html         # Create account
├── account.html        # User dashboard (saved schools, reviews, settings)
├── compare.html        # Side-by-side school comparison
├── blog.html           # Resources / guides
├── about.html
├── contact.html
├── privacy.html
├── terms.html
├── assets/
│   ├── styles.css      # Global design system (CSS variables, components)
│   ├── main.js         # Nav, mobile menu, shared UI
│   └── schools-data.js # Data layer — fetches schools from Supabase REST API
├── vercel.json         # Routing, redirects, security headers, cache rules
├── supabase-schema.sql # Database schema (run once in Supabase SQL editor)
├── user-auth-setup.sql # RLS policies for user_profiles, favorites, reviews
└── _redirects          # Redirects (non-www → www for Formspree domain match)
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

### `user_profiles`
Stores display name, user type (parent / educator / school admin), and email. Created automatically on signup via Supabase trigger.

### `user_favorites` / `user_reviews`
User-specific data protected by RLS — each user can only read and write their own rows.

---

## How school listings work

### Public submission (`add-school.html`)
1. Visitor fills out the form (school info, contact, programs, up to 3 photos)
2. Photos upload to Supabase Storage (`school-photos/submissions/…`) and return public URLs
3. Form submits to Formspree — admin receives an email with all details + photo links
4. Admin manually reviews and publishes via the admin dashboard

### Admin publishing (`admin.html`)
- Protected by a hardcoded password (`isr-admin-2026`) — change this before sharing widely
- **Add School tab** — fills a form and POSTs directly to the Supabase `schools` table
- **All Schools tab** — lists every school with a Delete button

---

## Auth flow

- `signup.html` → POSTs to `supabase.co/auth/v1/signup`, stores nothing locally (user gets a confirmation email)
- `signin.html` → POSTs to `supabase.co/auth/v1/token`, stores session in `localStorage` as `isr_session` (`{ access_token, refresh_token, user, expires_at }`)
- `account.html` → reads `isr_session`, calls `supabase.auth.setSession()` to bridge tokens into the SDK before making authenticated queries

---

## Supabase Storage

**Bucket:** `school-photos` (public)

**Policy:** INSERT allowed for all roles (anon) — lets unauthenticated visitors upload photos from the add-school form.

Photo upload path: `submissions/{timestamp}_{index}.{ext}`

---

## Deployment

The site deploys automatically from the `islamicschoolreview` directory via Vercel.

```
vercel --prod
```

`vercel.json` handles:
- Clean URLs (no `.html` extension)
- Non-www → www redirect (keeps Formspree domain validation working)
- Security headers (HSTS, X-Frame-Options, CSP)
- Long-term caching for `/assets/`

---

## First-time setup

1. **Supabase** — run `supabase-schema.sql` then `user-auth-setup.sql` in the SQL editor
2. **Supabase Storage** — create a public bucket named `school-photos`, add an INSERT policy for anon role with condition `bucket_id = 'school-photos'`
3. **Formspree** — create a form, copy the form ID into `add-school.html` (`action="https://formspree.io/f/{id}"`)
4. **Vercel** — connect the repo, set root directory to `islamicschoolreview/`, deploy
