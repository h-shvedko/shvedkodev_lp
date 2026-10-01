'use strict';

// Closed taxonomy for insight pages: the single source of truth for which pages exist.
// A page is identified by (axis, entity_a, entity_b, locale). Slugs are derived from it.
// Briefs and evidence are written in English for the generator and never rendered.
// Evidence describes our own project work without naming clients.

var locales = require('./locales');

var AXES = ['guides', 'examples', 'services', 'products'];

// cta: which call to action the page ends with (agency | craftly | jobhunter).
// parent: a narrower guide links to the one broad guide that targets the head term.
var GUIDES = {
    'laravel-development-cost': {
        en: 'Laravel Development Cost', de: 'Kosten der Laravel-Entwicklung',
        brief: 'What drives the cost of a custom Laravel application: scope, integrations, data migration, testing, hosting and maintenance. Explain cost drivers and how to reduce them. Show scope tiers with invented scenarios; do not quote market rates or third-party figures.'
    },
    'hire-laravel-developer': {
        en: 'How to Hire a Laravel Developer', de: 'Laravel-Entwickler beauftragen',
        brief: 'Freelancer, agency or in-house hire: which fits which situation. What to check before signing: code samples, tests, communication, handover terms. Warning signs.'
    },
    'laravel-vs-wordpress': {
        en: 'Laravel vs WordPress', de: 'Laravel vs. WordPress',
        brief: 'Which one fits which project. WordPress for content-led sites with editors; Laravel for custom business logic and data models. Honest trade-offs in cost, maintenance, security updates and hiring. When combining both makes sense.'
    },
    'php-legacy-modernization': {
        en: 'PHP Legacy Modernization', de: 'PHP-Legacy-Modernisierung',
        brief: 'Upgrading an old PHP or Laravel codebase without a full rewrite: audit, tests around existing behaviour, containerised environment, step-by-step replacement. When a rewrite is justified and when it is not.'
    },
    'mvp-development-timeline': {
        en: 'MVP Development Timeline', de: 'Zeitplan für die MVP-Entwicklung',
        brief: 'From idea to first release: what fits in an MVP, what to cut, the phases (scoping, design, build, test, launch) and what usually delays them. Use invented example timelines, clearly labelled as illustrations.'
    },
    'figma-to-wordpress': {
        en: 'Figma to WordPress', de: 'Von Figma zu WordPress',
        cta: 'craftly',
        brief: 'Turning a Figma design into a WordPress theme: design tokens, components to blocks, responsive behaviour, editor experience. Where detail is lost in the handoff and how to prevent it. Manual build versus AI-assisted generation.'
    },
    'figma-to-laravel': {
        en: 'Figma to Laravel', de: 'Von Figma zu Laravel',
        parent: 'figma-to-wordpress', cta: 'craftly',
        brief: 'Turning a Figma design into a Laravel application front end with Blade or Livewire components. Focus on what differs from a WordPress theme: application state, forms, validation, authenticated areas. Do not repeat the general design handoff advice.'
    },
    'website-relaunch-checklist': {
        en: 'Website Relaunch Checklist', de: 'Checkliste für den Website-Relaunch',
        brief: 'Redesigning or rebuilding a site without losing search rankings or leads: URL inventory, redirects, content parity, tracking, performance, launch-day and post-launch checks.'
    },
    'api-integration-guide': {
        en: 'API Integration Guide', de: 'Leitfaden zur API-Integration',
        brief: 'Connecting a web application to ERP, CRM, payment or third-party systems: authentication, rate limits, retries, idempotency, webhooks, monitoring. Typical failure modes and how to design around them.'
    },
    'laravel-automated-testing': {
        en: 'Automated Testing in Laravel', de: 'Automatisierte Tests in Laravel',
        brief: 'What test coverage a client should expect from a Laravel project: unit tests, feature tests, browser end-to-end tests with Playwright, continuous integration. What each layer catches and what it costs to maintain.'
    },
    'laravel-saas-development': {
        en: 'SaaS Development with Laravel', de: 'SaaS-Entwicklung mit Laravel',
        brief: 'Building a SaaS product on Laravel: multi-tenancy options, subscription billing, roles and permissions, queues, onboarding. Decisions that are expensive to change later.'
    },
    'ai-app-builders-php': {
        en: 'AI App Builders for PHP', de: 'KI-App-Builder für PHP',
        cta: 'craftly',
        brief: 'What AI code generation can and cannot do for Laravel and WordPress projects today: where it saves time, where a developer is still needed, how to review generated code. Honest, not promotional.'
    },
    'ai-features-in-laravel': {
        en: 'AI Features in Laravel', de: 'KI-Funktionen in Laravel',
        brief: 'Adding language-model features to an existing Laravel application: provider abstraction, prompts kept in configuration, queues, cost control, validating model output before it is stored, fallbacks.'
    },
    'website-maintenance-contract': {
        en: 'Website Maintenance Contract', de: 'Website-Wartungsvertrag',
        brief: 'What a maintenance agreement for a website or web application should cover: updates, backups, monitoring, response times, what counts as a change request. How to compare offers.'
    },
    'gdpr-website-development': {
        en: 'GDPR-Compliant Website Development', de: 'DSGVO-konforme Website-Entwicklung',
        brief: 'Technical measures a developer implements for GDPR: consent before analytics, data minimisation, EU hosting, processor agreements, deletion and export. State clearly that this is technical guidance, not legal advice.'
    },
    'fixed-price-vs-time-and-materials': {
        en: 'Fixed Price vs Time and Materials', de: 'Festpreis vs. Abrechnung nach Aufwand',
        brief: 'Choosing a contract model for a web project: when a fixed price works, when time and materials is safer, hybrid models, how scope changes are handled in each.'
    }
};

// Every example page shows an invented, fictional document.
var EXAMPLES = {
    'web-project-brief': {
        en: 'Web Project Brief Example', de: 'Beispiel für ein Website-Briefing',
        brief: 'A short project brief a client sends to a web developer: goals, audience, scope, constraints, budget frame, timeline.'
    },
    'requirements-specification': {
        en: 'Requirements Specification Example', de: 'Lastenheft-Beispiel',
        brief: 'A requirements specification (German: Lastenheft) for a small web application: context, functional requirements, non-functional requirements, acceptance criteria.'
    },
    'web-development-rfp': {
        en: 'Web Development RFP Example', de: 'Beispiel für eine Ausschreibung zur Webentwicklung',
        brief: 'A request for proposal sent to several web development providers: background, scope, required response format, evaluation criteria, deadlines.'
    },
    'user-story': {
        en: 'User Story Example', de: 'User-Story-Beispiel',
        brief: 'A set of user stories with acceptance criteria for one feature of a web application, in the usual role, goal, benefit format.'
    },
    'maintenance-sla': {
        en: 'Maintenance SLA Example', de: 'Beispiel für ein Wartungs-SLA',
        brief: 'A service level agreement excerpt for website maintenance: covered services, response and resolution times by priority, exclusions, reporting.'
    },
    'acceptance-test-plan': {
        en: 'Acceptance Test Plan Example', de: 'Beispiel für einen Abnahmetestplan',
        brief: 'An acceptance test plan a client uses to sign off a web project: test cases with steps and expected results, roles, sign-off criteria.'
    }
};

var SERVICES = {
    'laravel-development': { en: 'Laravel Development', de: 'Laravel-Entwicklung' },
    'wordpress-development': { en: 'WordPress Development', de: 'WordPress-Entwicklung' },
    'api-integration': { en: 'API Integration', de: 'API-Integration' },
    'saas-development': { en: 'SaaS Development', de: 'SaaS-Entwicklung' },
    'test-automation': { en: 'Test Automation', de: 'Testautomatisierung' },
    'ai-integration': { en: 'AI Integration', de: 'KI-Integration' },
    'n8n-automation': { en: 'n8n Workflow Automation', de: 'Workflow-Automatisierung mit n8n' },
    'legacy-modernization': { en: 'Legacy Modernization', de: 'Legacy-Modernisierung' },
    'cms-development': { en: 'CMS Development', de: 'CMS-Entwicklung' }
};

var INDUSTRIES = {
    'education': { en: 'Education and E-Learning', de: 'Bildung und E-Learning' },
    'ecommerce': { en: 'E-Commerce and Retail', de: 'E-Commerce und Einzelhandel' },
    'marketing': { en: 'Marketing Teams and Agencies', de: 'Marketing-Teams und Agenturen' },
    'hr': { en: 'HR and Recruiting', de: 'HR und Recruiting' },
    'public-sector': { en: 'Research and the Public Sector', de: 'Forschung und öffentliche Hand' }
};

// Relevance gate: a service x industry page exists only where our own project work backs it.
var SERVICE_PAIRS = [
    ['laravel-development', 'education', 'A digital library platform for schools built on Laravel, with a catalogue of teaching materials and an admin area.'],
    ['ai-integration', 'education', 'A multi-agent content pipeline that drafts course books, chapters and exam questions against a certification standard, with human review.'],
    ['n8n-automation', 'education', 'n8n workflows that orchestrate research, writing and review steps for course material, with an admin interface on top.'],
    ['laravel-development', 'ecommerce', 'A Laravel 11 system issuing QR exit tickets for stores, with atomic ticket consumption and validation logging.'],
    ['api-integration', 'ecommerce', 'An HMAC-signed API that lets external store systems issue and validate tickets, documented with OpenAPI.'],
    ['cms-development', 'ecommerce', 'A Laravel-based content management system with an admin panel and shop and payment functions.'],
    ['test-automation', 'ecommerce', 'A CMS covered by PHPUnit unit and feature suites, JavaScript unit tests and Playwright end-to-end tests running in CI.'],
    ['wordpress-development', 'marketing', 'A pipeline that turns Figma designs and plain-language briefs into WordPress themes.'],
    ['saas-development', 'marketing', 'A multi-tenant social media management platform with workspaces, roles, scheduling and a background job worker.'],
    ['ai-integration', 'marketing', 'A multi-agent platform that generates WordPress themes and Laravel applications from a chat description.'],
    ['test-automation', 'marketing', 'Playwright end-to-end suites and unit tests for a multi-tenant web platform, run on every push.'],
    ['saas-development', 'hr', 'A SaaS product that monitors freelance job postings, scores them and drafts applications.'],
    ['ai-integration', 'hr', 'AI scoring of job postings across several categories with validation of model output against real data, plus draft cover letters.'],
    ['n8n-automation', 'hr', 'n8n workflows for recruitment steps integrated with a work management board.'],
    ['api-integration', 'hr', 'Integrations with a job marketplace GraphQL API and with email, Slack, WhatsApp and browser push for notifications.'],
    ['legacy-modernization', 'public-sector', 'Geospatial atlas websites with more than 200 PHP content pages moved into a containerised, reproducible environment.'],
    ['laravel-development', 'public-sector', 'A digital library on Laravel that makes teaching materials available to schools across several islands.']
];

// Product pages. entity_a is the product, entity_b the topic ('' is the product overview).
// Facts are the only product claims the generator may make.
var PRODUCTS = {
    'craftly': {
        url: 'https://craftly.build', cta: 'craftly',
        facts: 'Craftly is our own product: a conversational AI platform that generates WordPress themes and Laravel applications from a plain-language description. It is a multi-agent system that writes PHP code, not a drag-and-drop builder. It can also start from a Figma design. Generated projects are ordinary code the owner can keep and edit.',
        topics: {
            '': { en: 'Craftly', de: 'Craftly', brief: 'What Craftly is, who it is for, what it generates and where a developer is still needed.' },
            'laravel': { en: 'Craftly for Laravel', de: 'Craftly für Laravel', brief: 'Generating a Laravel application with Craftly: what you describe, what you get, how to continue development afterwards.' },
            'wordpress': { en: 'Craftly for WordPress', de: 'Craftly für WordPress', brief: 'Generating a custom WordPress theme with Craftly instead of adapting a bought theme.' },
            'figma-to-wordpress': { en: 'Craftly Figma to WordPress', de: 'Craftly: von Figma zu WordPress', brief: 'Using Craftly to turn a Figma design into a WordPress theme, and what to check in the result.' }
        }
    },
    'jobhunter': {
        url: 'https://jobhunter.works', cta: 'jobhunter',
        facts: 'JobHunter is our own product for freelancers on Upwork. It fetches new job postings on a schedule, pre-filters them, scores each one with AI, drafts a cover letter and answers to screening questions, and notifies the user. It does not submit proposals: the user applies manually on Upwork. Never publish marketplace data, figures or aggregates.',
        topics: {
            '': { en: 'JobHunter', de: 'JobHunter', brief: 'What JobHunter is, who it is for and what it does and does not automate.' },
            'job-scoring': { en: 'JobHunter AI Job Scoring', de: 'JobHunter: KI-Bewertung von Jobs', brief: 'How an AI score for each job posting helps a freelancer decide where to spend application time. Do not say what the score or the drafts are based on beyond the job posting itself; never mention a freelancer profile.' },
            'cover-letters': { en: 'JobHunter Cover Letters', de: 'JobHunter: Anschreiben', brief: 'Getting a draft cover letter for a job posting, and why the user still edits and sends it. Never mention a freelancer profile as a source.' },
            'job-alerts': { en: 'JobHunter Job Alerts', de: 'JobHunter: Job-Benachrichtigungen', brief: 'Getting notified about matching job postings quickly through email, Slack, WhatsApp or browser push.' }
        }
    }
};

// Fixed persona keys. Titles come from i18n.js, never from the model.
var PERSONA_KEYS = [
    'founder', 'cto', 'product_manager', 'marketing_lead', 'agency_owner', 'it_manager',
    'project_manager', 'operations_lead', 'freelancer', 'hr_lead', 'educator',
    'ecommerce_manager', 'developer', 'procurement'
];

function entries() {
    var list = [];
    Object.keys(GUIDES).forEach(function(a) { list.push({ axis: 'guides', entity_a: a, entity_b: '' }); });
    Object.keys(EXAMPLES).forEach(function(a) { list.push({ axis: 'examples', entity_a: a, entity_b: '' }); });
    SERVICE_PAIRS.forEach(function(p) { list.push({ axis: 'services', entity_a: p[0], entity_b: p[1] }); });
    Object.keys(PRODUCTS).forEach(function(a) {
        Object.keys(PRODUCTS[a].topics).forEach(function(b) { list.push({ axis: 'products', entity_a: a, entity_b: b }); });
    });
    return list;
}

function pair(a, b) {
    return SERVICE_PAIRS.filter(function(p) { return p[0] === a && p[1] === b; })[0];
}

function has(axis, a, b) {
    b = b || '';
    if (axis === 'guides') return !b && !!GUIDES[a];
    if (axis === 'examples') return !b && !!EXAMPLES[a];
    if (axis === 'services') return !!pair(a, b);
    if (axis === 'products') return !!PRODUCTS[a] && !!PRODUCTS[a].topics[b];
    return false;
}

function node(axis, a, b) {
    if (!has(axis, a, b)) throw new Error('Not in taxonomy: ' + [axis, a, b || ''].join('/'));
    if (axis === 'guides') return GUIDES[a];
    if (axis === 'examples') return EXAMPLES[a];
    if (axis === 'products') return PRODUCTS[a].topics[b || ''];
    return null;
}

function pick(labels, locale) {
    return labels[locale] || labels[locales.DEFAULT_LOCALE];
}

// The page title and the exact entity name the meta description must contain.
function label(axis, a, b, locale) {
    if (axis === 'services') {
        if (!has(axis, a, b)) throw new Error('Not in taxonomy: ' + [axis, a, b].join('/'));
        return pick(SERVICES[a], locale) + (locale === 'de' ? ' für ' : ' for ') + pick(INDUSTRIES[b], locale);
    }
    return pick(node(axis, a, b), locale);
}

// The page path. Slug words are shared by all translations; non-English adds a locale
// prefix, like the rest of the site (/de/...).
// A retired page may have left the taxonomy and still needs its old slug: pass `unchecked`.
function slugFor(axis, a, b, locale, unchecked) {
    if (!unchecked && !has(axis, a, b)) throw new Error('Not in taxonomy: ' + [axis, a, b || ''].join('/'));
    var leaf = a;
    if (axis === 'services') leaf = a + '-for-' + b;
    if (axis === 'products' && b) leaf = a + '-' + b;
    return (locale === locales.DEFAULT_LOCALE ? '' : locale + '/') + 'insights/' + axis + '/' + leaf;
}

function brief(axis, a, b) {
    if (axis === 'services') {
        return 'How ' + SERVICES[a].en + ' applies to ' + INDUSTRIES[b].en + ': typical problems in this industry, what a good solution includes, what to ask a provider. Ground it in this project experience, described without naming any client: ' + pair(a, b)[2];
    }
    if (axis === 'products') return node(axis, a, b).brief + ' Product facts (make no other product claims): ' + PRODUCTS[a].facts;
    if (axis === 'examples') return node(axis, a, b).brief + ' The example document must be invented and fictional: made-up company, people and figures.';
    return node(axis, a, b).brief;
}

function cta(axis, a) {
    if (axis === 'products') return PRODUCTS[a].cta;
    if (axis === 'guides') return GUIDES[a].cta || 'agency';
    return 'agency';
}

function parent(axis, a) {
    return axis === 'guides' && GUIDES[a].parent ? GUIDES[a].parent : null;
}

function productUrl(key) {
    return PRODUCTS[key].url;
}

module.exports = {
    AXES: AXES, PERSONA_KEYS: PERSONA_KEYS, SERVICES: SERVICES, INDUSTRIES: INDUSTRIES,
    entries: entries, has: has, label: label, slugFor: slugFor, brief: brief, cta: cta,
    parent: parent, productUrl: productUrl
};
