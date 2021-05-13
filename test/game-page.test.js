import test from 'ava';
import testHelper from './puppeteer-test-helper.js';

const START_PAGE_URL = 'http://localhost:3000';

test('title should be: This is Pong!', testHelper, async (t, page) => {
    await page.goto(START_PAGE_URL);
    t.is(await page.title(), 'This is Pong!');
});

test.skip('starting page renders the same as previous version', testHelper, async (t, page) => {
    await page.goto(START_PAGE_URL);
    // await page.screenshot({ path: 'example.png' });
    // todo implement
});