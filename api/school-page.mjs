// Renders /schools/<slug> on request (vercel.json rewrites the path here).
//
// School pages used to be static files written by scripts/generate-seo-pages.mjs,
// so a school published from /admin had no page until someone regenerated and
// redeployed. Rendering from the database on each (briefly cached) request means
// publish, edit and delete show up within a minute, with no redeploy.
import { fetchSchool } from "./_lib/data.mjs";
import { renderSchoolPage, renderNotFoundPage } from "./_lib/school-page.mjs";
import { CACHE_FOUND, CACHE_NONE, send } from "./_lib/http.mjs";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default async function handler(req, res) {
  const slug = String(new URL(req.url, "http://x").searchParams.get("slug") || "");

  if (!SLUG_PATTERN.test(slug) || slug.length > 120) {
    return send(res, 404, CACHE_NONE, renderNotFoundPage());
  }

  let school;
  try {
    school = await fetchSchool(slug, req.headers.host);
  } catch (err) {
    console.error(`school-page: lookup failed for "${slug}":`, err);
    return send(res, 503, CACHE_NONE, renderNotFoundPage({
      heading: "This listing is temporarily unavailable",
      lede: "Please try again in a minute.",
    }));
  }

  if (!school) return send(res, 404, CACHE_NONE, renderNotFoundPage());
  return send(res, 200, CACHE_FOUND, renderSchoolPage(school).html);
}
