// Supabase reads for the on-demand pages (api/school-page.mjs, api/seo-page.mjs).
// The `schools` table is publicly readable (RLS "Schools are viewable by
// everyone"), so the public anon key, the same one the browser uses, is enough.
import { normalizeSchool } from "./school-page.mjs";

const SUPABASE_URL = "https://vprltwjduekabkizlbkv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwcmx0d2pkdWVrYWJraXpsYmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDE3MzEsImV4cCI6MjA5MzIxNzczMX0.oHNRX6q9jXbR8W3yULzWf1bstHVulYJOGghmthQazTA";
const TIMEOUT_MS = 5000;

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Unexpected response shape");
  return data;
}

const supabaseHeaders = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

// Supabase first; if it is unreachable, the static copy shipped with the site
// (/data/schools.json). Throws only if both fail.
async function withFallback(fromSupabase, fromStatic, host) {
  try {
    return await fromSupabase();
  } catch (err) {
    console.error("Supabase read failed, trying /data/schools.json:", err);
    const rows = await getJson(`https://${host || "www.islamicschoolreview.com"}/data/schools.json`);
    return fromStatic(rows);
  }
}

export async function fetchSchool(slug, host) {
  return withFallback(
    async () => {
      const rows = await getJson(
        `${SUPABASE_URL}/rest/v1/schools?id=eq.${encodeURIComponent(slug)}&select=*&limit=1`,
        supabaseHeaders,
      );
      return rows.length ? normalizeSchool(rows[0]) : null;
    },
    (rows) => {
      const row = rows.find((s) => s.id === slug);
      return row ? normalizeSchool(row) : null;
    },
    host,
  );
}

export async function fetchAllSchools(host) {
  return withFallback(
    async () => (await getJson(`${SUPABASE_URL}/rest/v1/schools?select=*&order=name.asc`, supabaseHeaders))
      .map(normalizeSchool),
    (rows) => rows.map(normalizeSchool),
    host,
  );
}
