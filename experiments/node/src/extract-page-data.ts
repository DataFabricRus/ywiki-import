import puppeteer, { Browser, Page } from "puppeteer";
import * as fs from 'fs';

(async () => {
  const browser: Browser = await puppeteer.launch();
  const page: Page = await browser.newPage();
  await page.goto(
    "http://127.0.0.1:8080/wiki.yandex.ru/hkqt/gost/_view%3DpdfExport.html"
  );
  await page.waitForSelector("body");
  const data = await page.evaluate(() => {
    return (window as any).__DATA__; // Assuming window.DATA is defined and accessible
  });

  fs.mkdirSync("temp", { recursive: true });
  fs.writeFileSync("temp/page-data.json", JSON.stringify(data));

  await browser.close();
})();
