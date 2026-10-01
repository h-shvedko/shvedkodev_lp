'use strict';

// Interface strings for insight pages. English is complete; other locales fall back to
// English per key, never to the raw key. An unknown key is a programming error and throws.

var STRINGS = {
    en: {
        'ui.insights': 'Insights',
        'ui.index_title': 'Insights on Web Development',
        'ui.index_intro': 'Practical answers for people who plan, buy or run web projects: guides, example documents, and notes from our own work with Laravel, WordPress, automation and AI.',
        'ui.sections': 'Sections',
        'ui.contents': 'On this page',
        'ui.overview': 'Overview',
        'ui.example': 'Example',
        'ui.personas': 'Who this is for',
        'ui.faq': 'Questions and answers',
        'ui.related': 'Related pages',
        'ui.parent_note': 'Part of the broader guide:',
        'ui.updated': 'Updated',
        'ui.all_pages': 'All pages',
        'axis.guides': 'Guides',
        'axis.examples': 'Examples',
        'axis.services': 'Services by industry',
        'axis.products': 'Products',
        'axis_intro.guides': 'Guides to the decisions that shape a web project: cost, contracts, technology and delivery.',
        'axis_intro.examples': 'Example documents you can adapt for your own project. Every example is invented for illustration.',
        'axis_intro.services': 'How we apply each service in the industries we have worked in.',
        'axis_intro.products': 'The products we build ourselves and what they do.',
        'note.guides': 'This page reflects our own project experience. It is general guidance, not advice for your specific contract or legal situation.',
        'note.examples': 'The example on this page is invented for illustration. The company, people and figures are fictional.',
        'note.services': 'Based on our own project work. Clients are not named.',
        'note.products': 'This page describes our own product.',
        'cta.agency_title': 'Planning a project like this?',
        'cta.agency_text': 'Tell us what you are building. You get a straight answer on scope, approach and effort.',
        'cta.agency_button': 'Get in touch',
        'cta.craftly_title': 'Try it with Craftly',
        'cta.craftly_text': 'Craftly generates WordPress themes and Laravel applications from a description or a design.',
        'cta.craftly_button': 'Open Craftly',
        'cta.jobhunter_title': 'Try JobHunter',
        'cta.jobhunter_text': 'JobHunter finds and scores freelance jobs for you and drafts the application.',
        'cta.jobhunter_button': 'Open JobHunter',
        'persona.founder': 'Founder',
        'persona.cto': 'CTO or tech lead',
        'persona.product_manager': 'Product manager',
        'persona.marketing_lead': 'Marketing lead',
        'persona.agency_owner': 'Agency owner',
        'persona.it_manager': 'IT manager',
        'persona.project_manager': 'Project manager',
        'persona.operations_lead': 'Operations lead',
        'persona.freelancer': 'Freelancer',
        'persona.hr_lead': 'HR lead',
        'persona.educator': 'Education programme lead',
        'persona.ecommerce_manager': 'E-commerce manager',
        'persona.developer': 'In-house developer',
        'persona.procurement': 'Procurement lead'
    },
    de: {
        'ui.insights': 'Insights',
        'ui.index_title': 'Insights zur Webentwicklung',
        'ui.index_intro': 'Praktische Antworten für alle, die Webprojekte planen, beauftragen oder betreiben: Leitfäden, Beispieldokumente und Erfahrungen aus unserer Arbeit mit Laravel, WordPress, Automatisierung und KI.',
        'ui.sections': 'Bereiche',
        'ui.contents': 'Auf dieser Seite',
        'ui.overview': 'Überblick',
        'ui.example': 'Beispiel',
        'ui.personas': 'Für wen das relevant ist',
        'ui.faq': 'Fragen und Antworten',
        'ui.related': 'Verwandte Seiten',
        'ui.parent_note': 'Teil des übergeordneten Leitfadens:',
        'ui.updated': 'Aktualisiert',
        'ui.all_pages': 'Alle Seiten',
        'axis.guides': 'Leitfäden',
        'axis.examples': 'Beispiele',
        'axis.services': 'Leistungen nach Branche',
        'axis.products': 'Produkte',
        'axis_intro.guides': 'Leitfäden zu den Entscheidungen, die ein Webprojekt prägen: Kosten, Verträge, Technologie und Umsetzung.',
        'axis_intro.examples': 'Beispieldokumente, die Sie für Ihr eigenes Projekt anpassen können. Jedes Beispiel ist zur Veranschaulichung erfunden.',
        'axis_intro.services': 'So setzen wir unsere Leistungen in den Branchen ein, in denen wir gearbeitet haben.',
        'axis_intro.products': 'Die Produkte, die wir selbst entwickeln, und was sie leisten.',
        'note.guides': 'Diese Seite beruht auf unserer eigenen Projekterfahrung. Sie ist eine allgemeine Orientierung und keine Beratung zu Ihrem konkreten Vertrag oder Ihrer Rechtslage.',
        'note.examples': 'Das Beispiel auf dieser Seite ist zur Veranschaulichung erfunden. Unternehmen, Personen und Zahlen sind fiktiv.',
        'note.services': 'Grundlage ist unsere eigene Projektarbeit. Kunden werden nicht genannt.',
        'note.products': 'Diese Seite beschreibt unser eigenes Produkt.',
        'cta.agency_title': 'Sie planen ein ähnliches Projekt?',
        'cta.agency_text': 'Schildern Sie uns Ihr Vorhaben. Sie erhalten eine klare Einschätzung zu Umfang, Vorgehen und Aufwand.',
        'cta.agency_button': 'Kontakt aufnehmen',
        'cta.craftly_title': 'Mit Craftly ausprobieren',
        'cta.craftly_text': 'Craftly erzeugt WordPress-Themes und Laravel-Anwendungen aus einer Beschreibung oder einem Design.',
        'cta.craftly_button': 'Craftly öffnen',
        'cta.jobhunter_title': 'JobHunter ausprobieren',
        'cta.jobhunter_text': 'JobHunter findet und bewertet Freelance-Jobs für Sie und entwirft die Bewerbung.',
        'cta.jobhunter_button': 'JobHunter öffnen',
        'persona.founder': 'Gründerinnen und Gründer',
        'persona.cto': 'CTO oder Tech Lead',
        'persona.product_manager': 'Produktmanagement',
        'persona.marketing_lead': 'Marketingleitung',
        'persona.agency_owner': 'Agenturinhaberinnen und -inhaber',
        'persona.it_manager': 'IT-Leitung',
        'persona.project_manager': 'Projektleitung',
        'persona.operations_lead': 'Betriebsleitung',
        'persona.freelancer': 'Freelancerinnen und Freelancer',
        'persona.hr_lead': 'HR-Leitung',
        'persona.educator': 'Leitung von Bildungsprogrammen',
        'persona.ecommerce_manager': 'E-Commerce-Leitung',
        'persona.developer': 'Interne Entwicklerinnen und Entwickler',
        'persona.procurement': 'Einkaufsleitung'
    }
};

function t(locale, key) {
    var own = STRINGS[locale];
    if (own && own[key] !== undefined) return own[key];
    if (STRINGS.en[key] !== undefined) return STRINGS.en[key];
    throw new Error('Missing translation key: ' + key);
}

function keys() {
    return Object.keys(STRINGS.en);
}

module.exports = { t: t, keys: keys, STRINGS: STRINGS };
