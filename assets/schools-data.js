/* ============================================================
   schools-data.js
   Data-access layer for the ISR school directory.
   SOURCE: Supabase REST API
   ============================================================ */

const SUPABASE_URL = 'https://vprltwjduekabkizlbkv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwcmx0d2pkdWVrYWJraXpsYmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDE3MzEsImV4cCI6MjA5MzIxNzczMX0.oHNRX6q9jXbR8W3yULzWf1bstHVulYJOGghmthQazTA';

async function _loadFromSupabase() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/schools?order=name.asc`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  if (!res.ok) throw new Error(`Supabase error ${res.status}: ${res.statusText}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Unexpected response from Supabase');
  return data;
}

// One in-flight promise, shared across all callers.
let _cache = null;

/**
 * Returns the full list of schools (cached after first call).
 * @returns {Promise<Array<Object>>}
 */
export async function getSchools() {
  if (!_cache) _cache = _loadFromSupabase();
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
  if (!grade || grade === 'all') return true;
  const g = (school.grades || '').toLowerCase();
  const flat = g.replace(/[\s–—-]+/g, '');

  if (grade === 'elementary') {
    return /\bprek\b|\bpre-?k\b|kindergarten|^k\b|grade[s]?(1|2|3|4|5)|\b(k|1|2|3|4|5)\b/.test(g)
      || flat.includes('prek') || flat.includes('kg');
  }
  if (grade === 'middle') return /6|7|8|middle/.test(g);
  if (grade === 'high')   return /9|10|11|12|high/.test(g);
  return true;
}

/**
 * Filter schools by query, state, city, grade band.
 */
export function filterSchools(schools, criteria = {}) {
  if (!Array.isArray(schools)) return [];
  const q     = (criteria.q     || '').trim().toLowerCase();
  const state = (criteria.state || '').trim();
  const city  = (criteria.city  || '').trim().toLowerCase();
  const grade = (criteria.grade || '').trim().toLowerCase();

  return schools.filter((s) => {
    if (state && s.state !== state) return false;
    if (city  && (s.city || '').toLowerCase() !== city) return false;
    if (!_matchesGrade(s, grade)) return false;
    if (q) {
      const hay = [s.name, s.city, s.state, s.description, s.grades]
        .filter(Boolean).join(' ').toLowerCase();
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
    return (a.name || '').localeCompare(b.name || '');
  });
}
