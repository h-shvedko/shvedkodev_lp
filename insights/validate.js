'use strict';

// Validates a generator answer in full before anything is written (all or nothing),
// and guards what may be published.

var taxonomy = require('./taxonomy');

var LIMITS = {
    subtitle: [40, 160],
    meta: [90, 150],
    overviewWords: 300, overviewChars: 2000, overviewMaxChars: 7000,
    personaText: [80, 400],
    faqQuestion: [15, 140], faqAnswer: [80, 600],
    exampleWords: 150, exampleChars: 1000
};

// Snippets lead with the concrete benefit, not with an invitation to read.
var BANNED_STARTS = [
    'discover', 'learn', 'explore', 'unlock', 'maximize', 'maximise', 'optimize', 'optimise', 'boost',
    'entdecken', 'entdecke', 'erfahren', 'erfahre', 'lernen', 'lerne', 'erkunden', 'erkunde',
    'maximieren', 'optimieren', 'steigern'
];
var BANNED_PHRASES = ['comprehensive guide', 'umfassender leitfaden', 'umfassenden leitfaden', 'umfassende anleitung'];

function FragmentRejected(reasons) {
    this.name = 'FragmentRejected';
    this.reasons = reasons;
    this.message = 'Fragment rejected: ' + reasons.join('; ');
}
FragmentRejected.prototype = Object.create(Error.prototype);

function words(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

// Long enough by words OR by characters: compounding languages fail an English word count.
function longEnough(text, minWords, minChars) {
    return words(text) >= minWords || text.length >= minChars;
}

function clean(value) {
    return typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim() : value;
}

// A model sometimes answers with an array of lines where a string was asked for.
function flatten(value) {
    if (Array.isArray(value)) {
        return value.map(function(v) { return Array.isArray(v) ? flatten(v) : String(v); }).join('\n');
    }
    return value;
}

function checkSnippet(name, text, reasons) {
    var lower = text.toLowerCase();
    var first = lower.split(/[^a-zäöüß]+/).filter(Boolean)[0];
    if (BANNED_STARTS.indexOf(first) !== -1) reasons.push(name + ' starts with "' + first + '"');
    BANNED_PHRASES.forEach(function(p) {
        if (lower.indexOf(p) !== -1) reasons.push(name + ' contains "' + p + '"');
    });
}

function checkLength(name, text, range, reasons) {
    if (text.length < range[0] || text.length > range[1]) {
        reasons.push(name + ' length ' + text.length + ' outside ' + range[0] + '-' + range[1]);
    }
}

function isText(value) {
    return typeof value === 'string' && value.trim() !== '';
}

function hasMarkup(text) {
    return /<[a-z\/!][^>]*>/i.test(text);
}

// Models paraphrase the entity name outside English. Repair instead of rejecting.
function repairMeta(meta, entity) {
    if (meta.toLowerCase().indexOf(entity.toLowerCase()) !== -1) return meta;
    var repaired = entity + ': ' + meta;
    if (repaired.length <= LIMITS.meta[1]) return repaired;
    var cut = repaired.slice(0, LIMITS.meta[1] + 1);
    cut = cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.\-–—]+$/, '');
    return cut;
}

// Returns the fragments to store for `page`, or throws FragmentRejected.
function fragment(page, raw) {
    var reasons = [];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new FragmentRejected(['answer is not a JSON object']);

    var entity = taxonomy.label(page.axis, page.entity_a, page.entity_b, page.locale);
    var out = {};

    out.subtitle = clean(raw.subtitle);
    if (!isText(out.subtitle)) reasons.push('subtitle missing');
    else {
        checkLength('subtitle', out.subtitle, LIMITS.subtitle, reasons);
        checkSnippet('subtitle', out.subtitle, reasons);
    }

    out.overview = clean(flatten(raw.overview));
    if (!isText(out.overview)) reasons.push('overview missing');
    else {
        if (!longEnough(out.overview, LIMITS.overviewWords, LIMITS.overviewChars)) reasons.push('overview too short');
        if (out.overview.length > LIMITS.overviewMaxChars) reasons.push('overview too long');
        if (hasMarkup(out.overview)) reasons.push('overview contains HTML');
    }

    if (!Array.isArray(raw.personas) || raw.personas.length !== 3) reasons.push('personas must be exactly 3');
    else {
        var seen = {};
        out.personas = raw.personas.map(function(p, i) {
            var key = p && p.key, text = clean(p && p.text);
            if (taxonomy.PERSONA_KEYS.indexOf(key) === -1) reasons.push('persona ' + (i + 1) + ' key not in the fixed list');
            else if (seen[key]) reasons.push('persona key "' + key + '" repeated');
            seen[key] = true;
            if (!isText(text)) reasons.push('persona ' + (i + 1) + ' text missing');
            else checkLength('persona ' + (i + 1) + ' text', text, LIMITS.personaText, reasons);
            return { key: key, text: text };
        });
    }

    if (!Array.isArray(raw.faq) || raw.faq.length !== 3) reasons.push('faq must be exactly 3');
    else {
        out.faq = raw.faq.map(function(f, i) {
            var q = clean(f && f.q), a = clean(f && f.a);
            if (!isText(q)) reasons.push('faq ' + (i + 1) + ' question missing');
            else {
                checkLength('faq ' + (i + 1) + ' question', q, LIMITS.faqQuestion, reasons);
                if (!/\?$/.test(q)) reasons.push('faq ' + (i + 1) + ' question must end with "?"');
            }
            if (!isText(a)) reasons.push('faq ' + (i + 1) + ' answer missing');
            else checkLength('faq ' + (i + 1) + ' answer', a, LIMITS.faqAnswer, reasons);
            return { q: q, a: a };
        });
    }

    out.meta_description = clean(raw.meta_description);
    if (!isText(out.meta_description)) reasons.push('meta_description missing');
    else {
        out.meta_description = repairMeta(out.meta_description, entity);
        checkLength('meta_description', out.meta_description, LIMITS.meta, reasons);
        checkSnippet('meta_description', out.meta_description, reasons);
    }

    out.example_body = null;
    if (page.axis === 'examples') {
        // Asked for as two keys and joined here, so neither part gets dropped.
        var intro = clean(flatten(raw.example_intro)), doc = clean(flatten(raw.example_document));
        if (!isText(intro)) reasons.push('example_intro missing');
        if (!isText(doc)) reasons.push('example_document missing');
        if (isText(intro) && isText(doc)) {
            out.example_body = intro + '\n\n' + doc;
            if (!longEnough(doc, LIMITS.exampleWords, LIMITS.exampleChars)) reasons.push('example_document too short');
            if (hasMarkup(out.example_body)) reasons.push('example contains HTML');
        }
    }

    if (reasons.length) throw new FragmentRejected(reasons);
    return out;
}

// Reasons a page may not be published; empty when it may. `others` are all pages in the store.
function publishBlockers(page, others) {
    var reasons = [];
    if (!taxonomy.has(page.axis, page.entity_a, page.entity_b)) return ['entity is no longer in the taxonomy'];
    ['subtitle', 'overview', 'personas', 'faq', 'meta_description'].forEach(function(f) {
        if (page[f] === null || page[f] === undefined) reasons.push(f + ' missing');
    });
    if (page.axis === 'examples' && !page.example_body) reasons.push('example_body missing');
    if (page.meta_description) {
        checkLength('meta_description', page.meta_description, LIMITS.meta, reasons);
        var twin = (others || []).filter(function(o) {
            return o !== page && o.status !== 'retired' && o.meta_description === page.meta_description &&
                !(o.axis === page.axis && o.entity_a === page.entity_a && o.entity_b === page.entity_b && o.locale === page.locale);
        })[0];
        if (twin) reasons.push('meta_description is not unique');
    }
    return reasons;
}

module.exports = {
    LIMITS: LIMITS, BANNED_STARTS: BANNED_STARTS, FragmentRejected: FragmentRejected,
    fragment: fragment, publishBlockers: publishBlockers, repairMeta: repairMeta, flatten: flatten
};
