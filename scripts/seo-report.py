#!/usr/bin/env python3
"""SEO report for shvedko.dev from Search Console and GA4.

Usage: python3 scripts/seo-report.py [days]        (default 28)

Needs Google user credentials with read access to both, saved by
`gcloud auth application-default login` with the scopes analytics.readonly and
webmasters.readonly, at ~/.config/shvedkodev-ga.json (or the path in SEO_CREDENTIALS).

GA4 traffic is reported twice: all countries, and Germany, Austria and Switzerland only.
Most sessions from elsewhere are bots (zero engagement), so the second view is the real one.
"""

import collections
import concurrent.futures
import datetime
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

SITE = 'sc-domain:shvedko.dev'
BASE = 'https://shvedko.dev'
GA_PROPERTY = '486908560'
SITEMAPS = ['sitemap-pages.xml', 'sitemap-insights-en.xml', 'sitemap-insights-de.xml']
HOME_MARKET = ['Germany', 'Austria', 'Switzerland']
# Events the site sends itself on a real form submit (see initGA4Tracking in jquery.main.js).
# GA's automatic form_submit also counts spam bots and is not used here.
LEAD_EVENTS = ['contact_form_submit', 'newsletter_signup']

DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 28


def token():
    path = os.environ.get('SEO_CREDENTIALS', os.path.expanduser('~/.config/shvedkodev-ga.json'))
    cred = json.load(open(path))
    body = urllib.parse.urlencode({
        'client_id': cred['client_id'], 'client_secret': cred['client_secret'],
        'refresh_token': cred['refresh_token'], 'grant_type': 'refresh_token'
    }).encode()
    return json.load(urllib.request.urlopen('https://oauth2.googleapis.com/token', body))['access_token']


TOKEN = token()


def call(url, body=None):
    request = urllib.request.Request(url, json.dumps(body).encode() if body else None,
                                     {'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'})
    try:
        return json.load(urllib.request.urlopen(request))
    except urllib.error.HTTPError as err:
        return {'error': err.read().decode()[:200]}


def search(dimensions, limit=25):
    today = datetime.date.today()
    url = 'https://www.googleapis.com/webmasters/v3/sites/%s/searchAnalytics/query' % urllib.parse.quote(SITE, safe='')
    return call(url, {'startDate': str(today - datetime.timedelta(days=DAYS)), 'endDate': str(today),
                      'dimensions': dimensions, 'rowLimit': limit}).get('rows', [])


def search_line(row):
    return '%4d clicks %5d impr  ctr %5.1f%%  pos %5.1f  %s' % (
        row['clicks'], row['impressions'], row['ctr'] * 100, row['position'], ' | '.join(row.get('keys', []))[:90])


def analytics(dimensions, metrics, limit=12, home_only=False, events=None):
    filters = []
    if home_only:
        filters.append({'filter': {'fieldName': 'country', 'inListFilter': {'values': HOME_MARKET}}})
    if events:
        filters.append({'filter': {'fieldName': 'eventName', 'inListFilter': {'values': events}}})
    body = {'dateRanges': [{'startDate': '%ddaysAgo' % DAYS, 'endDate': 'today'}],
            'dimensions': [{'name': d} for d in dimensions], 'metrics': [{'name': m} for m in metrics],
            'limit': limit, 'orderBys': [{'metric': {'metricName': metrics[0]}, 'desc': True}]}
    if len(filters) == 1:
        body['dimensionFilter'] = filters[0]
    elif filters:
        body['dimensionFilter'] = {'andGroup': {'expressions': filters}}
    return call('https://analyticsdata.googleapis.com/v1beta/properties/%s:runReport' % GA_PROPERTY, body).get('rows', [])


def sessions_line(row):
    values = [v['value'] for v in row['metricValues']]
    return '%5s sessions  engaged %3.0f%%  %4.0fs  %s' % (
        values[0], float(values[1]) * 100, float(values[2]),
        ' | '.join(v['value'] for v in row.get('dimensionValues', []))[:70])


def inspect(url):
    result = call('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
                  {'inspectionUrl': url, 'siteUrl': SITE})
    return url, result.get('inspectionResult', {}).get('indexStatusResult', {}).get('coverageState', 'error')


def section(url):
    path = url.replace(BASE, '')
    language = 'de' if path.startswith('/de/') else 'en'
    kind = 'insights' if '/insights/' in path else 'blog' if '/blog/' in path else 'site'
    return language + ' ' + kind


print('== Search Console, last %d days ==' % DAYS)
for row in search([]):
    print(search_line(row))
for dimensions, limit in ((['query'], 30), (['page'], 30), (['country'], 8)):
    print('-- by ' + dimensions[0])
    for row in search(dimensions, limit):
        print('  ' + search_line(row))

print('\n== Index coverage of the sitemap ==')
urls = set()
for name in SITEMAPS:
    urls.update(re.findall(r'<loc>([^<]+)</loc>', urllib.request.urlopen(BASE + '/' + name).read().decode()))
with concurrent.futures.ThreadPoolExecutor(6) as pool:
    states = list(pool.map(inspect, sorted(urls)))
table = collections.defaultdict(collections.Counter)
for url, state in states:
    table[section(url)][state] += 1
print('%d URLs: %s' % (len(states), dict(collections.Counter(state for _, state in states))))
for name in sorted(table):
    print('  %-12s %s' % (name, dict(table[name])))
print('-- not indexed')
for url, state in states:
    if state != 'Submitted and indexed':
        print('  %-36s %s' % (state, url.replace(BASE, '')))

METRICS = ['sessions', 'engagementRate', 'averageSessionDuration']
for title, home_only in (('all countries', False), (', '.join(HOME_MARKET), True)):
    print('\n== GA4, last %d days, %s ==' % (DAYS, title))
    for row in analytics([], METRICS, home_only=home_only):
        print(sessions_line(row))
    for dimension in ('sessionDefaultChannelGroup', 'landingPage'):
        print('-- by ' + dimension)
        for row in analytics([dimension], METRICS, home_only=home_only):
            print('  ' + sessions_line(row))

print('\n== Form submissions counted by the site, last %d days ==' % DAYS)
for row in analytics(['eventName', 'country'], ['eventCount'], limit=20, events=LEAD_EVENTS):
    print('  %4s  %s' % (row['metricValues'][0]['value'], ' | '.join(v['value'] for v in row['dimensionValues'])))
