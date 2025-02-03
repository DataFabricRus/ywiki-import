const puppeteer = require('puppeteer');
const TurndownService = require('turndown');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8080/wiki.yandex.ru/hkqt/gost/_view%3DpdfExport.html');
  await page.waitForSelector('body');
  const html = await page.evaluate(() => document.querySelector('#root').innerHTML);
  fs.mkdirSync("temp", { recursive: true });
  fs.writeFileSync('temp/output.html', html);
  const turndownService = new TurndownService();
  const markdown = turndownService.turndown(html);
  fs.writeFileSync('temp/output.md', markdown);
  await browser.close();
})();