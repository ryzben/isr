// School, state and city pages and sitemap.xml are now rendered on request by
// api/school-page.mjs and api/seo-page.mjs (see vercel.json), so publishing a
// school never needs this script or a redeploy.
//
// The one thing left here is the "Browse by state" block baked into
// directory.html for crawlers and no-JS visitors. (The directory also rebuilds
// that list from live data in the browser.) Re-run this occasionally, e.g. when
// the first school in a new state is published:
//   node scripts/generate-seo-pages.mjs
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchAllSchools } from "../api/_lib/data.mjs";
import { renderStateLinksBlock } from "../api/_lib/school-page.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const schools = await fetchAllSchools();
if (!schools.length) throw new Error("No school records were returned; directory.html was not updated.");

const directoryPath = path.join(ROOT, "directory.html");
const directoryHtml = await readFile(directoryPath, "utf8");
const marker = /<!-- GENERATED STATE LINKS:START -->[\s\S]*?<!-- GENERATED STATE LINKS:END -->/;
if (!marker.test(directoryHtml)) {
  throw new Error("Directory state-link markers are missing; refusing to update directory.html.");
}
await writeFile(directoryPath, directoryHtml.replace(marker, renderStateLinksBlock(schools)), "utf8");
console.log(`Updated the state links in directory.html (${schools.length} schools).`);
