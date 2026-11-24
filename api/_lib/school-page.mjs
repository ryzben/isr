// Shared HTML templates for the static SEO pages (scripts/generate-seo-pages.mjs)
// and the on-demand school pages (api/school-page.mjs). Keep both callers on
// this one copy so /schools/<slug> looks the same however it is produced.
//
// Self-contained on purpose: assets/schools-data.js is an ES module in a .js
// file with no package.json "type", which only loads on Node versions that
// auto-detect ESM. The three helpers below are copies; keep them in sync with
// assets/schools-data.js.

export function schoolSlug(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function schoolPagePath(id) {
  const schoolId = schoolSlug(id);
  return schoolId ? `schools/${schoolId}` : "directory";
}

// A school's photos as [{url, alt, logo}], cover first (max 3, http(s) only).
// Falls back to the single photo_url for schools whose photos list is empty.
// Keep in sync with the copies in school.html and admin.html.
export function schoolPhotos(school) {
  const isHttp = (u) => /^https?:\/\//i.test(String(u || ""));
  const list = Array.isArray(school?.photos) && school.photos.length
    ? school.photos
    : (school?.photo_url ? [{ url: school.photo_url }] : []);
  return list
    .filter((p) => p && isHttp(p.url))
    .slice(0, 3)
    .map((p, i) => ({
      url: String(p.url),
      alt: String(p.alt || "").trim() || `${school.name || "School"} photo ${i + 1}`,
      logo: p.logo === true,
    }));
}

export function normalizeSchool(school) {
  const description = String(school.description || "");
  const enrollment = description.match(/\b(?:serves|serving|with)\s+([\d,]+\+?)\s+students?\b/i);
  const accreditation = description.match(/\b(?:accredited by|accreditation(?:s)?(?: include|:)?)[\s:]+(.+?)(?=,?\s+with\s+[\d,]+\+?\s+students?\b|[.;]|$)/i);

  return {
    ...school,
    enrollment: school.enrollment || (enrollment ? `${enrollment[1]} students` : ""),
    accreditation: school.accreditation || accreditation?.[1]?.trim() ||
      (school.id === "al-furqan-academy" ? "ICNEF, FCIS, CISNA" : ""),
  };
}

export const SITE = "https://www.islamicschoolreview.com";
export const MIN_INDEXABLE_WORDS = 60;
// All 50 states + DC (keep in sync with the copy in directory.html).
export const STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

export function contentWordCount(content) {
  const text = content
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|#39);/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (text.match(/[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu) || []).length;
}

export function pageTemplate({ title, description, canonical, content, robots: robotsOverride }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const robots = robotsOverride || (contentWordCount(content) >= MIN_INDEXABLE_WORDS
    ? "index,follow"
    : "noindex,follow");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <base href="/" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}" />
  <meta name="robots" content="${robots}" />
  <link rel="canonical" href="${SITE}${canonical}" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="theme-color" content="#0F5132" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Islamic School Review" />
  <meta property="og:url" content="${SITE}${canonical}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:image" content="${SITE}/assets/og-image.svg" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDescription}" />
  <meta name="twitter:image" content="${SITE}/assets/og-image.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600;6..72,700&amp;family=Public+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/styles.css?v=20261116" />
  <style>
    .seo-content { max-width: 960px; margin: 0 auto; }
    .seo-list { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 16px; margin-top: 24px; }
    .seo-card { padding: 20px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface,#fff); }
    .seo-card h2,.seo-card h3 { margin-top: 0; }
    .seo-details { display: grid; grid-template-columns: minmax(140px,1fr) 2fr; gap: 10px 20px; }
    .seo-details dt { font-weight: 600; color: var(--ink-soft); }
    .seo-details dd { margin: 0; overflow-wrap: anywhere; }
    .seo-gallery { display: grid; grid-template-columns: repeat(auto-fill,minmax(200px,1fr)); gap: 12px; margin: 0 0 24px; padding: 0; list-style: none; }
    .seo-gallery img { display: block; width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: var(--r-md); border: 1px solid var(--line); background: var(--bg,#f4f6f9); }
    .seo-gallery img.is-logo { object-fit: contain; background: #fff; padding: 12px; }
  </style>
</head>
<body>
<script src="/assets/site-chrome.js?v=20261002"></script>
<main id="main">
  <section class="section section--alt"><div class="container seo-content">
    ${content}
  </div></section>
</main>
<div id="site-footer"></div>
<script src="/assets/main.js?v=20261002"></script>
</body>
</html>
`;
}

export function schoolCard(school) {
  const schoolPath = `/${schoolPagePath(school.id)}`;
  const location = [school.city, school.state].filter(Boolean).join(", ");
  const details = [
    school.grades ? `<p>Grades: ${escapeHtml(school.grades)}</p>` : "",
    school.description ? `<p>${escapeHtml(school.description)}</p>` : "",
  ].filter(Boolean);
  return `<article class="seo-card">
    <h3><a href="${schoolPath}">${escapeHtml(school.name)}</a></h3>
    <p class="muted">${escapeHtml(location)}</p>
${details.length ? `    ${details.join("\n    ")}\n` : ""}    <a class="btn btn--ghost btn--sm" href="${schoolPath}">View listing</a>
  </article>`;
}

export function detail(label, value) {
  return `<dt>${escapeHtml(label)}</dt><dd>${value ? escapeHtml(value) : "Not listed"}</dd>`;
}

// Full /schools/<slug> page for one school record.
// Returns { html, canonical, indexable } so the generator can build the sitemap.
export function renderSchoolPage(school) {
  const id = schoolSlug(school.id);
  const location = [school.city, STATE_NAMES[school.state] || school.state].filter(Boolean).join(", ");
  const canonical = `/schools/${id}`;
  const website = /^https?:\/\//i.test(school.website || "")
    ? `<a href="${escapeHtml(school.website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(school.website.replace(/^https?:\/\//i, ""))}</a>`
    : "";
  const email = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(school.email || "")
    ? `<a href="mailto:${escapeHtml(school.email)}">${escapeHtml(school.email)}</a>`
    : "";
  const details = [
    detail("Location", location),
    detail("Grades", school.grades),
    school.programs ? detail("Programs", school.programs) : "",
    detail("Tuition", school.tuition_range),
    detail("Enrollment", school.enrollment),
    detail("Accreditation", school.accreditation),
    school.address ? detail("Address", school.address) : "",
    school.phone ? detail("Phone", school.phone) : "",
    email ? `<dt>Email</dt><dd>${email}</dd>` : "",
    school.website ? `<dt>Website</dt><dd>${website}</dd>` : "",
  ].filter(Boolean).join("\n        ");
  const photos = schoolPhotos(school);
  const gallery = photos.length
    ? `
    <h2>Photos</h2>
    <ul class="seo-gallery">
      ${photos.map((p, i) => `<li><img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.alt)}" loading="${i === 0 ? "eager" : "lazy"}" decoding="async"${p.logo ? ' class="is-logo"' : ""} /></li>`).join("\n      ")}
    </ul>`
    : "";
  const actions = [
    school.city && school.state ? `<a class="btn btn--ghost" href="/cities/${escapeHtml(String(school.state).toUpperCase())}/${schoolSlug(school.city)}">More schools in ${escapeHtml(school.city)}</a>` : "",
    `<a class="btn btn--ghost" href="/school?id=${encodeURIComponent(school.id)}">Open interactive profile</a>`,
    `<a class="btn btn--primary" href="/claim?school_id=${encodeURIComponent(school.id)}&amp;school_name=${encodeURIComponent(school.name)}">Request a listing claim</a>`,
  ].filter(Boolean).join("\n      ");
  const content = `<div class="breadcrumbs"><a href="/">Home</a> · <a href="/directory">Directory</a>${school.state ? ` · <a href="/states/${escapeHtml(String(school.state).toUpperCase())}">${escapeHtml(STATE_NAMES[school.state] || school.state)}</a>` : ""}  ${school.city && school.state ? ` · <a href="/cities/${escapeHtml(String(school.state).toUpperCase())}/${schoolSlug(school.city)}">${escapeHtml(school.city)}</a>` : ""}</div>
    <span class="eyebrow">School listing</span>
    <h1>${escapeHtml(school.name)}</h1>
    <p class="lede">${escapeHtml(location || "Islamic school listing")}. Listing details may change; confirm current information directly with the school.</p>
    <div class="seo-card">
      <h2>Available listing details</h2>
      <dl class="seo-details">
        ${details}
      </dl>
    </div>${gallery}
    <div class="seo-list">
      ${actions}
    </div>`;
  const html = pageTemplate({
    title: `${school.name} in ${location || "the United States"} | Islamic School Review`,
    description: `View available listing details for ${school.name}${location ? ` in ${location}` : ""}. Confirm current information directly with the school.`,
    canonical,
    content,
  });
  return { html, canonical, indexable: contentWordCount(content) >= MIN_INDEXABLE_WORDS };
}

export function renderNotFoundPage({
  heading = "We couldn't find that school",
  lede = "The listing may have been removed or the link may be mistyped.",
} = {}) {
  return pageTemplate({
    title: "School not found | Islamic School Review",
    description: "We could not find this school listing.",
    canonical: "/directory",
    robots: "noindex,follow",
    content: `<span class="eyebrow">School listing</span>
    <h1>${escapeHtml(heading)}</h1>
    <p class="lede">${escapeHtml(lede)}</p>
    <div class="seo-list">
      <a class="btn btn--primary" href="/directory">Browse the directory</a>
      <a class="btn btn--ghost" href="/add-school">List your school</a>
    </div>`,
  });
}

// ---------------------------------------------------------------------------
// State, city and sitemap pages (rendered on request by api/seo-page.mjs)
// ---------------------------------------------------------------------------

export const CORE_SITEMAP_PATHS = [
  "/", "/directory", "/about", "/blog", "/blog-post", "/contact", "/claim",
  "/add-school", "/privacy", "/terms",
];

// Group schools by state and by "STATE/city-slug". The first spelling of a
// city wins when two rows differ only in case/spacing (e.g. "Jacksonville ").
export function groupSchools(schools) {
  const byState = new Map();
  const byCity = new Map();
  for (const school of schools) {
    if (!school.state) continue;
    const state = String(school.state).trim().toUpperCase();
    if (!byState.has(state)) byState.set(state, []);
    byState.get(state).push(school);
    const city = String(school.city || "").trim();
    const citySlug = schoolSlug(city);
    if (!citySlug) continue;
    const key = `${state}/${citySlug}`;
    if (!byCity.has(key)) byCity.set(key, { state, city, schools: [] });
    byCity.get(key).schools.push(school);
  }
  return { byState, byCity };
}

const byName = (a, b) => String(a.name).localeCompare(String(b.name));

export function renderStatePage(state, groups) {
  const records = groups.byState.get(state);
  if (!records) return null;
  const stateName = STATE_NAMES[state] || state;
  const cities = [...groups.byCity.values()].filter((item) => item.state === state)
    .sort((a, b) => a.city.localeCompare(b.city));
  const cityLinks = cities.map((item) => `<li><a href="/cities/${state}/${schoolSlug(item.city)}">${escapeHtml(item.city)}</a></li>`).join("");
  const schoolLinks = records.slice().sort(byName).map(schoolCard).join("");
  const canonical = `/states/${state}`;
  const content = `<div class="breadcrumbs"><a href="/">Home</a> · <a href="/directory">Directory</a> · <span>${escapeHtml(stateName)}</span></div>
    <span class="eyebrow">Browse by state</span>
    <h1>Islamic schools in ${escapeHtml(stateName)}</h1>
    <p class="lede">Browse school listings by city. Listing information may change; confirm current details directly with each school.</p>
    ${cityLinks ? `<h2>Cities</h2><ul class="seo-list">${cityLinks}</ul>` : ""}
    <h2>School listings</h2><div class="seo-list">${schoolLinks}</div>`;
  const html = pageTemplate({
    title: `Islamic schools in ${stateName} | Islamic School Review`,
    description: `Browse Islamic school listings in ${stateName} by city and available school details.`,
    canonical,
    content,
  });
  return { html, canonical, indexable: contentWordCount(content) >= MIN_INDEXABLE_WORDS };
}

export function renderCityPage(key, groups) {
  const item = groups.byCity.get(key);
  if (!item) return null;
  const stateName = STATE_NAMES[item.state] || item.state;
  const canonical = `/cities/${key}`;
  const schoolLinks = item.schools.slice().sort(byName).map(schoolCard).join("");
  const content = `<div class="breadcrumbs"><a href="/">Home</a> · <a href="/directory">Directory</a> · <a href="/states/${item.state}">${escapeHtml(stateName)}</a> · <span>${escapeHtml(item.city)}</span></div>
    <span class="eyebrow">Browse by city</span>
    <h1>Islamic schools in ${escapeHtml(item.city)}, ${escapeHtml(stateName)}</h1>
    <p class="lede">Browse school listings in ${escapeHtml(item.city)}. Listing information may change; confirm current details directly with each school.</p>
    <div class="seo-list">${schoolLinks}</div>`;
  const html = pageTemplate({
    title: `Islamic schools in ${item.city}, ${stateName} | Islamic School Review`,
    description: `Browse Islamic school listings in ${item.city}, ${stateName}, and view available school details.`,
    canonical,
    content,
  });
  return { html, canonical, indexable: contentWordCount(content) >= MIN_INDEXABLE_WORDS };
}

// Pages with fewer than MIN_INDEXABLE_WORDS words are noindex and left out.
// lastmod is the newest updated_at of the school(s) on that page; the core
// pages have no reliable date, so they carry none.
export function renderSitemap(schools) {
  const groups = groupSchools(schools);
  const day = (value) => (value ? String(value).slice(0, 10) : "");
  const newest = (rows) => rows.map((s) => day(s.updated_at || s.created_at)).sort().pop() || "";
  const entries = CORE_SITEMAP_PATHS.map((url) => ({ url, lastmod: "" }));
  for (const school of schools.slice().sort((a, b) => String(a.id).localeCompare(String(b.id)))) {
    const page = renderSchoolPage(school);
    if (page.indexable) entries.push({ url: page.canonical, lastmod: newest([school]) });
  }
  for (const state of [...groups.byState.keys()].sort()) {
    const page = renderStatePage(state, groups);
    if (page.indexable) entries.push({ url: page.canonical, lastmod: newest(groups.byState.get(state)) });
  }
  for (const key of [...groups.byCity.keys()].sort()) {
    const page = renderCityPage(key, groups);
    if (page.indexable) entries.push({ url: page.canonical, lastmod: newest(groups.byCity.get(key).schools) });
  }
  const urls = entries.map(({ url, lastmod }) =>
    `  <url><loc>${SITE}${escapeHtml(url)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

// "Browse by state" block baked into directory.html for crawlers and no-JS
// visitors. directory.html also rebuilds this list from live data on load.
export function renderStateLinksBlock(schools) {
  const states = [...groupSchools(schools).byState.keys()].sort();
  const links = states
    .map((state) => `<li><a href="/states/${escapeHtml(state)}">${escapeHtml(STATE_NAMES[state] || state)} (${escapeHtml(state)})</a></li>`)
    .join("\n        ");
  return `<!-- GENERATED STATE LINKS:START -->\n    <nav class="directory-state-links" aria-label="Browse schools by state">\n      <h2 class="directory-state-links__title">Browse by state</h2>\n      <ul class="directory-state-links__list">\n        ${links}\n      </ul>\n    </nav>\n    <!-- GENERATED STATE LINKS:END -->`;
}
