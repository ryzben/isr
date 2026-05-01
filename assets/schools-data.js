/* ============================================================
   schools-data.js
   Data-access layer for the ISR school directory.

   SOURCE: Airtable REST API
   To update credentials, edit the AIRTABLE config block below.
   The public surface (getSchools / getSchoolById / uniqueStates /
   uniqueCities / filterSchools / sortDefault) is unchanged —
   no page-level code needs to change.
   ============================================================ */

/* ----------------------------------------------------------
   AIRTABLE CONFIG — fill these in after Airtable setup
   ---------------------------------------------------------- */
const AIRTABLE = {
  // Your Airtable API token (read-only, safe to expose for public data)
  // Create one at: https://airtable.com/create/tokens
  token: "YOUR_AIRTABLE_TOKEN",

  // Your Base ID — found in the Airtable API docs for your base
  // Looks like: appXXXXXXXXXXXXXX
  baseId: "YOUR_BASE_ID",

  // The table name — must match exactly (case-sensitive)
  table: "Schools",
};

/* ----------------------------------------------------------
   Internal: fetch all published records from Airtable,
   handling pagination automatically.
   ---------------------------------------------------------- */
async function _loadFromAirtable() {
  const url = (offset) => {
    const base = `https://api.airtable.com/v0/${AIRTABLE.baseId}/${encodeURIComponent(AIRTABLE.table)}`;
    const params = new URLSearchParams({
      filterByFormula: "{status}='published'",
      sort: JSON.stringify([{ field: "name", direction: "asc" }]),
      pageSize: "100",
    });
    if (offset) params.set("offset", offset);
    return `${base}?${params}`;
  };

  const headers = { Authorization: `Bearer ${AIRTABLE.token}` };
  let records = [];
  let offset = null;

  do {
    const res = await fetch(url(offset), { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Airtable error ${res.status}: ${err.error?.message || res.statusText}`);
    }
    const json = await res.json();
    records = records.concat(json.records || []);
    offset = json.offset || null;
  } while (offset);

  // Map Airtable record format → school object format used by the site
  return records.map((rec) => {
    const f = rec.fields;
    return {
      id:            f.id            || rec.id,
      name:          f.name          || "",
      city:          f.city          || "",
      state:         f.state         || "",
      address:       f.address       || "",
      phone:         f.phone         || "",
      website:       f.website       || "",
      grades:        f.grades        || "",
      tuition_range: f.tuition_range || null,
      description:   f.description   || "",
      photo_url:     f.photo_url     || "",
      verified:      f.verified === true || f.verified === "true",
      accreditation: f.accreditation || "",
      enrollment:    f.enrollment    || "",
      _airtable_id:  rec.id,          // keep the Airtable row ID for future edits
    };
  });
}

/* ----------------------------------------------------------
   Fallback: load from local schools.json if Airtable isn't
   configured yet (token still has placeholder value).
   ---------------------------------------------------------- */
const DATA_URL = new URL("../data/schools.json", import.meta.url);

async function _loadSchools() {
  if (AIRTABLE.token === "YOUR_AIRTABLE_TOKEN" || AIRTABLE.baseId === "YOUR_BASE_ID") {
    // Airtable not configured yet — fall back to local JSON
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`Failed to load schools (${res.status})`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("schools.json is not an array");
    return data;
  }
  return _loadFromAirtable();
}

// One in-flight promise, shared across all callers.
let _cache = null;

/**
 * Returns the full list of published schools (cached after first call).
 * @returns {Promise<Array<Object>>}
 */
export async function getSchools() {
  if (!_cache) _cache = _loadSchools();
  try {
    return await _cache;
  } catch (err) {
    _cache = null;
    throw err;
  }
}

/**
 * Look up a single school by its `id` slug.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getSchoolById(id) {
  if (!id) return null;
  const schools = await getSchools();
  return schools.find((s) => s.id === id) || null;
}

/**
 * @returns {Promise<string[]>} unique state codes sorted A→Z
 */
export async function uniqueStates() {
  const schools = await getSchools();
  return [...new Set(schools.map((s) => s.state).filter(Boolean))].sort();
}

/**
 * Unique city names, optionally filtered to one state.
 * @param {string} [stateCode]
 * @returns {Promise<string[]>}
 */
export async function uniqueCities(stateCode) {
  const schools = await getSchools();
  const cities = schools
    .filter((s) => !stateCode || s.state === stateCode)
    .map((s) => s.city)
    .filter(Boolean);
  return [...new Set(cities)].sort((a, b) => a.localeCompare(b));
}

/* ----------------------------------------------------------
   Filtering
   ---------------------------------------------------------- */
function _matchesGrade(school, grade) {
  if (!grade || grade === "all") return true;
  const g = (school.grades || "").toLowerCase();
  const flat = g.replace(/[\s–—-]+/g, "");

  if (grade === "elementary") {
    return /\bprek\b|\bpre-?k\b|kindergarten|^k\b|grade[s]?(1|2|3|4|5)|\b(k|1|2|3|4|5)\b/.test(g)
      || flat.includes("prek") || flat.includes("kg");
  }
  if (grade === "middle") return /6|7|8|middle/.test(g);
  if (grade === "high")   return /9|10|11|12|high/.test(g);
  return true;
}

/**
 * Filter schools by query, state, city, grade band.
 */
export function filterSchools(schools, criteria = {}) {
  if (!Array.isArray(schools)) return [];
  const q     = (criteria.q     || "").trim().toLowerCase();
  const state = (criteria.state || "").trim();
  const city  = (criteria.city  || "").trim().toLowerCase();
  const grade = (criteria.grade || "").trim().toLowerCase();

  return schools.filter((s) => {
    if (state && s.state !== state) return false;
    if (city  && (s.city || "").toLowerCase() !== city) return false;
    if (!_matchesGrade(s, grade)) return false;
    if (q) {
      const hay = [s.name, s.city, s.state, s.description, s.grades]
        .filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Verified schools first, then alphabetical.
 */
export function sortDefault(schools) {
  return [...schools].sort((a, b) => {
    if (!!b.verified - !!a.verified !== 0) {
      return (b.verified ? 1 : 0) - (a.verified ? 1 : 0);
    }
    return (a.name || "").localeCompare(b.name || "");
  });
}
