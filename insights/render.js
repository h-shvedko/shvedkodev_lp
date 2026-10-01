'use strict';

// Renders insight pages, hubs and sitemaps into the build directory, inside the same
// layout partials the rest of the site uses.

var fs = require('fs');
var path = require('path');
var taxonomy = require('./taxonomy');
var locales = require('./locales');
var store = require('./store');
var i18n = require('./i18n');

var ROOT = path.join(__dirname, '..');
var SITE_URL = 'https://shvedko.dev';
var DEFAULTS = {
    dataDir: store.DATA_DIR,
    outDir: path.join(ROOT, 'dist'),
    layoutDir: path.join(ROOT, 'src', 'html', 'layout'),
    sitemapSrc: path.join(ROOT, 'src', 'sitemap.xml'),
    preview: false
};
var HTACCESS_START = '# insights: retired pages (generated)';
var HTACCESS_END = '# /insights';

function e(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function urlFor(page) {
    return '/' + taxonomy.slugFor(page.axis, page.entity_a, page.entity_b, page.locale, true) + '/';
}

function indexUrl(locale) {
    return (locale === locales.DEFAULT_LOCALE ? '' : '/' + locale) + '/insights/';
}

function hubUrl(locale, axis) {
    return indexUrl(locale) + axis + '/';
}

function title(page) {
    return taxonomy.label(page.axis, page.entity_a, page.entity_b, page.locale);
}

function sameEntity(a, b) {
    return a.axis === b.axis && a.entity_a === b.entity_a && a.entity_b === b.entity_b;
}

// Plain text with blank-line paragraphs, optional "## " headings and "- " lists.
function blocks(text) {
    return text.split(/\n\s*\n/).map(function(block) {
        var lines = block.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
        if (!lines.length) return '';
        if (/^#{2,3} /.test(lines[0]) && lines.length === 1) return '<h3>' + e(lines[0].replace(/^#{2,3} /, '')) + '</h3>';
        if (lines.every(function(l) { return /^[-*] /.test(l); })) {
            return '<ul>' + lines.map(function(l) { return '<li>' + e(l.replace(/^[-*] /, '')) + '</li>'; }).join('') + '</ul>';
        }
        var head = '';
        if (/^#{2,3} /.test(lines[0])) head = '<h3>' + e(lines.shift().replace(/^#{2,3} /, '')) + '</h3>';
        return head + '<p>' + lines.map(e).join('<br>') + '</p>';
    }).join('\n');
}

// The site layout in the page language: header.<locale>.html and footer.<locale>.html
// where they exist, the English partials otherwise.
function chrome(opts, locale, picker) {
    function partial(name) {
        var own = path.join(opts.layoutDir, name.replace(/\.html$/, '.' + locale + '.html'));
        return fs.readFileSync(fs.existsSync(own) ? own : path.join(opts.layoutDir, name), 'utf8');
    }
    var head = partial('head.html').replace(/<title>[^<]*<\/title>\s*/, '');
    // The partial's own language link is generic; ours points at the translation of this page.
    var header = partial('header.html').replace(' class="active"', '')
        .replace(/[ \t]*<li class="lang-switch">[\s\S]*?<\/li>\n?/, picker ? picker + '\n' : '');
    return { head: head, header: header, footer: partial('footer.html') };
}

function document(opts, d) {
    var picker = d.alternates.filter(function(a) { return a.locale !== d.locale; }).map(function(a) {
        return '                    <li class="lang-switch"><a href="' + a.url + '" hreflang="' + locales.bcp47(a.locale) + '" lang="' + locales.bcp47(a.locale) + '" title="' + locales.nativeName(a.locale) + '" data-lang-fixed><img src="/images/flag-' + a.locale + '.svg" alt="' + locales.nativeName(a.locale) + '" width="24" height="16"></a></li>';
    }).join('\n');
    var c = chrome(opts, d.locale, picker);
    var links = d.hreflang.map(function(a) {
        return '<link rel="alternate" hreflang="' + locales.bcp47(a.locale) + '" href="' + SITE_URL + a.url + '">';
    });
    var xDefault = d.hreflang.filter(function(a) { return a.locale === locales.DEFAULT_LOCALE; })[0];
    if (xDefault) links.push('<link rel="alternate" hreflang="x-default" href="' + SITE_URL + xDefault.url + '">');
    return [
        '<!doctype html>',
        '<html lang="' + locales.bcp47(d.locale) + '">',
        '',
        '<head>',
        c.head.trim(),
        '<title>' + e(d.title) + ' · ShvedkoDev</title>',
        '<meta name="description" content="' + e(d.description) + '">',
        '<link rel="canonical" href="' + SITE_URL + d.url + '">',
        links.join('\n'),
        opts.preview ? '<meta name="robots" content="noindex, nofollow">' : '',
        d.jsonLd ? '<script type="application/ld+json">' + JSON.stringify(d.jsonLd).replace(/</g, '\\u003c') + '</script>' : '',
        '</head>',
        '',
        '<body>',
        '    <div id="wrapper">',
        '        <div class="loader-holder">',
        '            <div class="loader"></div>',
        '        </div>',
        c.header,
        '        <main role="main" id="main" class="insight-main">',
        '            <div class="container">',
        d.body,
        '            </div>',
        '        </main>',
        c.footer,
        '</body>',
        '',
        '</html>',
        ''
    ].filter(function(line) { return line !== ''; }).join('\n');
}

function sectionLinks(ctx, locale, current) {
    var items = ['<li><a href="' + indexUrl(locale) + '"' + (current === 'index' ? ' aria-current="page"' : '') + '>' + e(i18n.t(locale, 'ui.all_pages')) + '</a></li>'];
    taxonomy.AXES.forEach(function(axis) {
        if (!ctx.hubs[locale + ' ' + axis]) return;
        items.push('<li><a href="' + hubUrl(locale, axis) + '"' + (current === axis ? ' aria-current="page"' : '') + '>' + e(i18n.t(locale, 'axis.' + axis)) + '</a></li>');
    });
    return '<nav class="insight__nav" aria-label="' + e(i18n.t(locale, 'ui.sections')) + '">' +
        '<h2>' + e(i18n.t(locale, 'ui.sections')) + '</h2><ul>' + items.join('') + '</ul></nav>';
}

function pageList(pages) {
    return '<ul class="insight-list">' + pages.map(function(p) {
        return '<li><a href="' + urlFor(p) + '">' + e(title(p)) + '</a><p>' + e(p.subtitle) + '</p></li>';
    }).join('') + '</ul>';
}

function related(ctx, page) {
    var parent = taxonomy.parent(page.axis, page.entity_a);
    var cta = taxonomy.cta(page.axis, page.entity_a);
    return ctx.byLocale[page.locale].map(function(o, i) {
        var score = 0;
        if (sameEntity(o, page)) return null;
        if (o.axis === page.axis) score = 1;
        if (o.axis === 'services' && page.axis === 'services' && (o.entity_a === page.entity_a || o.entity_b === page.entity_b)) score = 2;
        if (o.axis !== page.axis && cta !== 'agency' && taxonomy.cta(o.axis, o.entity_a) === cta) score = 2;
        if (o.axis === 'guides' && page.axis === 'guides' && (o.entity_a === parent || taxonomy.parent(o.axis, o.entity_a) === page.entity_a)) score = 3;
        return score ? { page: o, score: score, order: i } : null;
    }).filter(Boolean).sort(function(a, b) {
        return b.score - a.score || a.order - b.order;
    }).slice(0, 6).map(function(r) { return r.page; });
}

function ctaBlock(page) {
    var kind = taxonomy.cta(page.axis, page.entity_a), l = page.locale;
    var contact = (l === locales.DEFAULT_LOCALE ? '' : '/' + l) + '/contact/';
    var href = kind === 'agency' ? contact : taxonomy.productUrl(kind);
    var extra = kind === 'agency' ? '' : ' <a href="' + contact + '" class="button outline">' + e(i18n.t(l, 'cta.agency_button')) + '</a>';
    return '<section class="insight__cta"><h2>' + e(i18n.t(l, 'cta.' + kind + '_title')) + '</h2><p>' + e(i18n.t(l, 'cta.' + kind + '_text')) + '</p>' +
        '<p><a href="' + href + '" class="button">' + e(i18n.t(l, 'cta.' + kind + '_button')) + '</a>' + extra + '</p></section>';
}

function alternatesFor(ctx, page) {
    return locales.all().filter(function(l) {
        return ctx.byLocale[l].some(function(o) { return sameEntity(o, page); });
    }).map(function(l) {
        return { locale: l, url: '/' + taxonomy.slugFor(page.axis, page.entity_a, page.entity_b, l) + '/' };
    });
}

// The picker keeps the visitor on the same page where a translation exists,
// and otherwise leads to the index of that language.
function pickerFor(ctx, hreflang) {
    return locales.all().filter(function(l) { return ctx.byLocale[l].length; }).map(function(l) {
        return hreflang.filter(function(a) { return a.locale === l; })[0] || { locale: l, url: indexUrl(l) };
    });
}

function renderPage(opts, ctx, page) {
    var l = page.locale;
    var sections = [{ id: 'overview', title: i18n.t(l, 'ui.overview'), html: blocks(page.overview) }];
    if (page.example_body) sections.push({ id: 'example', title: i18n.t(l, 'ui.example'), html: '<div class="insight__example">' + blocks(page.example_body) + '</div>' });
    sections.push({
        id: 'personas', title: i18n.t(l, 'ui.personas'),
        html: '<div class="insight__personas">' + page.personas.map(function(p) {
            return '<div class="insight__persona"><h3>' + e(i18n.t(l, 'persona.' + p.key)) + '</h3><p>' + e(p.text) + '</p></div>';
        }).join('') + '</div>'
    });
    sections.push({
        id: 'faq', title: i18n.t(l, 'ui.faq'),
        html: page.faq.map(function(f) { return '<h3>' + e(f.q) + '</h3><p>' + e(f.a) + '</p>'; }).join('')
    });
    var rel = related(ctx, page);
    if (rel.length) sections.push({ id: 'related', title: i18n.t(l, 'ui.related'), html: pageList(rel) });

    // Section numbers come from the position in this list, which the contents list shares.
    var toc = '<nav class="insight__toc" aria-label="' + e(i18n.t(l, 'ui.contents')) + '"><h2>' + e(i18n.t(l, 'ui.contents')) + '</h2><ol>' +
        sections.map(function(s) { return '<li><a href="#' + s.id + '">' + e(s.title) + '</a></li>'; }).join('') + '</ol></nav>';
    var parentKey = taxonomy.parent(page.axis, page.entity_a);
    var parent = parentKey && ctx.byLocale[l].filter(function(o) { return o.axis === 'guides' && o.entity_a === parentKey; })[0];
    var hasHub = ctx.hubs[l + ' ' + page.axis];
    var hreflang = alternatesFor(ctx, page);

    var body = [
        '<div class="insight">',
        '<aside class="insight__aside">' + sectionLinks(ctx, l, page.axis) + toc + '</aside>',
        '<article class="insight__body">',
        '<header class="insight__header">',
        '<p class="insight__crumbs"><a href="' + indexUrl(l) + '">' + e(i18n.t(l, 'ui.insights')) + '</a> / ' +
            (hasHub ? '<a href="' + hubUrl(l, page.axis) + '">' + e(i18n.t(l, 'axis.' + page.axis)) + '</a>' : e(i18n.t(l, 'axis.' + page.axis))) + '</p>',
        '<h1>' + e(title(page)) + '</h1>',
        '<p class="insight__subtitle">' + e(page.subtitle) + '</p>',
        parent ? '<p class="insight__parent">' + e(i18n.t(l, 'ui.parent_note')) + ' <a href="' + urlFor(parent) + '">' + e(title(parent)) + '</a></p>' : '',
        '</header>',
        sections.map(function(s, i) {
            return '<section class="insight__section" id="' + s.id + '"><h2><span class="insight__num">' + (i + 1) + '</span> ' + e(s.title) + '</h2>' + s.html + '</section>';
        }).join('\n'),
        ctaBlock(page),
        '<footer class="insight__note"><p>' + e(i18n.t(l, 'note.' + page.axis)) + '</p>' +
            '<p>' + e(i18n.t(l, 'ui.updated')) + ': <time datetime="' + page.updated_at.slice(0, 10) + '">' + page.updated_at.slice(0, 10) + '</time></p></footer>',
        '</article>',
        '</div>'
    ].filter(Boolean).join('\n');

    return document(opts, {
        locale: l, url: urlFor(page), title: title(page), description: page.meta_description,
        hreflang: hreflang, alternates: pickerFor(ctx, hreflang), body: body,
        jsonLd: {
            '@context': 'https://schema.org', '@type': 'FAQPage',
            mainEntity: page.faq.map(function(f) {
                return { '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } };
            })
        }
    });
}

function renderHub(opts, ctx, locale, axis) {
    var pages = ctx.byLocale[locale].filter(function(p) { return p.axis === axis; });
    var hreflang = locales.all().filter(function(l) { return ctx.hubs[l + ' ' + axis]; }).map(function(l) {
        return { locale: l, url: hubUrl(l, axis) };
    });
    var body = [
        '<div class="insight">',
        '<aside class="insight__aside">' + sectionLinks(ctx, locale, axis) + '</aside>',
        '<div class="insight__body">',
        '<header class="insight__header">',
        '<p class="insight__crumbs"><a href="' + indexUrl(locale) + '">' + e(i18n.t(locale, 'ui.insights')) + '</a></p>',
        '<h1>' + e(i18n.t(locale, 'axis.' + axis)) + '</h1>',
        '<p class="insight__subtitle">' + e(i18n.t(locale, 'axis_intro.' + axis)) + '</p>',
        '</header>',
        pageList(pages),
        '</div>',
        '</div>'
    ].join('\n');
    return document(opts, {
        locale: locale, url: hubUrl(locale, axis), title: i18n.t(locale, 'axis.' + axis) + ' · ' + i18n.t(locale, 'ui.insights'),
        description: i18n.t(locale, 'axis_intro.' + axis), hreflang: hreflang, alternates: pickerFor(ctx, hreflang), body: body
    });
}

function renderIndex(opts, ctx, locale) {
    var hreflang = locales.all().filter(function(l) { return ctx.byLocale[l].length; }).map(function(l) {
        return { locale: l, url: indexUrl(l) };
    });
    var groups = taxonomy.AXES.map(function(axis) {
        var pages = ctx.byLocale[locale].filter(function(p) { return p.axis === axis; });
        if (!pages.length) return '';
        var name = e(i18n.t(locale, 'axis.' + axis));
        return '<section class="insight__section"><h2>' + (ctx.hubs[locale + ' ' + axis] ? '<a href="' + hubUrl(locale, axis) + '">' + name + '</a>' : name) + '</h2>' +
            '<p>' + e(i18n.t(locale, 'axis_intro.' + axis)) + '</p>' + pageList(pages) + '</section>';
    }).filter(Boolean).join('\n');
    var body = [
        '<div class="insight">',
        '<aside class="insight__aside">' + sectionLinks(ctx, locale, 'index') + '</aside>',
        '<div class="insight__body">',
        '<header class="insight__header">',
        '<h1>' + e(i18n.t(locale, 'ui.index_title')) + '</h1>',
        '<p class="insight__subtitle">' + e(i18n.t(locale, 'ui.index_intro')) + '</p>',
        '</header>',
        groups,
        '</div>',
        '</div>'
    ].join('\n');
    return document(opts, {
        locale: locale, url: indexUrl(locale), title: i18n.t(locale, 'ui.index_title'),
        description: i18n.t(locale, 'ui.index_intro'), hreflang: hreflang, alternates: pickerFor(ctx, hreflang), body: body
    });
}

function writeFile(outDir, url, content) {
    var file = path.join(outDir, url, /\/$/.test(url) ? 'index.html' : '');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    return file;
}

function sitemapEntry(url, lastmod, alternates) {
    var links = alternates.map(function(a) {
        return '        <xhtml:link rel="alternate" hreflang="' + locales.bcp47(a.locale) + '" href="' + SITE_URL + a.url + '"/>';
    });
    var en = alternates.filter(function(a) { return a.locale === locales.DEFAULT_LOCALE; })[0];
    if (en) links.push('        <xhtml:link rel="alternate" hreflang="x-default" href="' + SITE_URL + en.url + '"/>');
    return ['    <url>', '        <loc>' + SITE_URL + url + '</loc>', lastmod ? '        <lastmod>' + lastmod + '</lastmod>' : '']
        .concat(links, ['    </url>']).filter(Boolean).join('\n');
}

// An index at /sitemap.xml, the hand-kept site pages, and one file per locale with pages.
function writeSitemaps(opts, ctx) {
    var files = [];
    var withPages = locales.all().filter(function(l) { return ctx.byLocale[l].length; });
    if (fs.existsSync(opts.sitemapSrc)) {
        fs.copyFileSync(opts.sitemapSrc, path.join(opts.outDir, 'sitemap-pages.xml'));
        files.push('sitemap-pages.xml');
    }
    withPages.forEach(function(locale) {
        var pages = ctx.byLocale[locale];
        var newest = pages.map(function(p) { return p.updated_at.slice(0, 10); }).sort().pop();
        var entries = [sitemapEntry(indexUrl(locale), newest, withPages.map(function(l) { return { locale: l, url: indexUrl(l) }; }))];
        taxonomy.AXES.forEach(function(axis) {
            if (!ctx.hubs[locale + ' ' + axis]) return;
            entries.push(sitemapEntry(hubUrl(locale, axis), newest, locales.all().filter(function(l) { return ctx.hubs[l + ' ' + axis]; }).map(function(l) {
                return { locale: l, url: hubUrl(l, axis) };
            })));
        });
        pages.forEach(function(p) { entries.push(sitemapEntry(urlFor(p), p.updated_at.slice(0, 10), alternatesFor(ctx, p))); });
        var name = 'sitemap-insights-' + locale + '.xml';
        fs.writeFileSync(path.join(opts.outDir, name),
            '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
            entries.join('\n') + '\n</urlset>\n');
        files.push(name);
    });
    fs.writeFileSync(path.join(opts.outDir, 'sitemap.xml'),
        '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        files.map(function(f) { return '    <sitemap><loc>' + SITE_URL + '/' + f + '</loc></sitemap>'; }).join('\n') + '\n</sitemapindex>\n');
    return files.concat('sitemap.xml');
}

// Retired pages answer 410 Gone.
function writeGone(opts, retired) {
    var file = path.join(opts.outDir, '.htaccess');
    if (!fs.existsSync(file)) return 0;
    var current = fs.readFileSync(file, 'utf8');
    var start = current.indexOf(HTACCESS_START);
    if (start !== -1) current = current.slice(0, start).replace(/\s+$/, '') + '\n';
    if (retired.length) {
        current += '\n' + HTACCESS_START + '\n' + retired.map(function(p) {
            return 'RedirectMatch gone ^' + urlFor(p).replace(/\/$/, '') + '/?$';
        }).join('\n') + '\n' + HTACCESS_END + '\n';
    }
    fs.writeFileSync(file, current);
    return retired.length;
}

// Preview also renders pages awaiting review or publication, marked noindex,
// and leaves the sitemap and .htaccess alone.
function build(options) {
    var opts = Object.assign({}, DEFAULTS, options);
    var visible = opts.preview ? ['needs_review', 'approved', 'published'] : ['published'];
    var all = store.all(opts.dataDir);
    var ctx = { byLocale: {}, hubs: {} };
    locales.all().forEach(function(l) {
        ctx.byLocale[l] = all.filter(function(p) {
            return p.locale === l && visible.indexOf(p.status) !== -1 && taxonomy.has(p.axis, p.entity_a, p.entity_b);
        });
        // A hub with a single page is thin: it is not built and not linked.
        taxonomy.AXES.forEach(function(axis) {
            ctx.hubs[l + ' ' + axis] = ctx.byLocale[l].filter(function(p) { return p.axis === axis; }).length >= 2;
        });
    });

    locales.all().forEach(function(l) {
        fs.rmSync(path.join(opts.outDir, indexUrl(l)), { recursive: true, force: true });
    });
    var result = { pages: 0, hubs: 0, sitemaps: [], gone: 0 };
    locales.all().forEach(function(l) {
        if (!ctx.byLocale[l].length) return;
        writeFile(opts.outDir, indexUrl(l), renderIndex(opts, ctx, l));
        result.hubs++;
        taxonomy.AXES.forEach(function(axis) {
            if (!ctx.hubs[l + ' ' + axis]) return;
            writeFile(opts.outDir, hubUrl(l, axis), renderHub(opts, ctx, l, axis));
            result.hubs++;
        });
        ctx.byLocale[l].forEach(function(p) {
            writeFile(opts.outDir, urlFor(p), renderPage(opts, ctx, p));
            result.pages++;
        });
    });

    if (!opts.preview) {
        if (result.pages) result.sitemaps = writeSitemaps(opts, ctx);
        result.gone = writeGone(opts, all.filter(function(p) { return p.status === 'retired'; }));
    }
    return result;
}

module.exports = { build: build, urlFor: urlFor, blocks: blocks, SITE_URL: SITE_URL };
