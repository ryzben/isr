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
            "Islamic Schools in Florida",
            "Islamic Schools in Texas",
            "Filters",
            "School type",
            "Grade level",
            "Tuition range",
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
        ],
    },
    "school.html": {
        "name": "School profile",
        "required_text": [
            "Al-Furqan Academy",
            "Claim this listing",
            "About Al-Furqan Academy",
            "Jacksonville, FL",
            "Preview listing",
            "Academics",
            "Admissions",
            "Tuition",
            "Reviews",
            "Similar schools",
            "Request more information",
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
        "name": "Sign in",
        "required_text": [
            "Sign in to your account",
            "Continue with Google",
            "Continue with Apple",
            "or sign in with email",
            "Forgot password?",
            "Keep me signed in",
            "Create one free",
        ],
    },
    "signup.html": {
        "name": "Join free",
        "required_text": [
            "Create your free account",
            "I am a",
            "Parent",
            "Student",
            "Educator",
            "School admin",
            "or sign up with email",
            "Create account",
            "Already have an account",
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


if __name__ == "__main__":
    for p in PAGES:
        check(p)
    check_seo_assets()
    print("\nDone.")
