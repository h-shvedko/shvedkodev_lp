'use strict';

// Site languages for insight pages. English is the default and the x-default target.
var LOCALES = {
    en: { englishName: 'English', nativeName: 'English', bcp47: 'en' },
    de: { englishName: 'German', nativeName: 'Deutsch', bcp47: 'de' }
};

var DEFAULT_LOCALE = 'en';

function all() {
    return Object.keys(LOCALES);
}

function englishName(locale) {
    return get(locale).englishName;
}

function nativeName(locale) {
    return get(locale).nativeName;
}

function bcp47(locale) {
    return get(locale).bcp47;
}

function get(locale) {
    if (!LOCALES[locale]) throw new Error('Unknown locale: ' + locale);
    return LOCALES[locale];
}

module.exports = { all: all, englishName: englishName, nativeName: nativeName, bcp47: bcp47, DEFAULT_LOCALE: DEFAULT_LOCALE };
