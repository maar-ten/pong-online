import puppeteer from 'puppeteer';

export default async function (t, run) {
	const browser = await puppeteer.launch({
        headless: true,
        args: [ // Disable Chromium's unnecessary SUID sandbox.
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ]
	});
	const page = await browser.newPage();
	try {
		await run(t, page);
	} finally {
		await page.close();
		await browser.close();
	}
}