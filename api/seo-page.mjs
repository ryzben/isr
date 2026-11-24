// Renders /states/<ST>, /cities/<ST>/<city-slug> and /sitemap.xml on request
// (vercel.json rewrites those paths here), so a newly published school shows
// up in its state and city lists and in the sitemap without a redeploy.
import { fetchAllSchools } from "./_lib/data.mjs";
import {
  groupSchools, renderStatePage, renderCityPage, renderSitemap, renderNotFoundPage,
} from "./_lib/school-page.mjs";
import { CACHE_FOUND, CACHE_NONE, send } from "./_lib/http.mjs";

const STATE_PATTERN = /^[A-Za-z]{2}$/;
const CITY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const notFound = (res, what) => send(res, 404, CACHE_NONE, renderNotFoundPage({
  heading: `We couldn't find that ${what}`,
  lede: "There are no school listings here yet, or the link may be mistyped.",
}));

export default async function handler(req, res) {
  const params = new URL(req.url, "http://x").searchParams;
  const kind = params.get("kind");
  const state = String(params.get("state") || "");
  const city = String(params.get("city") || "");

  if (kind === "state" && !STATE_PATTERN.test(state)) return notFound(res, "state");
  if (kind === "city" && (!STATE_PATTERN.test(state) || !CITY_PATTERN.test(city) || city.length > 120)) {
    return notFound(res, "city");
  }
  if (!["state", "city", "sitemap"].includes(kind)) return notFound(res, "page");

  // Lower-case state codes in old or hand-typed links: send them to the canonical URL.
  if (state && state !== state.toUpperCase()) {
    res.statusCode = 301;
    res.setHeader("Location", kind === "state" ? `/states/${state.toUpperCase()}` : `/cities/${state.toUpperCase()}/${city}`);
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.end();
  }

  let schools;
  try {
    schools = await fetchAllSchools(req.headers.host);
  } catch (err) {
    console.error(`seo-page: could not load schools for ${kind}:`, err);
    if (kind === "sitemap") return send(res, 503, CACHE_NONE, "Sitemap temporarily unavailable\n", "text/plain; charset=utf-8");
    return send(res, 503, CACHE_NONE, renderNotFoundPage({
      heading: "This page is temporarily unavailable",
      lede: "Please try again in a minute.",
    }));
  }

  if (kind === "sitemap") {
    return send(res, 200, CACHE_FOUND, renderSitemap(schools), "application/xml; charset=utf-8");
  }

  const groups = groupSchools(schools);
  const page = kind === "state"
    ? renderStatePage(state, groups)
    : renderCityPage(`${state}/${city}`, groups);
  if (!page) return notFound(res, kind);
  return send(res, 200, CACHE_FOUND, page.html);
}
