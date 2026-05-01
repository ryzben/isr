# IslamicSchoolReview.com — Project Handoff for Claude Code

## Project Overview

**IslamicSchoolReview.com** is a static HTML/CSS/JS website for discovering and reviewing Islamic schools across the United States. It serves two audiences: **parents** looking for schools, and **Islamic schools** wanting to be listed and found.

The site is live at **https://islamicschoolreview.com**, deployed via **Vercel**, with the source code hosted on **GitHub**. The working/deployed folder is `islamicschoolreview-deploy/`.

---

## Tech Stack

- **Frontend:** Pure HTML, CSS, JavaScript (no framework, no bundler)
- **Hosting:** Vercel (connected to GitHub — push to main triggers auto-deploy)
- **Form backend:** Formspree (free tier)
  - New school submissions: `https://formspree.io/f/mjglvggk`
  - Claim existing listing: `https://formspree.io/f/xvzlozgn`
- **Data:** `data/schools.json` (33 schools) — flat JSON array, no database yet
- **Fonts:** Google Fonts — Fraunces (headings) + Inter (body)
- **CSS:** Single stylesheet at `assets/styles.css` with CSS custom properties (design tokens)

---

## Folder Structure

```
islamicschoolreview-deploy/
├── index.html              # Homepage — hero search, stats, school cards, school CTA banner
├── directory.html          # Full school directory with filters (state, grade, search)
├── school.html             # Individual school profile page (JS-rendered from schools.json)
├── add-school.html         # School onboarding form (add new + claim existing listing)
├── compare.html            # Side-by-side school comparison
├── blog.html               # Blog/resources listing
├── blog-post.html          # Single blog post template
├── jobs.html               # Job board for Islamic school positions
├── membership.html         # Membership tier pricing page
├── contact.html            # Contact page with team routing
├── about.html              # About page
├── account.html            # User account page (not yet functional)
├── signin.html             # Sign in page (coming soon — not functional)
├── signup.html             # Sign up page (coming soon — not functional)
├── write-review.html       # Parent review submission form
├── confirmation.html       # Generic confirmation/thank you page
├── privacy.html            # Privacy policy
├── terms.html              # Terms of service
├── favicon.svg             # Site favicon
├── assets/
│   ├── styles.css          # Master stylesheet with CSS design tokens
│   ├── main.js             # Shared JS (nav highlighting, compare tray, view toggles)
│   └── schools-data.js     # Data access module — currently reads data/schools.json,
│                           # built to swap to Airtable API (config block at top of file)
├── data/
│   └── schools.json        # 33 schools — FL, TX, CA, NY, NJ
├── schools-import.csv      # CSV ready to import into Airtable (all 33 schools)
└── Pics/                   # Real school photos
    ├── AFA_JAX_FL/         # Al-Furqan Academy photos
    └── MY_Academy_JAX_FL/  # MY Academy photos
```

---

## Design System

All colors, spacing, and radii are CSS custom properties in `assets/styles.css`:

```css
--primary:       #0F5132   /* ISR green — nav, buttons, links */
--primary-hover: #0B3D25
--primary-soft:  #DDEBE2   /* light green backgrounds */
--accent:        #B8823A   /* warm amber — stars, quotes */
--cta:           #EA580C   /* orange — hero search button, "Add School" nav button */
--bg:            #FAF7F2   /* warm off-white page background */
--surface:       #FFFFFF
--ink:           #1C1917   /* body text */
--muted:         #78716C
```

Button classes: `btn--primary` (green), `btn--cta` (orange), `btn--ghost`, `btn--accent` (amber), `btn--sm`, `btn--lg`, `btn--block`.

---

## Key Pages & How They Work

### `school.html`
- Single template rendered by JavaScript from URL param `?id=school-slug`
- Reads school data via `assets/schools-data.js`
- Shows a "Claim this listing" amber banner for unverified schools
- The claim button links to `add-school.html?mode=claim&school=School+Name`

### `assets/schools-data.js`
- ES module — exported functions: `getSchools()`, `getSchoolById()`, `uniqueStates()`, `uniqueCities()`, `filterSchools()`, `sortDefault()`
- **Currently:** reads from `data/schools.json`
- **Airtable ready:** has a config block at the top with `AIRTABLE.token` and `AIRTABLE.baseId` placeholders. When filled in, the module switches to Airtable API automatically. Falls back to JSON if placeholders are still set.
- Handles Airtable pagination automatically (100 records/page)

### `add-school.html`
- Two modes toggled by URL param `?mode=claim` or `?mode=add` (defaults to claim)
- School name auto-fills from URL param `?school=School+Name`
- Uses Formspree for form submission (AJAX, shows success screen on completion)
- Photo field is a link field (Google Drive/Dropbox URL) — Formspree free plan does not support file uploads

### `index.html`
- Has a dark green "For Schools" CTA banner section with school count and benefits list
- Links to `add-school.html?mode=add` (add new) and `add-school.html?mode=claim` (claim existing)

---

## Navigation

Every page has:
- **Nav bar:** Directory | Resources | Jobs | Membership | Community | About + orange "Add School" button
- **Footer:** 4-column grid with links, newsletter signup form, copyright

The "Sign in — coming soon" button has been **removed** from all pages until auth is ready.

---

## Data: schools.json Schema

```json
{
  "id": "al-furqan-academy",        // URL slug
  "name": "Al-Furqan Academy",
  "city": "Jacksonville",
  "state": "FL",
  "address": "2333 Saint Johns Bluff Road South, Jacksonville, FL 32246",
  "phone": "(904) 645-0810",
  "website": "https://alfurqanacademy.org",
  "grades": "PreK–12",
  "tuition_range": "$9,300/yr",     // null if unknown
  "description": "...",
  "photo_url": "https://...",       // Unsplash or real photo URL
  "verified": true                  // true = verified by ISR team
}
```

33 schools across: FL (13), TX (9), CA (3), NY (3), NJ (3).

---

## Airtable Integration (Next Step — Not Yet Active)

A CSV (`schools-import.csv`) with all 33 schools is ready to import into Airtable.

**To activate Airtable:**
1. Create Airtable base named "Islamic School Review", table named "Schools"
2. Import `schools-import.csv`
3. Add a `status` field (single select: `published` / `pending` / `draft`) — set all to `published`
4. Create a read-only API token at https://airtable.com/create/tokens
5. In `assets/schools-data.js`, fill in:
   ```js
   const AIRTABLE = {
     token:  "YOUR_AIRTABLE_TOKEN",
     baseId: "YOUR_BASE_ID",        // looks like appXXXXXXXXXXXXXX
     table:  "Schools",
   };
   ```
6. The site will immediately read from Airtable instead of JSON — no other code changes needed.

---

## What Is NOT Yet Built

| Feature | Status | Notes |
|---|---|---|
| User login / register | ❌ Not built | Pages exist (signin.html, signup.html) but are placeholders |
| User accounts | ❌ Not built | account.html is a visual mockup only |
| Real reviews system | ❌ Not built | write-review.html exists but reviews aren't stored anywhere |
| Payment / Stripe | ❌ Not built | membership.html shows tiers but no checkout |
| School admin dashboard | ❌ Not built | Schools can't log in to edit their own listing yet |
| Airtable integration | ⏳ Configured, not activated | Awaiting API token from user |
| Email notifications | ✅ Via Formspree | Form submissions email the owner |

---

## Deployment Workflow

1. Edit files in `islamicschoolreview-deploy/` folder
2. Commit via GitHub Desktop
3. Push to `main` → Vercel auto-deploys in ~30 seconds
4. **Important:** Also sync changes to the parent `islamicschoolreview/` folder to keep both in sync

---

## Contact / Owner

- Owner email: ryzben@gmail.com
- Schools email: schools@islamicschoolreview.com
- Editorial: editorial@islamicschoolreview.com
- Press: press@islamicschoolreview.com
