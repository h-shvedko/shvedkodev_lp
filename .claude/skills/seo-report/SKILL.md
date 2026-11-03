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
python3 -u scripts/seo-report.py <days> > /tmp/seo-report.txt 2>&1
```

- `<days>` is the argument of the command; use 28 when there is none.
- The run takes three to eight minutes: it inspects every sitemap URL and Google is sometimes slow.
  Use a timeout of 600 s. Keep `-u` and the redirect to a file: without them, output is lost
  when the run is stopped by a timeout.
- Add `--no-index` only when the user asks for a quick check without index coverage.
- The script reads the user's Google credentials at `~/.config/shvedkodev-ga.json`
  (read-only scopes analytics.readonly and webmasters.readonly). If the token request
  fails, stop and tell the user: the file is missing or the refresh token was revoked;
  they create it again with `gcloud auth application-default login` with those two
  scopes and copy it to that path. Never print the file or ask for its content.
- Each run saves a summary to `~/.local/state/shvedkodev-seo/<date>.json` and prints
  the change against the previous saved run. Use that block for the comparison section.
  The script writes this summary itself and stores Google and GA4 numbers only; Bing
  and manual-action results are not stored there, so compare them with the previous
  report in the conversation if there is one.

For a question the script does not answer (one query, one page, one event), call the
same APIs with the token from the script's `token()` function. Search Console URL
inspection allows 2,000 calls a day.

## 1a. Manual actions and security issues (Google)

The Search Console API does not expose these. Never infer them from traffic.
If the user pasted them in this conversation, use that. Otherwise do not block
the report: put both pages under «Действия» as a request to the user for
`sc-domain:shvedko.dev`:

- Search Console -> Security & Manual Actions -> **Manual actions**
- Search Console -> Security & Manual Actions -> **Security issues**

Report each as "No issues detected" or quote the action type, scope
(site-wide / partial) and date. A manual action goes first in «Итог» and
becomes action 1 (fix + reconsideration request). Ask for this check
prominently whenever impressions fell by more than 50% against the previous run
while the site answers 200 and robots/canonical are correct.

## 1b. Bing Webmaster Tools

A second, independent view. If Bing holds steady while Google drops, the cause
is Google's assessment of the site, not its technique.

```bash
K=$(grep -m1 '^BING_API_KEY=' /srv/fast/projects/shvedkodev_lp/.env | cut -d= -f2- | tr -d '"'"'"'\r')
B="https://ssl.bing.com/webmaster/api.svc/json"
SITE="https%3A%2F%2Fshvedko.dev%2F"
b(){ curl -s "$B/$1?siteUrl=$SITE&apikey=$K"; }
```

The key is `BING_API_KEY` in the project `.env` (git-ignored). Never print it,
never put it in a commit or in the report.

Every answer is `{"d": ...}`. Dates are `/Date(<ms>)/`: convert, keep the last
N days. If the key is empty or an answer is 401, say so (the user generates a
key in Bing Webmaster -> Settings -> API access and puts it in `.env`) and
report on the rest.

- `b GetRankAndTrafficStats`: one row per day, `Clicks`, `Impressions` -> the trend
- `b GetQueryStats`: rows per query and period (`Query`, `Clicks`,
  `Impressions`, `AvgImpressionPosition`). Sum per query across rows. Split
  brand / non-brand with the brand regex `shvedko|craftly|jobhunter` (case-insensitive),
  the same split as for Google queries. `AvgClickPosition = -1` means no clicks, not a position
- `b GetPageStats`: same shape, the page URL is in the **`Query`** field.
  Count `/insights/` and `/de/` pages, flag `www.` and `http://`
- `b GetCrawlStats`: one row per day: `CrawledPages`, `InIndex`, `CrawlErrors`,
  `Code4xx`, `Code5xx`, `InLinks`. Compare the first and the last row of the period
- `b GetCrawlIssues`: URLs with crawl problems (empty list = none)

Do not submit URLs through the API (`SubmitUrl*`, IndexNow) unless the user asks.

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
6. **Ручные меры и безопасность** - the result of step 1a, or the request to the user.
7. **Bing** - clicks, impressions, brand vs non-brand, pages with impressions, in index and crawl per day, and one table next to Google:

   | | Google | Bing |
   |---|---|---|
   | Клики / показы | | |
   | Показы не по бренду | | |
   | Страниц с показами | | |
   | Обход в день (начало / конец периода) | | |
   | В индексе | | |
8. **Изменения** - the comparison block, with the dates of both runs.
9. **Действия** - numbered instructions in imperative form. For each, say who does it: the agent (change in this repo) or the user (Google UI, Bing Webmaster, Formspree, Google Ads). Do not change the site in this command; offer the changes.

Do not invent data. When a number is not available, write that it is not available and why.
