import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSchools, schoolPagePath, schoolSlug } from "../assets/schools-data.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = ROOT;
const SITE = "https://www.islamicschoolreview.com";
const MIN_INDEXABLE_WORDS = 60;
const STATE_NAMES = {
  CA: "California", FL: "Florida", IA: "Iowa", IL: "Illinois", MD: "Maryland",
  MI: "Michigan", MN: "Minnesota", NJ: "New Jersey", NY: "New York", OH: "Ohio",
  PA: "Pennsylvania", TX: "Texas", VA: "Virginia", WA: "Washington",
};
const TODAY = new Date().toISOString().slice(0, 10);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function contentWordCount(content) {
  const text = content
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|#39);/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (text.match(/[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu) || []).length;
}

function pageTemplate({ title, description, canonical, content }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const robots = contentWordCount(content) >= MIN_INDEXABLE_WORDS
    ? "index,follow"
    : "noindex,follow";
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

function schoolCard(school) {
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

function detail(label, value) {
  return `<dt>${escapeHtml(label)}</dt><dd>${value ? escapeHtml(value) : "Not listed"}</dd>`;
}

const schools = await getSchools();
if (!schools.length) throw new Error("No school records were returned; SEO pages were not generated.");

const ids = new Set();
const schoolsByState = new Map();
const schoolsByCity = new Map();
for (const school of schools) {
  const schoolPageSlug = schoolSlug(school.id);
  if (!schoolPageSlug || !school.name) throw new Error("A school record is missing a valid ID or name.");
  if (ids.has(schoolPageSlug)) throw new Error(`Duplicate school page slug: ${schoolPageSlug}`);
  ids.add(schoolPageSlug);

  if (school.state) {
    const state = String(school.state).toUpperCase();
    if (!schoolsByState.has(state)) schoolsByState.set(state, []);
    schoolsByState.get(state).push(school);
    if (school.city) {
      const citySlug = schoolSlug(school.city);
      const cityKey = `${state}/${citySlug}`;
      const cityRecords = schoolsByCity.get(cityKey) || { state, city: school.city, schools: [] };
      if (cityRecords.city !== school.city) throw new Error(`Duplicate city page slug: ${cityKey}`);
      cityRecords.schools.push(school);
      schoolsByCity.set(cityKey, cityRecords);
    }
  }
}

const stateLinks = [...schoolsByState.keys()]
  .sort((a, b) => a.localeCompare(b))
  .map((state) => `<li><a href="/states/${escapeHtml(state)}">${escapeHtml(STATE_NAMES[state] || state)} (${escapeHtml(state)})</a></li>`)
  .join("\n        ");
const generatedStateLinks = `<!-- GENERATED STATE LINKS:START -->\n    <nav class="directory-state-links" aria-label="Browse schools by state">\n      <h2 class="directory-state-links__title">Browse by state</h2>\n      <ul class="directory-state-links__list">\n        ${stateLinks}\n      </ul>\n    </nav>\n    <!-- GENERATED STATE LINKS:END -->`;
const directoryPath = path.join(ROOT, "directory.html");
const directoryHtml = await readFile(directoryPath, "utf8");
const stateLinksMarker = /<!-- GENERATED STATE LINKS:START -->[\s\S]*?<!-- GENERATED STATE LINKS:END -->/;
if (!stateLinksMarker.test(directoryHtml)) {
  throw new Error("Directory state-link markers are missing; refusing to update directory.html.");
}
await writeFile(directoryPath, directoryHtml.replace(stateLinksMarker, generatedStateLinks), "utf8");

const sitemapPaths = [
  "/", "/directory", "/about", "/blog", "/blog-post", "/contact", "/claim",
  "/add-school", "/privacy", "/terms",
];
const generatedPages = [];

for (const school of schools) {
  const id = schoolSlug(school.id);
  const location = [school.city, STATE_NAMES[school.state] || school.state].filter(Boolean).join(", ");
  const canonical = `/schools/${id}`;
  const website = /^https?:\/\//i.test(school.website || "")
    ? `<a href="${escapeHtml(school.website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(school.website.replace(/^https?:\/\//i, ""))}</a>`
    : "";
  const details = [
    detail("Location", location),
    detail("Grades", school.grades),
    detail("Tuition", school.tuition_range),
    detail("Enrollment", school.enrollment),
    detail("Accreditation", school.accreditation),
    school.address ? detail("Address", school.address) : "",
    school.phone ? detail("Phone", school.phone) : "",
    school.website ? `<dt>Website</dt><dd>${website}</dd>` : "",
  ].filter(Boolean).join("\n        ");
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
    </div>
    <div class="seo-list">
      ${actions}
    </div>`;
  const file = path.join(OUTPUT, "schools", `${id}.html`);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, pageTemplate({
    title: `${school.name} in ${location || "the United States"} | Islamic School Review`,
    description: `View available listing details for ${school.name}${location ? ` in ${location}` : ""}. Confirm current information directly with the school.`,
    canonical,
    content,
  }), "utf8");
  if (contentWordCount(content) >= MIN_INDEXABLE_WORDS) generatedPages.push(canonical);
}

for (const [state, records] of [...schoolsByState.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const stateName = STATE_NAMES[state] || state;
  const cities = [...schoolsByCity.values()].filter((item) => item.state === state)
    .sort((a, b) => a.city.localeCompare(b.city));
  const cityLinks = cities.map((item) => `<li><a href="/cities/${state}/${schoolSlug(item.city)}">${escapeHtml(item.city)}</a></li>`).join("");
  const schoolLinks = records.slice().sort((a, b) => a.name.localeCompare(b.name)).map(schoolCard).join("");
  const canonical = `/states/${state}`;
  const content = `<div class="breadcrumbs"><a href="/">Home</a> · <a href="/directory">Directory</a> · <span>${escapeHtml(stateName)}</span></div>
    <span class="eyebrow">Browse by state</span>
    <h1>Islamic schools in ${escapeHtml(stateName)}</h1>
    <p class="lede">Browse school listings by city. Listing information may change; confirm current details directly with each school.</p>
    ${cityLinks ? `<h2>Cities</h2><ul class="seo-list">${cityLinks}</ul>` : ""}
    <h2>School listings</h2><div class="seo-list">${schoolLinks}</div>`;
  const file = path.join(OUTPUT, "states", `${state}.html`);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, pageTemplate({
    title: `Islamic schools in ${stateName} | Islamic School Review`,
    description: `Browse Islamic school listings in ${stateName} by city and available school details.`,
    canonical,
    content,
  }), "utf8");
  if (contentWordCount(content) >= MIN_INDEXABLE_WORDS) generatedPages.push(canonical);
}

for (const [key, item] of [...schoolsByCity.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const stateName = STATE_NAMES[item.state] || item.state;
  const canonical = `/cities/${key}`;
  const schoolLinks = item.schools.slice().sort((a, b) => a.name.localeCompare(b.name)).map(schoolCard).join("");
  const content = `<div class="breadcrumbs"><a href="/">Home</a> · <a href="/directory">Directory</a> · <a href="/states/${item.state}">${escapeHtml(stateName)}</a> · <span>${escapeHtml(item.city)}</span></div>
    <span class="eyebrow">Browse by city</span>
    <h1>Islamic schools in ${escapeHtml(item.city)}, ${escapeHtml(stateName)}</h1>
    <p class="lede">Browse school listings in ${escapeHtml(item.city)}. Listing information may change; confirm current details directly with each school.</p>
    <div class="seo-list">${schoolLinks}</div>`;
  const file = path.join(OUTPUT, "cities", `${key}.html`);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, pageTemplate({
    title: `Islamic schools in ${item.city}, ${stateName} | Islamic School Review`,
    description: `Browse Islamic school listings in ${item.city}, ${stateName}, and view available school details.`,
    canonical,
    content,
  }), "utf8");
  if (contentWordCount(content) >= MIN_INDEXABLE_WORDS) generatedPages.push(canonical);
}

const coreUrls = sitemapPaths.map((url) => `  <url><loc>${SITE}${url}</loc><lastmod>${TODAY}</lastmod></url>`);
const generatedUrls = generatedPages.map((url) => `  <url><loc>${SITE}${url}</loc><lastmod>${TODAY}</lastmod></url>`);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...coreUrls, ...generatedUrls].join("\n")}\n</urlset>\n`;
await writeFile(path.join(ROOT, "sitemap.xml"), sitemap, "utf8");
console.log(`Generated ${schools.length} school, ${schoolsByState.size} state, and ${schoolsByCity.size} city pages; updated sitemap.xml.`);
