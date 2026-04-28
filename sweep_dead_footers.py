"""Fix dead `href="#"` links in footer/columns sitewide.

The prototype's footer was originally hand-coded on every page with placeholder
`#` links. For the beta send we want every reachable page to have honest links —
either to the page that actually serves the role, or removed entirely.

This script walks every .html under prototype/ and applies a fixed set of
known-safe replacements. Each replacement is a string match (not regex on
attributes) to keep it predictable and reviewable.
"""

import os
import re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prototype")

# Replace footer-column dead links with the page that actually serves the role.
# These are exact-string substitutions — readable and easy to audit.
LITERAL_REPLACEMENTS = [
    # Directory column
    ('<li><a href="#">Browse by state</a></li>',
     '<li><a href="directory.html">Browse by state</a></li>'),
    ('<li><a href="#">Browse by type</a></li>',
     '<li><a href="directory.html">Browse by type</a></li>'),
    ('<li><a href="#">Top-rated schools</a></li>',
     '<li><a href="directory.html">Top-rated schools</a></li>'),
    ('<li><a href="#">Claim your school</a></li>',
     '<li><a href="membership.html">Claim your school</a></li>'),
    # Resources column
    ('<li><a href="#">For parents</a></li>',
     '<li><a href="blog.html">For parents</a></li>'),
    ('<li><a href="#">For educators</a></li>',
     '<li><a href="blog.html">For educators</a></li>'),
    ('<li><a href="#">For students</a></li>',
     '<li><a href="blog.html">For students</a></li>'),
    ('<li><a href="#">Downloads</a></li>',
     '<li><a href="blog.html">Downloads</a></li>'),
    # Company column
    ('<li><a href="#">Editorial policy</a></li>',
     '<li><a href="about.html">Editorial policy</a></li>'),
    ('<li><a href="#">Advertise</a></li>',
     '<li><a href="membership.html">Advertise</a></li>'),
    ('<li><a href="#">Press</a></li>',
     '<li><a href="contact.html">Press</a></li>'),
    # Footer-bottom rail
    ('<a href="#">Cookies</a>', '<a href="privacy.html">Cookies</a>'),
]


def sweep_file(path: str) -> int:
    with open(path, "r", encoding="utf-8") as f:
        original = f.read()
    out = original
    for old, new in LITERAL_REPLACEMENTS:
        out = out.replace(old, new)
    if out != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(out)
        # Count substitutions made (rough count by counting old strings removed).
        return sum(original.count(o) for o, _ in LITERAL_REPLACEMENTS) - sum(
            out.count(o) for o, _ in LITERAL_REPLACEMENTS
        )
    return 0


def main() -> None:
    total = 0
    for fname in sorted(os.listdir(ROOT)):
        if not fname.endswith(".html"):
            continue
        path = os.path.join(ROOT, fname)
        n = sweep_file(path)
        if n:
            print(f"{fname}: replaced {n} dead links")
            total += n
        else:
            print(f"{fname}: no changes")
    print(f"\nTotal: {total} substitutions")


if __name__ == "__main__":
    main()
