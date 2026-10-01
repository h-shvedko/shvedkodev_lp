'use strict';

// Browser tests against the local dev server. Run with: docker compose run --rm e2e
var test = require('@playwright/test');

module.exports = test.defineConfig({
    testDir: './e2e',
    outputDir: './e2e/.results',
    fullyParallel: true,
    reporter: [['list']],
    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:9001'
    },
    projects: [
        { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
        { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }
    ]
});
