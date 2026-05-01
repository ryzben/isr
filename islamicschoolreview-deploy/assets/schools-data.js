/* ============================================================
   schools-data.js
   Data-access layer for the ISR school directory.

   SOURCE: Supabase PostgreSQL
   To update credentials, edit the SUPABASE config block below.
   The public surface (getSchools / getSchoolById / uniqueStates /
   uniqueCities / filterSchools / sortDefault) is unchanged —
   no page-level code needs to change.
   ============================================================ */

/* ----------------------------------------------------------
   SUPABASE CONFIG — fill these in after Supabase setup
   ---------------------------------------------------------- */
const SUPABASE = {
  // Your Supabase project URL
  url: "https://vprltwjduekabkizlbkv.supabase.co",

  // Your Supabase anon/public key (safe to expose for public data)
  anonKey: "sb_publishable_NDDC-hnp-ic3n0ijcGsLSg_awOo709H",

  // Table names
  schoolsTable: "schools",
  reviewsTable: "reviews",
  usersTable: "users",
};

/* ----------------------------------------------------------
   Internal: fetch all schools from Supabase
   ---------------------------------------------------------- */
async function _loadFromSupabase() {
  const response = await fetch(`${SUPABASE.url}/rest/v1/${SUPABASE.schoolsTable}?select=*&status=eq.published&order=name.asc`, {
    headers: {
      'apikey': SUPABASE.anonKey,
      'Authorization': `Bearer ${SUPABASE.anonKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/* ----------------------------------------------------------
   Fallback: load from local schools.json if Supabase isn't
   configured yet (URL/key still have placeholder values).
   ---------------------------------------------------------- */
const DATA_URL = new URL("../data/schools.json", import.meta.url);

async function _loadSchools() {
  if (SUPABASE.url === "YOUR_SUPABASE_URL" || SUPABASE.anonKey === "YOUR_SUPABASE_ANON_KEY") {
    // Supabase not configured yet — fall back to local JSON
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`Failed to load schools (${res.status})`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("schools.json is not an array");
    return data;
  }
  return _loadFromSupabase();
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
    return /\bpre|k|1st|2nd|3rd|4th|5th|6th|7th|8th\b/.test(flat);
  }
  if (grade === "middle") {
    return /\b6th|7th|8th|9th\b/.test(flat);
  }
  if (grade === "high") {
    return /\b9th|10th|11th|12th\b/.test(flat);
  }
  if (grade === "prek") {
    return /\bpre|prek\b/.test(flat);
  }
  return false;
}

function _matchesSearch(school, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    (school.name || "").toLowerCase().includes(q) ||
    (school.city || "").toLowerCase().includes(q) ||
    (school.state || "").toLowerCase().includes(q) ||
    (school.description || "").toLowerCase().includes(q)
  );
}

/**
 * Filter schools by criteria
 * @param {Array} schools - Array of school objects
 * @param {Object} criteria - Filter criteria
 * @param {string} criteria.state - State code filter
 * @param {string} criteria.city - City name filter
 * @param {string} criteria.grade - Grade level filter
 * @param {string} criteria.search - Search query
 * @param {boolean} criteria.verified - Verified schools only
 * @returns {Array} Filtered schools
 */
export function filterSchools(schools, criteria = {}) {
  return schools.filter((school) => {
    if (criteria.state && school.state !== criteria.state) return false;
    if (criteria.city && school.city !== criteria.city) return false;
    if (criteria.grade && !_matchesGrade(school, criteria.grade)) return false;
    if (criteria.search && !_matchesSearch(school, criteria.search)) return false;
    if (criteria.verified && !school.verified) return false;
    return true;
  });
}

/**
 * Default sort: verified schools first, then by name
 * @param {Array} schools - Array of school objects
 * @returns {Array} Sorted schools
 */
export function sortDefault(schools) {
  return [...schools].sort((a, b) => {
    // Verified schools first
    if (a.verified && !b.verified) return -1;
    if (!a.verified && b.verified) return 1;

    // Then alphabetical by name
    return (a.name || "").localeCompare(b.name || "");
  });
}