/* ============================================================
   schools-data.js
   Data-access layer for the ISR school directory.

   This is the ONLY module that knows where school records come
   from. directory.html and school.html should never call fetch()
   directly — they import from here.

   Today: reads data/schools.json (static).
   Future: swap _loadSchools() to call Supabase. Public surface
   (getSchools / getSchoolById / uniqueStates / uniqueCities /
   filterSchools) stays identical, so no caller has to change.
   ============================================================ */

// Resolve data/schools.json relative to THIS module so the path
// works whether the page sits at /directory.html or /school.html.
const DATA_URL = new URL("../data/schools.json", import.meta.url);

// One in-flight promise, shared across all callers. Subsequent
// calls dedupe to the same fetch and reuse the parsed array.
let _cache = null;

async function _loadSchools() {
  // FUTURE (Supabase):
  //   const { data, error } = await supabase.from("schools").select("*");
  //   if (error) throw error;
  //   return data;
  const res = await fetch(DATA_URL);
  if (!res.ok) {
    throw new Error(`Failed to load schools (${res.status} ${res.statusText})`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("schools.json is not an array");
  }
  return data;
}

/**
 * Returns the full list of schools (cached after the first call).
 * @returns {Promise<Array<Object>>}
 */
export async function getSchools() {
  if (!_cache) _cache = _loadSchools();
  try {
    return await _cache;
  } catch (err) {
    // If the load failed, drop the cache so the next call retries.
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
 * @returns {Promise<string[]>} unique state codes (e.g. ["FL","TX"]) sorted A→Z
 */
export async function uniqueStates() {
  const schools = await getSchools();
  return [...new Set(schools.map((s) => s.state).filter(Boolean))].sort();
}

/**
 * Unique city names, optionally restricted to one state.
 * @param {string} [stateCode] — e.g. "FL". Omit for all states.
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

/* -----------------------------------------------------------
   Filtering
   ----------------------------------------------------------- */

// Loose grade-band classifier. The grades column in our JSON
// is free text like "PreK–12" or "K–8", so we normalize to the
// three coarse buckets the directory filter exposes.
function _matchesGrade(school, grade) {
  if (!grade || grade === "all") return true;
  const g = (school.grades || "").toLowerCase();

  // strip dashes/spaces so "prek-12", "prek – 12", "prek to 12" all collapse
  const flat = g.replace(/[\s–—-]+/g, "");

  if (grade === "elementary") {
    // K–5 territory
    return /\bprek\b|\bpre-?k\b|kindergarten|^k\b|grade[s]?(1|2|3|4|5)|\b(k|1|2|3|4|5)\b/.test(g)
      || flat.includes("prek") || flat.includes("kg");
  }
  if (grade === "middle") {
    // 6–8 territory
    return /6|7|8|middle/.test(g);
  }
  if (grade === "high") {
    // 9–12 territory
    return /9|10|11|12|high/.test(g);
  }
  return true;
}

/**
 * Filter a school list by free-text query, state, city, and grade band.
 * All criteria are AND-combined; empty/undefined criteria are ignored.
 *
 * @param {Array<Object>} schools
 * @param {Object} criteria
 * @param {string} [criteria.q]      — matches name/city/description (case-insensitive)
 * @param {string} [criteria.state]  — exact state code, e.g. "FL"
 * @param {string} [criteria.city]   — exact city name (case-insensitive)
 * @param {string} [criteria.grade]  — "elementary" | "middle" | "high" | "all"
 * @returns {Array<Object>}
 */
export function filterSchools(schools, criteria = {}) {
  if (!Array.isArray(schools)) return [];
  const q = (criteria.q || "").trim().toLowerCase();
  const state = (criteria.state || "").trim();
  const city = (criteria.city || "").trim().toLowerCase();
  const grade = (criteria.grade || "").trim().toLowerCase();

  return schools.filter((s) => {
    if (state && s.state !== state) return false;
    if (city && (s.city || "").toLowerCase() !== city) return false;
    if (!_matchesGrade(s, grade)) return false;
    if (q) {
      const hay = [s.name, s.city, s.state, s.description, s.grades]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Sort helper used by the directory: verified schools first, then
 * alphabetical by name. Returns a NEW array — does not mutate input.
 * @param {Array<Object>} schools
 * @returns {Array<Object>}
 */
export function sortDefault(schools) {
  return [...schools].sort((a, b) => {
    if (!!b.verified - !!a.verified !== 0) {
      return (b.verified ? 1 : 0) - (a.verified ? 1 : 0);
    }
    return (a.name || "").localeCompare(b.name || "");
  });
}
