import test from 'ava';
import testHelper from './puppeteer-test-helper.js';

const START_PAGE_URL = 'http://localhost:3000';

test('title should be: This is Pong!', testHelper, async (t, page) => {
    await page.goto(START_PAGE_URL);
    
    t.is(await page.title(), 'This is Pong!');
});

test('should contain a canvas element', testHelper, async (t, page) => {
    await page.goto(START_PAGE_URL);

    t.not(await page.$('canvas'), null);
});