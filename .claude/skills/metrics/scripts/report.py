#!/usr/bin/env python3
"""Print GoatCounter metrics for jimmyvanveen.com.

  report.py                          last 7 days
  report.py 2026-10-01 2026-10-17    a date range (inclusive, UTC days)
  report.py --path /blog/some-slug   one page: visits and its referrers

Reads a read-only API token from ~/.config/goatcounter/token.
Standard library only, so it runs wherever python3 does.
"""

import datetime
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

API = "https://jimmyvanveen.goatcounter.com/api/v0"
TOKEN_FILE = os.path.expanduser("~/.config/goatcounter/token")
SECTIONS = ["toprefs", "campaigns", "browsers", "systems", "locations", "sizes", "languages"]


def get(path, params):
    query = urllib.parse.urlencode(params, safe="/")
    req = urllib.request.Request(
        f"{API}{path}?{query}",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
    )
    try:
        return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        sys.exit(f"GoatCounter {path} answered {e.code}: {e.read().decode()[:200]}")


def rows(items, width=4):
    # Sizes come back with an empty name and the bucket in "id" (phone, desktop, ...)
    for x in items:
        print(f"  {x['count']:>{width}}  {x.get('name') or x.get('id') or '(unknown)'}")


def page_report(rng, wanted):
    hits = get("/stats/hits", {**rng, "include_paths": wanted, "path_by_name": "true"})["hits"]
    match = next((h for h in hits if h["path"] == wanted), None)
    if match is None:
        print(f"{wanted}: no visits {rng['start']} to {rng['end']}")
        return
    print(f"{wanted}  {match['count']} visitors ({rng['start']} to {rng['end']})")
    print(f"  title: {match['title']}")
    print("\nREFERRERS")
    rows(get(f"/stats/hits/{match['path_id']}", rng)["refs"])


def site_report(rng):
    # /stats/total rejects "limit"; the list endpoints take it
    total = get("/stats/total", rng)
    print(f"TOTAL  {total['total']} visitors ({rng['start']} to {rng['end']}, UTC days)")
    print("daily: " + " ".join(f"{d['day'][5:]}={d['daily']}" for d in total["stats"]))
    print("\nPAGES")
    for h in get("/stats/hits", {**rng, "limit": 15})["hits"]:
        print(f"  {h['count']:>4}  {h['path']}")
    for section in SECTIONS:
        print(f"\n{section.upper()}")
        rows(get(f"/stats/{section}", {**rng, "limit": 10})["stats"])


if __name__ == "__main__":
    if not os.path.isfile(TOKEN_FILE):
        sys.exit(f"No token at {TOKEN_FILE}; see the metrics skill's setup section.")
    TOKEN = open(TOKEN_FILE).read().strip()

    args = sys.argv[1:]
    path = None
    if "--path" in args:
        i = args.index("--path")
        if i + 1 >= len(args):
            sys.exit("--path needs a page, e.g. --path /blog/some-slug")
        path = args[i + 1]
        del args[i : i + 2]

    today = datetime.datetime.now(datetime.UTC).date()
    start, end = (args + [None, None])[:2]
    rng = {
        "start": start or str(today - datetime.timedelta(days=7)),
        "end": end or str(today),
    }

    page_report(rng, path) if path else site_report(rng)
