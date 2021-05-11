import test from 'ava';
import testHelper from './test-helper.js';

test('Title should contain This is Pong!', testHelper, async (t, page) => {
    await page.goto('http://localhost:3000');
    t.true((await page.title()).includes('This is Pong!'));
})