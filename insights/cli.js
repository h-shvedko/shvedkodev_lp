'use strict';

// node insights/cli.js <command> [--locale de] [--axis guides] [--a entity] [--b entity] [--preview]
//
//   seed      create a draft for every taxonomy entry in every locale (idempotent)
//   status    page counts by locale, type and status
//   jobs      print writing jobs (JSON) for drafts without text; see GENERATOR.md
//   ingest    validate answers in insights/inbox/ and store the valid ones as needs_review
//   check     re-validate stored text after manual edits
//   approve   needs_review -> approved
//   publish   approved -> published, for pages that pass the publish guard
//   reset     back to draft and clear the text, so the page can be written again
//   retire    retire matching pages in every locale (needs --axis/--a/--b)
//   guard     retire pages whose entity has left the taxonomy
//   build     render pages into dist/ (--preview also renders unpublished pages, noindex)

var pipeline = require('./pipeline');
var render = require('./render');
var store = require('./store');

function parse(argv) {
    var args = { filter: {} }, map = { locale: 'locale', axis: 'axis', a: 'entity_a', b: 'entity_b' };
    for (var i = 0; i < argv.length; i++) {
        var name = argv[i].replace(/^--/, '');
        if (name === 'preview') args.preview = true;
        else if (map[name]) args.filter[map[name]] = argv[++i];
        else throw new Error('Unknown option: ' + argv[i]);
    }
    return args;
}

function list(label, ids) {
    console.log(label + ': ' + ids.length);
    ids.forEach(function(id) { console.log('  ' + id); });
}

function blocked(label, items) {
    console.log(label + ': ' + items.length);
    items.forEach(function(item) { console.log('  ' + item.id + '\n    - ' + item.reasons.join('\n    - ')); });
}

function run(command, argv) {
    var args = parse(argv), dir = store.DATA_DIR, result;
    switch (command) {
        case 'seed':
            result = pipeline.seed(dir);
            console.log('created: ' + result.created + ', already there: ' + result.existing);
            return 0;
        case 'status':
            result = pipeline.counts(dir);
            Object.keys(result).sort().forEach(function(key) {
                console.log(key + ': ' + Object.keys(result[key]).sort().map(function(s) { return s + ' ' + result[key][s]; }).join(', '));
            });
            return 0;
        case 'jobs':
            console.log(JSON.stringify(pipeline.jobs(dir, args.filter), null, 2));
            return 0;
        case 'ingest':
            result = pipeline.ingest(pipeline.INBOX_DIR, dir);
            list('accepted', result.accepted);
            blocked('rejected', result.rejected);
            return result.rejected.length ? 1 : 0;
        case 'check':
            result = pipeline.check(dir, args.filter);
            blocked('problems', result);
            return result.length ? 1 : 0;
        case 'approve':
            list('approved', pipeline.approve(dir, args.filter));
            return 0;
        case 'publish':
            result = pipeline.publish(dir, args.filter);
            list('published', result.published);
            blocked('blocked', result.blocked);
            return result.blocked.length ? 1 : 0;
        case 'reset':
            list('reset to draft', pipeline.reset(dir, args.filter));
            return 0;
        case 'retire':
            list('retired', pipeline.retire(dir, args.filter));
            return 0;
        case 'guard':
            list('retired', pipeline.guard(dir));
            return 0;
        case 'build':
            result = render.build({ preview: !!args.preview });
            console.log('pages: ' + result.pages + ', hubs: ' + result.hubs + ', sitemaps: ' + result.sitemaps.length + ', gone: ' + result.gone);
            return 0;
        default:
            console.error('Usage: node insights/cli.js seed|status|jobs|ingest|check|approve|publish|reset|retire|guard|build [options]');
            return 2;
    }
}

if (require.main === module) {
    try {
        process.exitCode = run(process.argv[2], process.argv.slice(3));
    } catch (err) {
        console.error(err.message);
        process.exitCode = 1;
    }
}

module.exports = { run: run, parse: parse };
