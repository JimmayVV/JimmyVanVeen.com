---
name: metrics
description: Site metrics from GoatCounter. Use when asked about visitors, referrers, campaigns, or how a post or share performed.
---

# Metrics

The site's metrics live in GoatCounter, fed server-side by `/api/events`. Read them with the
bundled script; it knows the API's quirks so the answer can focus on what the numbers mean.

## Steps

1. **Pull the numbers.** Run `scripts/report.py` from this skill's folder:
   - no arguments: the last 7 days, whole site
   - `START END` (`YYYY-MM-DD`): a range
   - `--path /blog/<slug>`: one page, with its referrers; combine with a range

   _Done when_ the output covers the range and pages the question asked about.

2. **Report.** Lead with the answer to the question asked, then the supporting numbers, read
   through the notes below.

   _Done when_ every number you state carries the note that applies to it.

## Reading the numbers

- **Days are UTC.** The API and the browser, system and location panels count UTC days; the
  dashboard's page list uses local time. A visit late in the evening (US) lands on the next day.
- **Source tags become the referrer.** A `ref`, `src`, `source` or `utm_source` parameter
  replaces the HTTP referrer, so `x` or `linkedin` under referrers means a tagged link. Campaigns
  fill only from `campaign` or `utm_campaign`. Share links are tagged
  `?ref=<platform>&campaign=<slug>`.
- **Medium readers** arrive with Medium's own `source=collection_home_page----…` tag, so that
  string in referrers is a visit from Medium.
- **`(unknown)` referrers** are direct visits, privacy browsers and in-app browsers. Untagged
  traffic from the X and LinkedIn apps usually lands here.
- **Crawlers.** Homepage-only visits from desktop Chrome in data-centre regions (China,
  Singapore, Germany, the Netherlands) are most likely headless crawlers that GoatCounter's bot
  filter passes. Readers open posts. Count the two groups separately when summarising.
- **Sizes** are buckets: `phone`, `tablet`, `desktop`, `desktophd`.
- **History starts 2026-09-29.** Before PR #505 GoatCounter rejected every hit, so earlier ranges
  are empty because nothing was recorded, not because nobody visited.

## Setup

The script reads a read-only token from `~/.config/goatcounter/token`. When it reports the file
missing, have Jimmy:

1. Create a token at <https://jimmyvanveen.goatcounter.com/user/api> with only **Read
   statistics**.
2. Save it from his own terminal so it stays out of the conversation:
   `nano ~/.config/goatcounter/token`, then `chmod 600 ~/.config/goatcounter/token`.

The site's own token (`GOATCOUNTER_API_TOKEN` in Netlify) records pageviews only and reads back
masked, so it serves the site and this skill uses its own.
