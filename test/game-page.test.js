import test from 'ava';
import ScreenshotTester from 'puppeteer-screenshot-tester';
import testHelper from './puppeteer-test-helper.js';

const START_PAGE_URL = 'http://localhost:3000';

test('title should be: This is Pong!', testHelper, async (t, page) => {
    await page.goto(START_PAGE_URL);
    t.is(await page.title(), 'This is Pong!');
});

test.skip('welcome screen should look like it did in the previous version', testHelper, async (t, page) => {
    const tester = await ScreenshotTester();
    await page.goto(START_PAGE_URL);

    const result = await tester(page, 'welcome-screen');

    t.true(result);
});