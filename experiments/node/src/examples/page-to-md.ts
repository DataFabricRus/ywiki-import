import puppeteer, { Browser, Page } from "puppeteer";
import * as TurndownService from "turndown";
import * as fs from 'fs';

(async () => {
  const browser: Browser = await puppeteer.launch();
  const page: Page = await browser.newPage();
  await page.goto(
    "http://127.0.0.1:8080/wiki.yandex.ru/hkqt/gost/_view%3DpdfExport.html"
  );
  await page.waitForSelector("body");

  const html: string = await page.evaluate(() => {
    const rootElement = document.querySelector("#root");
    return rootElement ? rootElement.innerHTML : "";
  });

  fs.mkdirSync("temp", { recursive: true });
  fs.writeFileSync("temp/output.html", html);

  const turndownService = new TurndownService();
  const markdown: string = turndownService.turndown(html);
  fs.writeFileSync("temp/output.md", markdown);

  await browser.close();
})();
