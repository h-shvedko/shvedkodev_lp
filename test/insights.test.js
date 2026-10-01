'use strict';

// Run with: npm test   (node --test test/)

var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('fs');
var os = require('os');
var path = require('path');

var taxonomy = require('../insights/taxonomy');
var locales = require('../insights/locales');
var i18n = require('../insights/i18n');
var store = require('../insights/store');
var validate = require('../insights/validate');
var pipeline = require('../insights/pipeline');
var render = require('../insights/render');

var LAYOUT_DIR = path.join(__dirname, '..', 'src', 'html', 'layout');

function tmp() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'insights-'));
}

function sentence(n, word) {
    return new Array(n + 1).join((word || 'word') + ' ').trim();
}

// A faked model answer that passes validation for `page`.
function answer(page, overrides) {
    var entity = taxonomy.label(page.axis, page.entity_a, page.entity_b, page.locale);
    var raw = {
        subtitle: 'What decides the outcome for ' + entity + ' and how to plan for it.',
        overview: '## First part\n\n' + sentence(320) + '\n\n- one point\n- another point',
        personas: [
            { key: 'founder', text: sentence(20) },
            { key: 'cto', text: sentence(20) },
            { key: 'project_manager', text: sentence(20) }
        ],
        faq: [
            { q: 'How long does this usually take?', a: sentence(20) },
            { q: 'What does it depend on most?', a: sentence(20) },
            { q: 'Who should be involved from our side?', a: sentence(20) }
        ],
        meta_description: (entity + ' (' + page.locale + '): what it involves, what drives effort and what to check before you commit to a provider.').slice(0, 150)
    };
    if (page.axis === 'examples') {
        raw.example_intro = 'An invented example for illustration.';
        raw.example_document = sentence(160);
    }
    return Object.assign(raw, overrides || {});
}

function drop(inbox, page, raw) {
    var file = path.join(inbox, store.id(page) + '.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, typeof raw === 'string' ? raw : JSON.stringify(raw));
}

// Seeds a temporary store and takes the pages matching `filter` to `status`.
function prepared(filter, status) {
    var dir = tmp(), inbox = tmp();
    pipeline.seed(dir);
    store.all(dir).forEach(function(p) {
        if (Object.keys(filter).every(function(k) { return p[k] === filter[k]; })) drop(inbox, p, answer(p));
    });
    var result = pipeline.ingest(inbox, dir);
    assert.deepEqual(result.rejected, []);
    if (status === 'approved' || status === 'published') pipeline.approve(dir);
    if (status === 'published') assert.deepEqual(pipeline.publish(dir).blocked, []);
    return dir;
}

function buildTo(dir, preview) {
    var out = tmp();
    fs.writeFileSync(path.join(out, '.htaccess'), 'RewriteEngine On\n');
    var sitemapSrc = path.join(out, 'src-sitemap.xml');
    fs.writeFileSync(sitemapSrc, '<urlset></urlset>');
    var result = render.build({ dataDir: dir, outDir: out, layoutDir: LAYOUT_DIR, sitemapSrc: sitemapSrc, preview: !!preview });
    return { out: out, result: result };
}

function html(out, url) {
    return fs.readFileSync(path.join(out, url, 'index.html'), 'utf8');
}

function htmlFiles(dir) {
    var files = [];
    fs.readdirSync(dir).forEach(function(name) {
        var full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) files = files.concat(htmlFiles(full));
        else if (/\.html$/.test(name)) files.push(full);
    });
    return files;
}

test('taxonomy: every entry has a label in every locale and a unique slug', function() {
    locales.all().forEach(function(locale) {
        var slugs = {};
        taxonomy.entries().forEach(function(en) {
            var label = taxonomy.label(en.axis, en.entity_a, en.entity_b, locale);
            assert.ok(label && label.length > 2);
            var slug = taxonomy.slugFor(en.axis, en.entity_a, en.entity_b, locale);
            assert.ok(/^[a-z0-9\/-]+$/.test(slug), slug);
            assert.ok(!slugs[slug], 'duplicate slug ' + slug);
            slugs[slug] = true;
            assert.ok(taxonomy.brief(en.axis, en.entity_a, en.entity_b).length > 40);
        });
    });
});

test('taxonomy: slugs share their words across locales, with a locale prefix outside English', function() {
    assert.equal(taxonomy.slugFor('guides', 'laravel-vs-wordpress', '', 'en'), 'insights/guides/laravel-vs-wordpress');
    assert.equal(taxonomy.slugFor('guides', 'laravel-vs-wordpress', '', 'de'), 'de/insights/guides/laravel-vs-wordpress');
    assert.equal(taxonomy.slugFor('services', 'ai-integration', 'hr', 'de'), 'de/insights/services/ai-integration-for-hr');
    assert.equal(taxonomy.slugFor('products', 'craftly', '', 'en'), 'insights/products/craftly');
    assert.equal(taxonomy.slugFor('products', 'jobhunter', 'job-alerts', 'en'), 'insights/products/jobhunter-job-alerts');
});

test('taxonomy: only gated service x industry pairs exist, and parents are real guides', function() {
    assert.equal(taxonomy.has('services', 'laravel-development', 'education'), true);
    assert.equal(taxonomy.has('services', 'wordpress-development', 'hr'), false);
    assert.throws(function() { taxonomy.slugFor('services', 'wordpress-development', 'hr', 'en'); });
    taxonomy.entries().forEach(function(en) {
        if (en.axis === 'services') {
            assert.ok(taxonomy.SERVICES[en.entity_a], en.entity_a);
            assert.ok(taxonomy.INDUSTRIES[en.entity_b], en.entity_b);
        }
        var parent = taxonomy.parent(en.axis, en.entity_a);
        if (parent) assert.ok(taxonomy.has('guides', parent, ''));
    });
});

test('i18n: German covers every key and an unknown key throws instead of leaking', function() {
    i18n.keys().forEach(function(key) {
        assert.ok(i18n.STRINGS.de[key] !== undefined, 'missing de: ' + key);
    });
    taxonomy.PERSONA_KEYS.forEach(function(key) { assert.ok(i18n.t('en', 'persona.' + key)); });
    assert.throws(function() { i18n.t('de', 'ui.nope'); });
});

test('seed: one draft per taxonomy entry per locale, and a second run adds nothing', function() {
    var dir = tmp(), expected = taxonomy.entries().length;
    var first = pipeline.seed(dir);
    assert.equal(first.created, expected * locales.all().length);
    locales.all().forEach(function(locale) {
        assert.equal(store.all(dir).filter(function(p) { return p.locale === locale; }).length, expected);
    });
    var second = pipeline.seed(dir);
    assert.equal(second.created, 0);
    assert.equal(second.existing, first.created);
    assert.ok(store.all(dir).every(function(p) { return p.status === 'draft' && p.entity_b !== null; }));
});

test('jobs: one per draft without text, with the language name and the right keys', function() {
    var dir = tmp();
    pipeline.seed(dir);
    var jobs = pipeline.jobs(dir, { locale: 'de', axis: 'examples' });
    assert.equal(jobs.length, taxonomy.entries().filter(function(en) { return en.axis === 'examples'; }).length);
    assert.equal(jobs[0].language, 'German');
    assert.ok(jobs[0].keys.indexOf('example_document') !== -1);
    assert.ok(pipeline.jobs(dir, { locale: 'en', axis: 'guides' })[0].keys.indexOf('example_document') === -1);
});

test('validate: a good answer is accepted', function() {
    var page = store.blank({ axis: 'guides', entity_a: 'laravel-vs-wordpress', entity_b: '', locale: 'en' });
    var out = validate.fragment(page, answer(page));
    assert.equal(out.personas.length, 3);
    assert.equal(out.example_body, null);
});

test('validate: a meta description without the entity name is repaired, not rejected', function() {
    var page = store.blank({ axis: 'guides', entity_a: 'laravel-vs-wordpress', entity_b: '', locale: 'de' });
    var meta = 'Welche Plattform zu welchem Projekt passt, mit Kosten, Wartung und Aufwand im direkten Vergleich für Ihre Entscheidung im Projekt.';
    var out = validate.fragment(page, answer(page, { meta_description: meta }));
    assert.ok(out.meta_description.indexOf('Laravel vs. WordPress: ') === 0);
    assert.ok(out.meta_description.length <= 150);
    assert.ok(!/\s$/.test(out.meta_description));
    assert.ok(meta.indexOf(out.meta_description.slice('Laravel vs. WordPress: '.length)) === 0, 'cut on a word boundary');
});

test('validate: banned openers and phrases are rejected', function() {
    var page = store.blank({ axis: 'guides', entity_a: 'laravel-vs-wordpress', entity_b: '', locale: 'en' });
    assert.throws(function() {
        validate.fragment(page, answer(page, { subtitle: 'Discover how Laravel and WordPress compare for your next project.' }));
    }, validate.FragmentRejected);
    assert.throws(function() {
        validate.fragment(page, answer(page, { subtitle: 'A comprehensive guide to choosing between Laravel and WordPress.' }));
    }, validate.FragmentRejected);
    var de = store.blank({ axis: 'guides', entity_a: 'laravel-vs-wordpress', entity_b: '', locale: 'de' });
    assert.throws(function() {
        validate.fragment(de, answer(de, { subtitle: 'Entdecken Sie die Unterschiede zwischen Laravel und WordPress.' }));
    }, validate.FragmentRejected);
});

test('validate: personas must be exactly three distinct keys from the fixed list', function() {
    var page = store.blank({ axis: 'guides', entity_a: 'laravel-vs-wordpress', entity_b: '', locale: 'en' });
    var good = answer(page).personas;
    [
        good.slice(0, 2),
        [good[0], good[1], { key: 'wizard', text: good[2].text }],
        [good[0], good[1], { key: 'founder', text: good[2].text }]
    ].forEach(function(personas) {
        assert.throws(function() { validate.fragment(page, answer(page, { personas: personas })); }, validate.FragmentRejected);
    });
});

test('validate: length passes by words or by characters, and reports every problem at once', function() {
    var page = store.blank({ axis: 'guides', entity_a: 'laravel-vs-wordpress', entity_b: '', locale: 'de' });
    // Few words, many characters: compound-heavy text.
    var compounds = sentence(120, 'Softwareentwicklungsdienstleistungsvertrag');
    assert.ok(validate.fragment(page, answer(page, { overview: compounds })));
    try {
        validate.fragment(page, answer(page, { overview: 'Too short.', faq: [], subtitle: '<b>x</b>' }));
        assert.fail('should reject');
    } catch (err) {
        assert.ok(err instanceof validate.FragmentRejected);
        assert.ok(err.reasons.length >= 3, err.reasons.join('; '));
    }
});

test('validate: example pages need both parts, and an array answer is flattened', function() {
    var page = store.blank({ axis: 'examples', entity_a: 'user-story', entity_b: '', locale: 'en' });
    var out = validate.fragment(page, answer(page, { example_document: ['## Story', sentence(160), '- criterion'] }));
    assert.ok(out.example_body.indexOf('An invented example') === 0);
    assert.ok(out.example_body.indexOf('## Story\n') !== -1);
    var raw = answer(page);
    delete raw.example_document;
    assert.throws(function() { validate.fragment(page, raw); }, validate.FragmentRejected);
});

test('ingest: all or nothing, and approved or published text is never overwritten', function() {
    var dir = tmp(), inbox = tmp();
    pipeline.seed(dir);
    var page = store.read({ axis: 'guides', entity_a: 'laravel-vs-wordpress', entity_b: '', locale: 'en' }, dir);
    var other = store.read({ axis: 'guides', entity_a: 'api-integration-guide', entity_b: '', locale: 'en' }, dir);

    drop(inbox, page, answer(page, { faq: [] }));
    drop(inbox, other, '{ not json');
    var result = pipeline.ingest(inbox, dir);
    assert.equal(result.accepted.length, 0);
    assert.equal(result.rejected.length, 2);
    var untouched = store.read(page, dir);
    assert.equal(untouched.status, 'draft');
    assert.equal(untouched.subtitle, null);

    drop(inbox, page, answer(page));
    drop(inbox, other, answer(other, { meta_description: answer(page).meta_description.replace('Laravel vs WordPress', 'API Integration Guide') }));
    result = pipeline.ingest(inbox, dir);
    assert.deepEqual(result.rejected, []);
    assert.equal(store.read(page, dir).status, 'needs_review');

    pipeline.approve(dir, { entity_a: 'laravel-vs-wordpress' });
    drop(inbox, page, answer(page, { subtitle: 'A different subtitle that should never replace the approved one.' }));
    result = pipeline.ingest(inbox, dir);
    assert.equal(result.rejected.length, 1);
    assert.notEqual(store.read(page, dir).subtitle, 'A different subtitle that should never replace the approved one.');

    assert.equal(pipeline.reset(dir, { entity_a: 'laravel-vs-wordpress', locale: 'en' }).length, 1);
    assert.equal(pipeline.ingest(inbox, dir).accepted.length, 1);
});

test('ingest: a duplicate meta description is rejected', function() {
    var dir = tmp(), inbox = tmp();
    pipeline.seed(dir);
    var a = store.read({ axis: 'products', entity_a: 'craftly', entity_b: '', locale: 'en' }, dir);
    var b = store.read({ axis: 'products', entity_a: 'craftly', entity_b: 'laravel', locale: 'en' }, dir);
    var meta = 'Craftly for Laravel and Craftly itself: what it generates, who it is for and where a developer is still needed.';
    drop(inbox, a, answer(a, { meta_description: meta }));
    assert.equal(pipeline.ingest(inbox, dir).accepted.length, 1);
    drop(inbox, b, answer(b, { meta_description: meta }));
    assert.match(pipeline.ingest(inbox, dir).rejected[0].reasons[0], /duplicates/);
});

test('publish guard: blocks a bad meta length, a duplicate meta and a removed entity', function() {
    var page = Object.assign(store.blank({ axis: 'guides', entity_a: 'laravel-vs-wordpress', entity_b: '', locale: 'en' }), {
        subtitle: 's', overview: 'o', personas: [], faq: [], meta_description: sentence(22)
    });
    assert.deepEqual(validate.publishBlockers(page, [page]), []);
    assert.match(validate.publishBlockers(Object.assign({}, page, { meta_description: 'Too short.' }), [])[0], /length/);
    var twin = Object.assign({}, page, { entity_a: 'api-integration-guide' });
    assert.match(validate.publishBlockers(page, [page, twin])[0], /not unique/);
    assert.match(validate.publishBlockers(Object.assign({}, page, { entity_a: 'gone' }), [])[0], /taxonomy/);
    assert.match(validate.publishBlockers(Object.assign({}, page, { overview: null }), [])[0], /overview missing/);
});

test('retire: covers every locale and needs a filter; guard retires entities that left the taxonomy', function() {
    var dir = tmp();
    pipeline.seed(dir);
    assert.throws(function() { pipeline.retire(dir, {}); });
    var retired = pipeline.retire(dir, { axis: 'services', entity_b: 'hr' });
    assert.equal(retired.length, 4 * locales.all().length);
    assert.equal(pipeline.retire(dir, { axis: 'services', entity_b: 'hr' }).length, 0);

    store.write(store.blank({ axis: 'guides', entity_a: 'no-longer-here', entity_b: '', locale: 'en' }), dir);
    assert.deepEqual(pipeline.guard(dir), ['en/guides/no-longer-here']);
});

test('render: only published pages are built; preview adds unpublished ones as noindex', function() {
    var dir = prepared({ axis: 'guides', locale: 'en' }, 'approved');
    var normal = buildTo(dir);
    assert.equal(normal.result.pages, 0);
    assert.ok(!fs.existsSync(path.join(normal.out, 'insights')));
    assert.ok(!fs.existsSync(path.join(normal.out, 'sitemap.xml')));

    var preview = buildTo(dir, true);
    assert.equal(preview.result.pages, 16);
    assert.match(html(preview.out, 'insights/guides/laravel-vs-wordpress'), /<meta name="robots" content="noindex, nofollow">/);
    assert.ok(!fs.existsSync(path.join(preview.out, 'sitemap.xml')));

    pipeline.publish(dir);
    var live = html(buildTo(dir).out, 'insights/guides/laravel-vs-wordpress');
    assert.ok(live.indexOf('noindex') === -1);
});

test('render: language, canonical and hreflang follow the locales that have the page', function() {
    var dir = prepared({ axis: 'guides' }, 'published');
    pipeline.retire(dir, { entity_a: 'figma-to-laravel', locale: 'de' });
    var out = buildTo(dir).out;

    var de = html(out, 'de/insights/guides/laravel-vs-wordpress');
    assert.match(de, /<html lang="de">/);
    assert.match(de, /<link rel="canonical" href="https:\/\/shvedko\.dev\/de\/insights\/guides\/laravel-vs-wordpress\/">/);
    assert.match(de, /hreflang="en" href="https:\/\/shvedko\.dev\/insights\/guides\/laravel-vs-wordpress\/"/);
    assert.match(de, /hreflang="de" href="https:\/\/shvedko\.dev\/de\/insights\/guides\/laravel-vs-wordpress\/"/);
    assert.match(de, /hreflang="x-default" href="https:\/\/shvedko\.dev\/insights\/guides\/laravel-vs-wordpress\/"/);
    assert.equal(de.match(/<title>/g).length, 1);
    assert.match(de, /<title>Laravel vs\. WordPress · ShvedkoDev<\/title>/);

    // The German translation is retired: no German hreflang, and the picker falls back to the German index.
    var en = html(out, 'insights/guides/figma-to-laravel');
    assert.ok(en.indexOf('hreflang="de" href=') === -1);
    assert.match(en, /<li class="lang-switch"><a href="\/de\/insights\/" hreflang="de" lang="de" title="Deutsch" data-lang-fixed><img src="\/images\/flag-de\.svg"/);
    assert.ok(!fs.existsSync(path.join(out, 'de/insights/guides/figma-to-laravel')));
    // The narrow guide links to its parent.
    assert.match(en, /class="insight__parent">[^<]*<a href="\/insights\/guides\/figma-to-wordpress\/"/);
});

test('render: German pages get German chrome and titles from our translations', function() {
    var dir = prepared({ axis: 'guides', locale: 'de' }, 'published');
    var de = html(buildTo(dir).out, 'de/insights/guides/laravel-vs-wordpress');
    assert.match(de, />Über uns<\/a>/);
    assert.match(de, />Impressum<\/a>/);
    assert.match(de, /Diese Website verwendet Cookies/);
    assert.match(de, /<a href="\/de\/about\/">Über uns<\/a>/);
    assert.match(de, /<h3>Gründerinnen und Gründer<\/h3>/);
    // The header and footer links lead to the German index.
    assert.ok(de.indexOf('<li><a href="/de/insights/">Insights</a></li>') !== -1, 'header');
    assert.ok(de.indexOf('<li><a href="/de/insights/" style=') !== -1, 'footer');
    assert.ok(de.indexOf('href="/insights/"') === -1);
    assert.ok(de.indexOf('>About us<') === -1);
    // English is not built, so nothing points at it.
    assert.ok(de.indexOf('lang-switch') === -1);
    assert.ok(de.indexOf('x-default') === -1);
});

test('render: section numbers match the contents list, and example pages get an example section', function() {
    var dir = prepared({ locale: 'en' }, 'published');
    var out = buildTo(dir).out;
    ['insights/guides/laravel-vs-wordpress', 'insights/examples/user-story'].forEach(function(url) {
        var page = html(out, url);
        var toc = page.match(/<nav class="insight__toc"[\s\S]*?<\/nav>/)[0].match(/href="#([a-z]+)"/g).map(function(h) { return h.slice(7, -1); });
        var sections = [], re = /<section class="insight__section" id="([a-z]+)"><h2><span class="insight__num">(\d+)<\/span>/g, m;
        while ((m = re.exec(page))) sections.push(m);
        assert.deepEqual(sections.map(function(s) { return s[1]; }), toc);
        sections.forEach(function(s, i) { assert.equal(Number(s[2]), i + 1); });
        assert.equal(toc.indexOf('example') !== -1, /examples/.test(url));
    });
});

test('render: hubs carry subtitles and are built only with at least two pages', function() {
    var dir = prepared({ locale: 'en' }, 'published');
    pipeline.retire(dir, { axis: 'products', entity_a: 'jobhunter' });
    ['laravel', 'wordpress', 'figma-to-wordpress'].forEach(function(b) {
        pipeline.retire(dir, { axis: 'products', entity_a: 'craftly', entity_b: b });
    });
    var out = buildTo(dir).out;
    var hub = html(out, 'insights/guides');
    assert.equal(hub.match(/<ul class="insight-list">[\s\S]*?<\/ul>/)[0].match(/<li><a href=[^>]+>[^<]+<\/a><p>[^<]+<\/p><\/li>/g).length, 16);
    assert.ok(!fs.existsSync(path.join(out, 'insights/products/index.html')), 'a hub with one page is not built');
    var index = html(out, 'insights');
    assert.ok(index.indexOf('href="/insights/products/"') === -1, 'and not linked');
    assert.ok(index.indexOf('href="/insights/products/craftly/"') !== -1);
    assert.ok(!fs.existsSync(path.join(out, 'de/insights')), 'no index for a locale without pages');
});

test('render: no raw translation keys and no unescaped model text in any page', function() {
    var dir = tmp(), inbox = tmp();
    pipeline.seed(dir);
    store.all(dir).forEach(function(p) {
        drop(inbox, p, answer(p, { subtitle: 'Costs & effort for "' + taxonomy.label(p.axis, p.entity_a, p.entity_b, p.locale) + '" at a glance > plan.' }));
    });
    assert.deepEqual(pipeline.ingest(inbox, dir).rejected, []);
    var out = buildTo(dir, true).out;
    var files = htmlFiles(path.join(out, 'insights')).concat(htmlFiles(path.join(out, 'de', 'insights')));
    assert.ok(files.length > taxonomy.entries().length * 2);
    files.forEach(function(file) {
        var page = fs.readFileSync(file, 'utf8');
        // Asset URLs such as jquery-ui.min.css are not translation keys.
        var text = page.replace(/<script[\s\S]*?<\/script>/g, '').replace(/\s(?:href|src)="[^"]*"/g, '');
        var leak = text.match(/\b(?:ui|axis|axis_intro|note|cta|persona)\.[a-z_]+\b/);
        assert.equal(leak, null, file + ' leaks ' + leak);
        assert.ok(page.indexOf('at a glance > plan') === -1, file + ' has unescaped text');
    });
});

test('sitemap: an index, the site pages, and one file per locale with pages, hubs and hreflang', function() {
    var dir = prepared({ axis: 'guides' }, 'published');
    var built = buildTo(dir);
    var index = fs.readFileSync(path.join(built.out, 'sitemap.xml'), 'utf8');
    assert.match(index, /<sitemapindex/);
    ['sitemap-pages.xml', 'sitemap-insights-en.xml', 'sitemap-insights-de.xml'].forEach(function(name) {
        assert.ok(index.indexOf('<loc>https://shvedko.dev/' + name + '</loc>') !== -1, name);
        assert.ok(fs.existsSync(path.join(built.out, name)), name);
    });
    var de = fs.readFileSync(path.join(built.out, 'sitemap-insights-de.xml'), 'utf8');
    assert.equal(de.match(/<loc>/g).length, 16 + 2);
    assert.ok(de.indexOf('<loc>https://shvedko.dev/de/insights/</loc>') !== -1);
    assert.ok(de.indexOf('<loc>https://shvedko.dev/de/insights/guides/</loc>') !== -1);
    assert.ok(de.indexOf('hreflang="x-default" href="https://shvedko.dev/insights/guides/laravel-vs-wordpress/"') !== -1);
    assert.ok(de.indexOf('https://shvedko.dev/insights/guides/laravel-vs-wordpress/</loc>') === -1, 'English pages stay in the English file');
});

test('retired pages answer 410 and the block is rewritten, not appended twice', function() {
    var dir = prepared({ axis: 'guides' }, 'published');
    pipeline.retire(dir, { entity_a: 'mvp-development-timeline' });
    var out = tmp();
    fs.writeFileSync(path.join(out, '.htaccess'), 'RewriteEngine On\n');
    var opts = { dataDir: dir, outDir: out, layoutDir: LAYOUT_DIR, sitemapSrc: path.join(out, 'none.xml') };
    render.build(opts);
    render.build(opts);
    var htaccess = fs.readFileSync(path.join(out, '.htaccess'), 'utf8');
    assert.equal(htaccess.match(/RedirectMatch gone/g).length, 2);
    assert.ok(htaccess.indexOf('RedirectMatch gone ^/insights/guides/mvp-development-timeline/?$') !== -1);
    assert.ok(htaccess.indexOf('RedirectMatch gone ^/de/insights/guides/mvp-development-timeline/?$') !== -1);
    assert.ok(htaccess.indexOf('RewriteEngine On') === 0);
    assert.ok(!fs.existsSync(path.join(out, 'insights/guides/mvp-development-timeline')));
});
