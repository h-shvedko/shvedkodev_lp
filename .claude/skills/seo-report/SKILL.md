---
name: seo-report
description: SEO status report for shvedko.dev from Google Search Console and GA4 - index coverage of the sitemap, search clicks and positions, real traffic from Germany/Austria/Switzerland, change since the previous report - written in Russian under ASD-STE100 rules. Use when the user asks to check the SEO of this site, to compare SEO results with an earlier check, or runs /seo-report.
argument-hint: "[days, default 28]"
---

# /seo-report

Report the SEO status of shvedko.dev from live Google data. Data comes from the
user's own Search Console and GA4, not from estimates or third-party SEO tools.

## 1. Collect the data

Run on the host (not in the Docker container):

```bash
python3 scripts/seo-report.py <days>
```

- `<days>` is the argument of the command; use 28 when there is none.
- The run takes about three minutes: it inspects every sitemap URL. Use a timeout of 300 s.
- Add `--no-index` only when the user asks for a quick check without index coverage.
- The script reads the user's Google credentials at `~/.config/shvedkodev-ga.json`
  (read-only scopes analytics.readonly and webmasters.readonly). If the token request
  fails, stop and tell the user: the file is missing or the refresh token was revoked;
  they create it again with `gcloud auth application-default login` with those two
  scopes and copy it to that path. Never print the file or ask for its content.
- Each run saves a summary to `~/.local/state/shvedkodev-seo/<date>.json` and prints
  the change against the previous saved run. Use that block for the comparison section.

For a question the script does not answer (one query, one page, one event), call the
same APIs with the token from the script's `token()` function. Search Console URL
inspection allows 2,000 calls a day.

## 2. Read the data correctly

These facts about this site change how the numbers must be read:

- **Search Console lags 2-3 days.** The script prints the latest day with data. Never
  attribute a change to a release that happened after that day.
- **GA4 before and after 2026-10-01 is not comparable.** Since that release, GA loads only
  after the visitor accepts cookies. Fewer sessions after that date are expected.
- **Most GA traffic is bots.** Sessions from the US, Singapore, China and other countries
  with zero engagement and 0-3 s duration are noise. The real audience is the second GA
  block (Germany, Austria, Switzerland). Base conclusions on that block.
- **Conversions:** count only `contact_form_submit` and `newsletter_signup` (the site's own
  events). GA's automatic `form_submit` and the Google Ads event `ads_conversion_Form_1`
  counted form spam from the Netherlands and Russia. A honeypot field was added to all
  forms on 2026-10-02.
- **Small numbers.** Below about 100 impressions, Google hides most queries and a change of
  a few clicks is random. Say so instead of drawing conclusions.
- **Index states:** "Submitted and indexed" is good. "Discovered - currently not indexed" and
  "URL is unknown to Google" are normal for 2-4 weeks after publication; after that they
  point to weak internal links or thin content.

## 3. Know the site

- Static site built with gulp, deployed from `main` by GitHub Actions; `dist/` is build output.
- English pages at `/`, German pages at `/de/` with the same path; hreflang on every pair.
- Insight pages (`/insights/...`, `/de/insights/...`) come from `insights/data/` and are
  rendered by `insights/render.js`. Page titles and briefs are in `insights/taxonomy.js`;
  texts are written by session agents following `insights/GENERATOR.md`.
- Hand-kept pages are listed in `src/sitemap.xml`; insight sitemaps are generated.
- Baseline: 2026-10-01 release of insights and the German site. On 2026-10-02, 106 of 145
  sitemap URLs were indexed (3 before the release); 90 days of search: 16 clicks, 209
  impressions, all clicks on the home page.

## 4. Write the report

Write the report in Russian. Apply the ASD-STE100 (Simplified Technical English) rules to
Russian text:

- One idea in one sentence. Descriptive sentences: at most 25 words. Instructions: at most 20 words.
- One instruction in one sentence. Start an instruction with the verb in the imperative.
- Active voice. Present tense for facts. No conditional or speculative forms where a fact exists.
- One term for one concept, the same term in the whole report. Keep the English names of
  Google UI states and events in their original form (e.g. «Discovered - currently not indexed»,
  `contact_form_submit`), so the user can find them in the interface.
- No idioms, no jargon without definition, no filler words, no evaluative adjectives without data.
- Give numbers with their unit and period. Write a list when there are more than two items in a series.
- Paragraphs: at most six sentences.

Structure:

1. **Итог** - two or three sentences: the most important result and the main action.
2. **Индексация** - table by section (en/de x site/blog/insights): indexed, not indexed, unknown. Then the list of important pages that are not indexed.
3. **Поиск** - clicks, impressions, CTR, position for the period; pages and queries with data; the latest day with data.
4. **Посещаемость** - the DACH block first, then one line about the share of bot traffic.
5. **Заявки** - counts of `contact_form_submit` and `newsletter_signup` from DACH.
6. **Изменения** - the comparison block, with the dates of both runs.
7. **Действия** - numbered instructions in imperative form. For each, say who does it: the agent (change in this repo) or the user (Google UI, Formspree, Google Ads). Do not change the site in this command; offer the changes.

Do not invent data. When a number is not available, write that it is not available and why.
