"""
One-time migration: switch all canonical / OG / sitemap / JSON-LD URLs
from the old www-subdomain or vercel.app preview URL to the apex
production domain.

Run from the isr-deploy/ root:
    python3 migrate_canonical.py

Idempotent — running again is a no-op.
"""

import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prototype")

REPLACEMENTS = [
    ("https://www.islamicschoolreview.com", "https://islamicschoolreview.com"),
    ("http://www.islamicschoolreview.com", "https://islamicschoolreview.com"),
    ("https://isr-neon.vercel.app", "https://islamicschoolreview.com"),
    ("http://isr-neon.vercel.app", "https://islamicschoolreview.com"),
]

# Only touch text files. Anything else is left alone.
TEXT_EXTS = {".html", ".xml", ".txt", ".css", ".js", ".json", ".svg", ".md"}


def is_text(path):
    return os.path.splitext(path)[1].lower() in TEXT_EXTS


total_files = 0
total_subs = 0
changed_files = []

for dirpath, _, files in os.walk(ROOT):
    for name in files:
        path = os.path.join(dirpath, name)
        if not is_text(path):
            continue
        with open(path, encoding="utf-8") as f:
            original = f.read()
        updated = original
        local_subs = 0
        for old, new in REPLACEMENTS:
            count = updated.count(old)
            if count:
                updated = updated.replace(old, new)
                local_subs += count
        if local_subs:
            with open(path, "w", encoding="utf-8") as f:
                f.write(updated)
            changed_files.append((os.path.relpath(path, ROOT), local_subs))
            total_files += 1
            total_subs += local_subs

print(f"Migrated {total_subs} URL references across {total_files} files:")
for rel, n in sorted(changed_files):
    print(f"  {rel}: {n} replacement(s)")

# Sanity: nothing should remain pointing at the old hosts.
remaining = []
for dirpath, _, files in os.walk(ROOT):
    for name in files:
        path = os.path.join(dirpath, name)
        if not is_text(path):
            continue
        with open(path, encoding="utf-8") as f:
            text = f.read()
        for old, _ in REPLACEMENTS:
            if old in text:
                remaining.append((os.path.relpath(path, ROOT), old))
if remaining:
    print("\nERROR: stale references still present:")
    for path, old in remaining:
        print(f"  {path}: {old}")
    sys.exit(1)

print("\nNo stale references remain. Migration complete.")
