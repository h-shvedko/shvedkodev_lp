'use strict';

// Page lifecycle: seed -> (generate) -> ingest -> approve -> publish, plus reset, retire and guard.
// Every function takes the data directory so tests can run against a temporary one.

var fs = require('fs');
var path = require('path');
var taxonomy = require('./taxonomy');
var locales = require('./locales');
var store = require('./store');
var validate = require('./validate');

var INBOX_DIR = path.join(__dirname, 'inbox');

// Creates a draft for every taxonomy entry x locale. Idempotent on the page identity.
function seed(dir) {
    var result = { created: 0, existing: 0 };
    locales.all().forEach(function(locale) {
        taxonomy.entries().forEach(function(entry) {
            var identity = { axis: entry.axis, entity_a: entry.entity_a, entity_b: entry.entity_b, locale: locale };
            if (store.exists(identity, dir)) { result.existing++; return; }
            store.write(store.blank(identity), dir);
            result.created++;
        });
    });
    return result;
}

// Counts by locale, axis and status.
function counts(dir) {
    var table = {};
    store.all(dir).forEach(function(p) {
        var key = p.locale + ' ' + p.axis;
        table[key] = table[key] || {};
        table[key][p.status] = (table[key][p.status] || 0) + 1;
    });
    return table;
}

function matches(page, filter) {
    filter = filter || {};
    return ['locale', 'axis', 'entity_a', 'entity_b'].every(function(f) {
        return filter[f] === undefined || page[f] === filter[f];
    });
}

// Writing jobs for drafts that have no text yet. Approved and published text is never
// regenerated silently: a page has to be reset to draft first.
function jobs(dir, filter) {
    return store.all(dir).filter(function(p) {
        return p.status === 'draft' && !store.hasText(p) && matches(p, filter) && taxonomy.has(p.axis, p.entity_a, p.entity_b);
    }).map(function(p) {
        var keys = ['subtitle', 'overview', 'personas', 'faq', 'meta_description'];
        if (p.axis === 'examples') keys.push('example_intro', 'example_document');
        return {
            id: store.id(p),
            out: path.join('insights', 'inbox', store.id(p) + '.json'),
            language: locales.englishName(p.locale),
            entity: taxonomy.label(p.axis, p.entity_a, p.entity_b, p.locale),
            page_type: p.axis,
            brief: taxonomy.brief(p.axis, p.entity_a, p.entity_b),
            keys: keys
        };
    });
}

function inboxFiles(inboxDir) {
    var files = [];
    (function walk(dir) {
        if (!fs.existsSync(dir)) return;
        fs.readdirSync(dir).sort().forEach(function(name) {
            var full = path.join(dir, name);
            if (fs.statSync(full).isDirectory()) walk(full);
            else if (/\.json$/.test(name)) files.push(full);
        });
    })(inboxDir);
    return files;
}

// Validates each answer in full, then writes it. A rejected answer changes nothing
// and stays in the inbox with its reasons reported.
function ingest(inboxDir, dir) {
    var result = { accepted: [], rejected: [] };
    var pages = store.all(dir);
    inboxFiles(inboxDir).forEach(function(file) {
        var rel = path.relative(inboxDir, file).replace(/\\/g, '/').replace(/\.json$/, '');
        var page = pages.filter(function(p) { return store.id(p) === rel; })[0];
        try {
            if (!page) throw new validate.FragmentRejected(['no seeded page with this id']);
            if (page.status !== 'draft') throw new validate.FragmentRejected(['page is ' + page.status + '; reset it to draft first']);
            var raw;
            try { raw = JSON.parse(fs.readFileSync(file, 'utf8')); }
            catch (e) { throw new validate.FragmentRejected(['not valid JSON: ' + e.message]); }
            var text = validate.fragment(page, raw);
            var twin = pages.filter(function(o) { return o !== page && o.meta_description === text.meta_description; })[0];
            if (twin) throw new validate.FragmentRejected(['meta_description duplicates ' + store.id(twin)]);
            Object.keys(text).forEach(function(k) { page[k] = text[k]; });
            page.status = 'needs_review';
            page.generated_at = new Date().toISOString();
            store.write(page, dir);
            fs.unlinkSync(file);
            result.accepted.push(rel);
        } catch (e) {
            if (!(e instanceof validate.FragmentRejected)) throw e;
            result.rejected.push({ id: rel, reasons: e.reasons });
        }
    });
    return result;
}

function approve(dir, filter) {
    return move(dir, filter, 'needs_review', 'approved');
}

function reset(dir, filter) {
    var changed = [];
    store.all(dir).forEach(function(p) {
        if (!matches(p, filter) || p.status === 'draft') return;
        p.status = 'draft';
        store.FRAGMENTS.forEach(function(f) { p[f] = null; });
        p.generated_at = null;
        store.write(p, dir);
        changed.push(store.id(p));
    });
    return changed;
}

function move(dir, filter, from, to) {
    var changed = [];
    store.all(dir).forEach(function(p) {
        if (p.status !== from || !matches(p, filter)) return;
        p.status = to;
        store.write(p, dir);
        changed.push(store.id(p));
    });
    return changed;
}

// Publishes approved pages that pass the guard; reports the rest with reasons.
function publish(dir, filter) {
    var result = { published: [], blocked: [] };
    var pages = store.all(dir);
    pages.forEach(function(p) {
        if (p.status !== 'approved' || !matches(p, filter)) return;
        var reasons = validate.publishBlockers(p, pages);
        if (reasons.length) { result.blocked.push({ id: store.id(p), reasons: reasons }); return; }
        p.status = 'published';
        store.write(p, dir);
        result.published.push(store.id(p));
    });
    return result;
}

// Retires matching pages in every locale. A filter is required so nothing is retired by accident.
function retire(dir, filter) {
    if (!filter || !Object.keys(filter).length) throw new Error('retire needs a filter');
    var changed = [];
    store.all(dir).forEach(function(p) {
        if (p.status === 'retired' || !matches(p, filter)) return;
        p.status = 'retired';
        store.write(p, dir);
        changed.push(store.id(p));
    });
    return changed;
}

// Retires pages whose entity has left the taxonomy.
function guard(dir) {
    var changed = [];
    store.all(dir).forEach(function(p) {
        if (p.status === 'retired' || taxonomy.has(p.axis, p.entity_a, p.entity_b)) return;
        p.status = 'retired';
        store.write(p, dir);
        changed.push(store.id(p));
    });
    return changed;
}

// Re-validates stored text, for pages edited by hand after ingest.
function check(dir, filter) {
    var pages = store.all(dir), problems = [];
    pages.forEach(function(p) {
        if (!store.hasText(p) || !matches(p, filter) || !taxonomy.has(p.axis, p.entity_a, p.entity_b)) return;
        var raw = { subtitle: p.subtitle, overview: p.overview, personas: p.personas, faq: p.faq, meta_description: p.meta_description };
        if (p.axis === 'examples') {
            var cut = (p.example_body || '').indexOf('\n\n');
            raw.example_intro = cut === -1 ? '' : p.example_body.slice(0, cut);
            raw.example_document = cut === -1 ? '' : p.example_body.slice(cut + 2);
        }
        var reasons = [];
        try {
            var text = validate.fragment(p, raw);
            if (text.meta_description !== p.meta_description) reasons.push('meta_description does not contain the entity name');
        } catch (e) {
            if (!(e instanceof validate.FragmentRejected)) throw e;
            reasons = e.reasons;
        }
        if (pages.some(function(o) { return o !== p && o.meta_description === p.meta_description; })) reasons.push('meta_description is not unique');
        if (reasons.length) problems.push({ id: store.id(p), reasons: reasons });
    });
    return problems;
}

module.exports = {
    INBOX_DIR: INBOX_DIR, check: check,
    seed: seed, counts: counts, jobs: jobs, ingest: ingest, approve: approve,
    reset: reset, publish: publish, retire: retire, guard: guard
};
