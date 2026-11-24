// Response helpers shared by the on-demand page functions.

// Found pages: edge-cached for 60 s, so publish/edit/delete appear within about
// a minute without a redeploy.
export const CACHE_FOUND = "public, max-age=0, s-maxage=60, stale-while-revalidate=60";
// Not-found and errors are never cached, so a URL that 404s before a school is
// published works the moment it is published.
export const CACHE_NONE = "no-store";

export function send(res, status, cacheControl, body, contentType = "text/html; charset=utf-8") {
  res.statusCode = status;
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", cacheControl);
  res.end(body);
}
