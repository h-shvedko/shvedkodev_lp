'use strict';

// Checks the built site in dist/ through the dev server, in English and German,
// at desktop width and at 390px.

var fs = require('fs');
var path = require('path');
var pw = require('@playwright/test');
var test = pw.test, expect = pw.expect;

var DIST = path.join(__dirname, '..', 'dist');
// Build partials and the standalone Craftly landing pages are not site pages.
var SKIP = /^\/(layout|components|craftly|blog\/_post-template|de\/blog\/_post-template)/;

function urls(dir, base) {
    var list = [];
    fs.readdirSync(dir).sort().forEach(function(name) {
        var full = path.join(dir, name), url = base + name;
        if (fs.statSync(full).isDirectory()) list = list.concat(urls(full, url + '/'));
        else if (name === 'index.html') list.push(base);
        else if (/\.html$/.test(name)) list.push(url);
    });
    return list;
}

var PAGES = urls(DIST, '/').filter(function(u) { return !SKIP.test(u); });
var isGerman = function(u) { return /^\/de\//.test(u); };
// One post was written in German before the site had a German version; it keeps its old URL too.
var GERMAN_AT_ENGLISH_URL = ['/blog/posts/craftly-innovationspreis-forum-ideen-september-2026/'];
var twin = function(u) { return isGerman(u) ? u.replace(/^\/de/, '') : '/de' + u; };

test('the site has pages in both languages', function() {
    expect(PAGES.filter(isGerman).length).toBeGreaterThan(20);
    expect(PAGES.filter(function(u) { return !isGerman(u); }).length).toBeGreaterThan(20);
});

test('every page exists in the other language', function() {
    var missing = PAGES.filter(function(u) { return PAGES.indexOf(twin(u)) === -1; });
    expect(missing).toEqual([]);
});

test('every page loads, declares its language and links only to pages that exist', async function({ request }) {
    test.setTimeout(300000);
    var checked = {}, problems = [];
    for (var i = 0; i < PAGES.length; i++) {
        var url = PAGES[i];
        var res = await request.get(url);
        if (res.status() !== 200) { problems.push(url + ' -> ' + res.status()); continue; }
        var html = await res.text();
        if (html.indexOf('//= ') !== -1) problems.push(url + ' has an unresolved include');
        var lang = (html.match(/<html[^>]*lang="([^"]+)"/) || [])[1];
        var german = isGerman(url) || GERMAN_AT_ENGLISH_URL.indexOf(url) !== -1;
        if (lang !== (german ? 'de' : 'en')) problems.push(url + ' has lang="' + lang + '"');
        if ((html.match(/<title>/g) || []).length < 1) problems.push(url + ' has no title');
        if (isGerman(url) && html.indexOf('>Über uns</a>') === -1) problems.push(url + ' has no German header');
        var hrefs = html.match(/\shref="\/[^"#?]*/g) || [];
        for (var j = 0; j < hrefs.length; j++) {
            var href = hrefs[j].replace(/^\shref="/, '');
            if (checked[href] !== undefined || /^\/\//.test(href)) continue;
            checked[href] = (await request.get(href)).status();
            if (checked[href] >= 400) problems.push(url + ' links to ' + href + ' -> ' + checked[href]);
        }
    }
    expect(problems).toEqual([]);
});

test('German pages do not link back into the English site', async function({ request }) {
    var problems = [];
    var english = /\shref="\/(about|services|portfolio|blog|contact|imprint|data-protection|insights)(\/|")/;
    for (var i = 0; i < PAGES.length; i++) {
        if (!isGerman(PAGES[i])) continue;
        var html = (await (await request.get(PAGES[i])).text()).replace(/<li class="lang-switch">[\s\S]*?<\/li>/, '').replace(/<link rel="alternate"[^>]*>/g, '');
        var hit = html.match(english);
        if (hit) problems.push(PAGES[i] + ' links to ' + hit[0].trim());
    }
    expect(problems).toEqual([]);
});

test('pages in both languages point at each other with hreflang', async function({ request }) {
    var problems = [];
    for (var i = 0; i < PAGES.length; i++) {
        var url = PAGES[i];
        if (PAGES.indexOf(twin(url)) === -1) continue;
        var html = await (await request.get(url)).text();
        ['en', 'de', 'x-default'].forEach(function(code) {
            if (html.indexOf('hreflang="' + code + '" href="https://shvedko.dev') === -1) problems.push(url + ' lacks hreflang ' + code);
        });
    }
    expect(problems).toEqual([]);
});

var SAMPLE = ['/', '/de/', '/about/', '/portfolio/', '/de/services/', '/de/portfolio/', '/de/contact/', '/blog/', '/de/blog/',
    '/insights/', '/de/insights/', '/insights/guides/', '/insights/guides/laravel-vs-wordpress/',
    '/de/insights/examples/requirements-specification/', '/de/insights/services/ai-integration-for-hr/',
    '/insights/products/craftly/'];

SAMPLE.forEach(function(url) {
    test('renders without errors or sideways scrolling: ' + url, async function({ page }, info) {
        var errors = [];
        page.on('pageerror', function(err) { errors.push(String(err)); });
        var res = await page.goto(url, { waitUntil: 'load' });
        expect(res.status()).toBe(200);
        await expect(page.locator('h1').first()).toBeVisible();
        await expect(page.locator('.loader-holder')).toBeHidden();
        var overflow = await page.evaluate(function() {
            return document.documentElement.scrollWidth - document.documentElement.clientWidth;
        });
        expect(overflow).toBeLessThanOrEqual(1);
        expect(errors).toEqual([]);
        var name = (url.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'home') + '-' + info.project.name + '.png';
        await page.screenshot({ path: path.join(__dirname, 'screenshots', name), fullPage: true });
    });
});

test('the language switch leads to the same page in the other language', async function({ page }, info) {
    for (var url of ['/about/', '/insights/guides/laravel-vs-wordpress/']) {
        await page.goto(url, { waitUntil: 'load' });
        if (info.project.name === 'mobile') await page.locator('.nav-opener').click();
        await page.locator('.lang-switch a').click();
        await expect(page).toHaveURL(new RegExp('/de' + url + '$'));
        await expect(page.locator('html')).toHaveAttribute('lang', 'de');
        if (info.project.name === 'mobile') await page.locator('.nav-opener').click();
        await page.locator('.lang-switch a').click();
        await expect(page).toHaveURL(new RegExp('[^e]' + url + '$'));
    }
});

test('an insight page has a numbered contents list that matches its sections', async function({ page }, info) {
    await page.goto('/de/insights/examples/requirements-specification/', { waitUntil: 'load' });
    var toc = await page.locator('.insight__toc li a').allTextContents();
    var sections = await page.locator('.insight__section > h2').allTextContents();
    expect(toc.length).toBeGreaterThanOrEqual(4);
    expect(sections.map(function(s) { return s.replace(/^\d+\s*/, ''); })).toEqual(toc);
    await expect(page.locator('.insight__example')).toBeVisible();
    await expect(page.locator('.insight__cta .button').first()).toBeVisible();
    if (info.project.name === 'desktop') {
        await page.evaluate(function() { window.scrollTo(0, 1200); });
        var box = await page.locator('.insight__aside').boundingBox();
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeLessThan(200);
    }
});

test('analytics loads only after the visitor accepts cookies', async function({ page }) {
    var analytics = [];
    page.on('request', function(req) {
        if (/googletagmanager\.com|google-analytics\.com/.test(req.url())) analytics.push(req.url());
    });
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('#cookie-banner')).toBeVisible();
    expect(analytics).toEqual([]);

    await page.locator('#cookie-decline').click();
    await expect(page.locator('#cookie-banner')).toBeHidden();
    await page.goto('/de/', { waitUntil: 'load' });
    await expect(page.locator('#cookie-banner')).toBeHidden();
    expect(analytics).toEqual([]);

    await page.evaluate(function() { localStorage.clear(); });
    await page.reload({ waitUntil: 'load' });
    await page.locator('#cookie-accept').click();
    await expect.poll(function() { return analytics.length; }).toBeGreaterThan(0);
});

test('the portfolio gallery opens without script errors', async function({ page }) {
    var errors = [];
    page.on('pageerror', function(err) { errors.push(String(err)); });
    await page.goto('/portfolio/', { waitUntil: 'load' });
    // The link sits under a hover overlay, so it is clicked through the DOM.
    await page.locator('[data-fancybox]').first().dispatchEvent('click');
    await expect(page.locator('.fancybox-container')).toHaveCount(1);
    expect(errors).toEqual([]);
});
