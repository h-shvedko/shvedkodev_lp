'use strict';

// One JSON file per page under insights/data/<locale>/<axis>/. The identity is
// (axis, entity_a, entity_b, locale); the file name is derived from it and so is unique.

var fs = require('fs');
var path = require('path');

var DATA_DIR = path.join(__dirname, 'data');
var STATUSES = ['draft', 'needs_review', 'approved', 'published', 'retired'];
var FRAGMENTS = ['subtitle', 'overview', 'personas', 'faq', 'meta_description', 'example_body'];

function id(page) {
    return [page.locale, page.axis, page.entity_a + (page.entity_b ? '--' + page.entity_b : '')].join('/');
}

function fileFor(page, dir) {
    return path.join(dir || DATA_DIR, id(page) + '.json');
}

function blank(identity) {
    return {
        axis: identity.axis,
        entity_a: identity.entity_a,
        entity_b: identity.entity_b || '',
        locale: identity.locale,
        status: 'draft',
        subtitle: null,
        overview: null,
        personas: null,
        faq: null,
        meta_description: null,
        example_body: null,
        generated_at: null,
        updated_at: new Date().toISOString()
    };
}

function exists(identity, dir) {
    return fs.existsSync(fileFor(identity, dir));
}

function read(identity, dir) {
    return JSON.parse(fs.readFileSync(fileFor(identity, dir), 'utf8'));
}

function write(page, dir) {
    if (STATUSES.indexOf(page.status) === -1) throw new Error('Unknown status: ' + page.status);
    page.updated_at = new Date().toISOString();
    var file = fileFor(page, dir);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(page, null, 2) + '\n');
    return page;
}

function all(dir) {
    var root = dir || DATA_DIR;
    var pages = [];
    if (!fs.existsSync(root)) return pages;
    fs.readdirSync(root).sort().forEach(function(locale) {
        var localeDir = path.join(root, locale);
        if (!fs.statSync(localeDir).isDirectory()) return;
        fs.readdirSync(localeDir).sort().forEach(function(axis) {
            var axisDir = path.join(localeDir, axis);
            if (!fs.statSync(axisDir).isDirectory()) return;
            fs.readdirSync(axisDir).sort().forEach(function(name) {
                if (/\.json$/.test(name)) pages.push(JSON.parse(fs.readFileSync(path.join(axisDir, name), 'utf8')));
            });
        });
    });
    return pages;
}

function hasText(page) {
    return FRAGMENTS.every(function(f) { return f === 'example_body' || page[f] !== null; });
}

module.exports = {
    DATA_DIR: DATA_DIR, STATUSES: STATUSES, FRAGMENTS: FRAGMENTS,
    id: id, blank: blank, exists: exists, read: read, write: write, all: all, hasText: hasText
};
