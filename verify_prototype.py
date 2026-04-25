"""Structural verification of the prototype pages — since no browser is available
to screenshot, we instead parse each HTML file and sanity-check:
  * It parses cleanly as HTML5.
  * Core structural blocks exist (header, nav, footer, main sections per spec).
  * Internal links point to pages that exist.
  * Stylesheet and script references resolve.
  * <img> tags have alt text (none used in prototype, but check anyway).
"""

import os
import sys
from html.parser import HTMLParser
import html5lib
from bs4 import BeautifulSoup

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prototype")
PAGES = [
    "index.html",
    "directory.html",
    "school.html",
    "about.html",
    "blog.html",
    "blog-post.html",
    "contact.html",
    "privacy.html",
    "terms.html",
    "jobs.html",
    "membership.html",
    "signin.html",
    "signup.html",
    "write-review.html",
    "compare.html",
    "account.html",
    "confirmation.html",
]

# Pages that should carry <meta name="robots" content="noindex, nofollow">
# (auth + private post-action pages) and therefore skip some public-SEO checks.
NOINDEX_PAGES = {
    "signin.html",
    "signup.html",
    "account.html",
    "confirmation.html",
    "write-review.html",
}

# Per spec section 5 and section 8 — each page should have these signature blocks
EXPECTATIONS = {
    "index.html": {
        "name": "Home",
        "required_text": [
            # New search-first hero
            "best Islamic school",
            "child's future",
            "City, zip, or school name",
            "Search schools",
            # Trust band
            "2,400+",
            "18,000",
            "92%",
            "Verified parent reviews",
            "School response rate",
            # Audience
            "For parents",
            "Explore programs and scholarships",
            "Find teaching opportunities",
            "Grow your school and reach families",
            # Other sections kept
            "Featured schools",
            "Islamic schools across the country",
            "Honest voices from real families",
            "Islamic-school careers",
            "Guides, news, and community voices",
            "weekly digest",
        ],
    },
    "directory.html": {
        "name": "Directory",
        "required_text": [
            "Islamic schools across the U.S.",
            "Filters",
            "School type",
            "Grade level",
            "Tuition range",
            # Phase 2: cards now render client-side from data/schools.json,
            # but every school name still appears in the static JSON-LD
            # ItemList block, so these strings remain present in the HTML
            # source for crawlers (and for this verifier).
            #
            # Florida
            "Al-Furqan Academy",
            "MY Academy",
            "Al-Zahra Academy",
            "Universal Academy of Florida",
            "Ibn Seena Academy",
            "Islamic School of Miami",
            "American Youth Academy",
            "Bayaan Academy",
            "Muslim Academy of Greater Orlando",
            "Nur Ul-Islam Academy",
            "Alazhar School",
            "Salah Tawfik",
            "Clara Mohammed School",
            # Texas
            "Dallas Islamic School",
            "Brighter Horizons Academy",
            "Iqra Academy of Irving",
            "Good Tree Academy",
            "ILM Academy",
            "Darul Arqam School",
            "The Iman Academy",
            "The Qalam Collegiate Academy",
            "Austin Peace Academy",
            "An-Noor Academy of San Antonio",
            "River City Academy",
            # California
            "New Horizon School - Pasadena",
            "Granada Islamic School",
            "Al-Arqam Islamic School",
            # New York
            "Al-Noor School",
            "Razi School",
            "Al-Iman School",
            # New Jersey
            "Al-Ghazaly School",
            "Noor-Ul-Iman School",
            "Rising Star Academy",
            # Phase 2 markers — confirm the data-driven plumbing is wired in
            "schools-data.js",
            "resultsTarget",
            'type="module"',
        ],
    },
    "school.html": {
        "name": "School profile (data-driven template)",
        "required_text": [
            # Static template strings — these stay in the HTML source
            # regardless of which school is loaded.
            "Preview listing",
            "Request more information",
            "Similar schools",
            "About this school",
            "Contact",
            "Helpful next steps",
            "School not found",
            # Phase 2 markers — confirm the data-driven plumbing is wired in
            "schools-data.js",
            "schoolMain",
            "schoolSkeleton",
            'type="module"',
        ],
    },
    "about.html": {
        "name": "About",
        "required_text": [
            "trusted home for Islamic education",
            "Our story",
            "Editorial",
            "Advisory board",
            "The team",
        ],
    },
    "blog.html": {
        "name": "Blog index",
        "required_text": [
            "Practical guides and honest stories",
            "How to choose an Islamic school",
            "Latest articles",
            "Most read this month",
            "Popular tags",
            "Weekly digest",
            "Pitch a story",
        ],
    },
    "blog-post.html": {
        "name": "Blog post",
        "required_text": [
            "How to choose an Islamic school",
            "Parent guide",
            "On this page",
            "Before you start",
            "Academic rigor",
            "Islamic environment",
            "The school visit",
            "About the author",
            "Keep reading",
        ],
    },
    "contact.html": {
        "name": "Contact",
        "required_text": [
            "We'd love to hear from you",
            "Parents &amp; families",
            "Schools &amp; partnerships",
            "Editorial",
            "Press",
            "Send message",
            "Response times",
            "Offices",
        ],
    },
    "privacy.html": {
        "name": "Privacy",
        "required_text": [
            "Privacy policy",
            "What we collect",
            "How we use it",
            "Cookies",
            "Your rights",
            "Children's privacy",
            "International data transfers",
            "privacy@islamicschoolreview.com",
        ],
    },
    "terms.html": {
        "name": "Terms",
        "required_text": [
            "Terms of service",
            "Our agreement",
            "Reviews and user content",
            "School listings and claims",
            "Memberships and billing",
            "Prohibited conduct",
            "Limitation of liability",
            "arbitration",
            "legal@islamicschoolreview.com",
        ],
    },
    "jobs.html": {
        "name": "Jobs",
        "required_text": [
            "Islamic-school jobs",
            "Role type",
            "Grade level",
            "Employment",
            "Country",
            "Head of Arabic Department",
            "Middle School Principal",
            "Apply",
            "Post a job",
        ],
    },
    "membership.html": {
        "name": "Membership",
        "required_text": [
            "Free",
            "Basic",
            "Premium",
            "Platinum",
            "MOST POPULAR",
            "Start with Basic",
            "Start with Premium",
            "Talk to sales",
            "Compare",
            "Book a 15-min call",
        ],
    },
    "signin.html": {
        "name": "Sign in (preview — coming soon)",
        "required_text": [
            "Sign-in is coming soon",
            "ISR is in preview",
            "No password to enter today",
            "Join the waitlist instead",
            "Back to the school directory",
            # Sentinel: page must NOT contain phishing-prone patterns.
            # (Verifier additionally asserts these strings are absent below.)
        ],
    },
    "signup.html": {
        "name": "Join the launch waitlist",
        "required_text": [
            "Join the launch waitlist",
            "ISR is in preview",
            "I am a",
            "Parent",
            "Student",
            "Educator",
            "School admin",
            "Notify me when accounts launch",
            "No password, no account created today",
        ],
    },
    "write-review.html": {
        "name": "Write a review",
        "required_text": [
            "Write a review",
            "Overall rating",
            "Your relationship",
            "Parent",
            "Student",
            "Alumnus",
            "Staff",
            "Academics",
            "Islamic environment",
            "Community",
            "community guidelines",
            "Submit review",
        ],
    },
    "compare.html": {
        "name": "Compare schools",
        "required_text": [
            "Compare schools",
            "Al-Furqan Academy",
            "MY Academy",
            "Al-Zahra Academy",
            "Overview",
            "Academics",
            "Islamic program",
            "Tuition",
            "Community",
        ],
    },
    "account.html": {
        "name": "My account",
        "required_text": [
            "My account",
            "Saved schools",
            "My reviews",
            "Inquiries",
            "Settings",
            "Notifications",
            "Privacy",
            "Aisha",
        ],
    },
    "confirmation.html": {
        "name": "Confirmation",
        "required_text": [
            "Thank you",
            "What happens next",
            "Back to home",
        ],
    },
}


def check(page):
    print(f"\n=== {page} ===")
    path = os.path.join(ROOT, page)
    if not os.path.isfile(path):
        print(f"  [FAIL] File missing: {path}")
        return False

    with open(path, encoding="utf-8") as f:
        html = f.read()

    # 1) HTML5 parse check — html5lib raises/records errors in strict mode
    try:
        parser = html5lib.HTMLParser(strict=True)
        parser.parse(html)
        print("  [PASS] HTML5 parses without errors")
    except html5lib.html5parser.ParseError as e:
        print(f"  [FAIL] HTML5 parse error: {e}")

    soup = BeautifulSoup(html, "html.parser")

    # 2) Structural blocks — auth / gated pages intentionally use a simpler
    #    top bar and no footer to keep the user focused on the task.
    is_auth = page in ("signin.html", "signup.html", "write-review.html")
    header = soup.find("header", class_="site-header")
    footer = soup.find("footer", class_="site-footer")
    nav = soup.find("nav", class_="nav-primary")
    print(f"  [{'PASS' if header else 'FAIL'}] site-header present")
    if is_auth:
        print(f"  [SKIP] site-footer (auth/gated page — no footer by design)")
        print(f"  [SKIP] primary nav (auth/gated page — simpler top bar)")
    else:
        print(f"  [{'PASS' if footer else 'FAIL'}] site-footer present")
        print(f"  [{'PASS' if nav else 'FAIL'}] primary nav present")

    # 3) Required content
    for needle in EXPECTATIONS[page]["required_text"]:
        ok = needle.lower() in html.lower()
        print(f"  [{'PASS' if ok else 'FAIL'}] contains \"{needle}\"")

    # 3b) Phishing/Safe-Browsing guard — auth pages must not look like a
    #     credential-collection form impersonating Google/Apple. Once a real
    #     OAuth + auth backend is wired up, these strings can come back.
    if page in ("signin.html", "signup.html"):
        forbidden = [
            "Continue with Google",
            "Continue with Apple",
            "or sign in with email",
            "or sign up with email",
            'type="password"',
        ]
        for needle in forbidden:
            ok = needle.lower() not in html.lower()
            print(f"  [{'PASS' if ok else 'FAIL'}] absent \"{needle}\" (Safe-Browsing guard)")

    # 4) CSS / JS references resolve
    for link in soup.find_all("link", rel="stylesheet"):
        href = link.get("href", "")
        if href.startswith(("http:", "https:")):
            continue
        abs_path = os.path.join(ROOT, href)
        ok = os.path.isfile(abs_path)
        print(f"  [{'PASS' if ok else 'FAIL'}] stylesheet {href}")
    for script in soup.find_all("script", src=True):
        src = script["src"]
        if src.startswith(("http:", "https:")):
            continue
        abs_path = os.path.join(ROOT, src)
        ok = os.path.isfile(abs_path)
        print(f"  [{'PASS' if ok else 'FAIL'}] script {src}")

    # 5) Internal links resolve (pages in our set)
    broken = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith(("http:", "https:", "#", "mailto:", "tel:")):
            continue
        if href == "":
            continue
        bare = href.split("#")[0].split("?")[0]
        if not bare:
            continue
        abs_path = os.path.join(ROOT, bare)
        if not os.path.isfile(abs_path):
            broken.append(href)
    if broken:
        print(f"  [FAIL] broken internal links: {sorted(set(broken))}")
    else:
        print("  [PASS] all internal page-to-page links resolve")

    # 6) Basic a11y smoke
    imgs_no_alt = [img for img in soup.find_all("img") if not img.get("alt") and not img.get("aria-hidden")]
    if imgs_no_alt:
        print(f"  [WARN] {len(imgs_no_alt)} img(s) without alt")
    else:
        print(f"  [PASS] no <img> without alt (found {len(soup.find_all('img'))} img tags total)")

    # 7) SEO smoke checks — every page should carry canonical, favicon,
    #    theme-color, OG title/description/image, and Twitter card. Pages
    #    in NOINDEX_PAGES must additionally declare noindex,nofollow.
    canonical = soup.find("link", rel="canonical")
    favicon = soup.find("link", rel=lambda v: v and "icon" in v)
    theme = soup.find("meta", attrs={"name": "theme-color"})
    og_title = soup.find("meta", attrs={"property": "og:title"})
    og_desc = soup.find("meta", attrs={"property": "og:description"})
    og_image = soup.find("meta", attrs={"property": "og:image"})
    tw_card = soup.find("meta", attrs={"name": "twitter:card"})
    print(f"  [{'PASS' if canonical else 'FAIL'}] <link rel=canonical>")
    print(f"  [{'PASS' if favicon else 'FAIL'}] favicon link")
    print(f"  [{'PASS' if theme else 'FAIL'}] theme-color meta")
    print(f"  [{'PASS' if og_title else 'FAIL'}] og:title")
    print(f"  [{'PASS' if og_desc else 'FAIL'}] og:description")
    print(f"  [{'PASS' if og_image else 'FAIL'}] og:image")
    print(f"  [{'PASS' if tw_card else 'FAIL'}] twitter:card")

    robots = soup.find("meta", attrs={"name": "robots"})
    if page in NOINDEX_PAGES:
        has_noindex = robots and "noindex" in (robots.get("content") or "").lower()
        print(f"  [{'PASS' if has_noindex else 'FAIL'}] noindex,nofollow (gated page)")
    else:
        # Public pages should have Schema.org JSON-LD for richer SERP
        ld = soup.find("script", attrs={"type": "application/ld+json"})
        print(f"  [{'PASS' if ld else 'FAIL'}] Schema.org JSON-LD present")

    # Page size info
    size_kb = os.path.getsize(path) / 1024
    n_sections = len(soup.find_all("section"))
    n_h2 = len(soup.find_all("h2"))
    print(f"  [INFO] {size_kb:.1f} KB · {n_sections} <section>s · {n_h2} <h2>s")


def check_seo_assets():
    print("\n=== SEO assets ===")
    assets = [
        "robots.txt",
        "sitemap.xml",
        "favicon.svg",
        "assets/og-image.svg",
    ]
    for rel in assets:
        path = os.path.join(ROOT, rel)
        ok = os.path.isfile(path)
        size = os.path.getsize(path) if ok else 0
        print(f"  [{'PASS' if ok else 'FAIL'}] {rel}  ({size} bytes)")


def check_phase2_data():
    """Phase 2: validate that data/schools.json + assets/schools-data.js
    are present and well-formed. The directory and school pages now depend
    on them at runtime, so a malformed JSON or missing module would silently
    break the live site."""
    import json
    print("\n=== Phase 2 data layer ===")

    json_path = os.path.join(ROOT, "data/schools.json")
    js_path = os.path.join(ROOT, "assets/schools-data.js")

    print(f"  [{'PASS' if os.path.isfile(json_path) else 'FAIL'}] data/schools.json exists")
    print(f"  [{'PASS' if os.path.isfile(js_path)   else 'FAIL'}] assets/schools-data.js exists")

    if not os.path.isfile(json_path):
        return

    try:
        with open(json_path, encoding="utf-8") as f:
            data = json.load(f)
        print("  [PASS] schools.json is valid JSON")
    except json.JSONDecodeError as e:
        print(f"  [FAIL] schools.json invalid JSON: {e}")
        return

    is_list = isinstance(data, list)
    print(f"  [{'PASS' if is_list else 'FAIL'}] schools.json is a top-level array")
    if not is_list:
        return

    print(f"  [INFO] {len(data)} school records")

    # Required keys per the Phase 2 schema.
    required = {"id", "name", "city", "state", "grades", "description", "verified"}
    bad = []
    seen_ids = set()
    dup_ids = []
    for i, s in enumerate(data):
        if not isinstance(s, dict):
            bad.append(f"index {i}: not an object")
            continue
        missing = required - s.keys()
        if missing:
            bad.append(f"{s.get('id', f'index {i}')}: missing keys {sorted(missing)}")
        sid = s.get("id")
        if sid in seen_ids:
            dup_ids.append(sid)
        seen_ids.add(sid)
        # id should be a kebab-case slug
        if sid and not all(c.islower() or c.isdigit() or c == "-" for c in sid):
            bad.append(f"{sid}: id is not lowercase kebab-case")

    print(f"  [{'PASS' if not bad else 'FAIL'}] every record has required keys & valid id")
    for b in bad[:5]:
        print(f"      · {b}")
    if len(bad) > 5:
        print(f"      · …and {len(bad) - 5} more")

    print(f"  [{'PASS' if not dup_ids else 'FAIL'}] all ids are unique")
    if dup_ids:
        print(f"      duplicates: {dup_ids}")

    states = sorted({s.get("state") for s in data if s.get("state")})
    print(f"  [INFO] states represented: {states}")
    verified_count = sum(1 for s in data if s.get("verified"))
    print(f"  [INFO] verified listings: {verified_count}/{len(data)}")


if __name__ == "__main__":
    for p in PAGES:
        check(p)
    check_seo_assets()
    check_phase2_data()
    print("\nDone.")
