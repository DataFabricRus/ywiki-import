import puppeteer, { Browser, Page } from "puppeteer";
import * as fs from "fs";

const baseUrl = "http://127.0.0.1:8080/wiki.yandex.ru";
const fileUrl = "_view%3DpdfExport.html";
const rootPath = "temp/pages";
import * as TurndownService from "turndown";

class Semaphore {
  private maxConcurrent: number;
  private currentCount: number;
  private queue: (() => void)[];

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
    this.currentCount = 0;
    this.queue = [];
  }

  async acquire(): Promise<void> {
    if (this.currentCount < this.maxConcurrent) {
      this.currentCount++;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.currentCount--;
    if (this.queue.length > 0) {
      const nextResolve = this.queue.shift();
      if (nextResolve) {
        this.currentCount++;
        nextResolve();
      }
    }
  }
}

const semaphore = new Semaphore(10);

async function extractPageContent(url) {
  await semaphore.acquire();
  const turndownService = new TurndownService();
  const browser: Browser = await puppeteer.launch();
  const page: Page = await browser.newPage();
  await page.goto(url);
  await page.waitForSelector("body");
  const data = await page.evaluate(() => {
    return (window as any).__DATA__;
  });

  const html: string = await page.evaluate(() => {
    const rootElement = document.querySelector("#root");
    return rootElement ? rootElement.innerHTML : "";
  });
  const markdown = turndownService.turndown(html);

  await browser.close();
  await semaphore.release();
  return { data, html, markdown };
}

let totalCount = 0;
let processedCount = 0;

async function extractPage(parentPath, item) {
  processedCount += 1;
  let folderName: string = item.title;
  if (!folderName) {
    folderName = "-";
  }
  folderName = folderName.replace(/"/g, "'");
  folderName = folderName.replace(/[\/\\:*?<>|]/g, " ");
  const folderPath = `${parentPath}${folderName}/`;
  const fullFolderPath = `${rootPath}/${folderPath}`;
  const mdPath = `${fullFolderPath}page.md`;
  
  if (!fs.existsSync(mdPath)) {
    const pageUrl = item["pageUrl"];
    console.log(processedCount, "/", totalCount, pageUrl);
    const url = `${baseUrl}${pageUrl}${fileUrl}`;
    const pageContent = await extractPageContent(url);
    fs.mkdirSync(fullFolderPath, { recursive: true });

    pageContent.data.folderPath = folderPath;
    const jsonText = JSON.stringify(pageContent.data);
    fs.writeFileSync(`${fullFolderPath}data.json`, jsonText, {
      encoding: "utf8",
    });

    fs.writeFileSync(`${fullFolderPath}rendered.html`, pageContent.html, {
      encoding: "utf8",
    });

    fs.writeFileSync(`${fullFolderPath}rendered.md`, pageContent.markdown, {
      encoding: "utf8",
    });

    const pageName = pageContent.data.preloadedState.pages.current;
    let mdText = "";
    let htmlText = "";
    if (pageName !== "") {
      mdText = pageContent.data.preloadedState.pages.entities[pageName].content;
      htmlText = pageContent.data.preloadedState.pages.entities[pageName].html;
    }
    if (htmlText) {
      fs.writeFileSync(`${fullFolderPath}page.html`, htmlText, {
        encoding: "utf8",
      });
    }

    fs.writeFileSync(mdPath, mdText, { encoding: "utf8" });
  }

  // for (let child of item.children) {
  //   extractPage(folderPath, child);
  // }

  const promises = item.children.map((child) => extractPage(folderPath, child));
  await Promise.all(promises);
}

function countItems(items) {
  let count = 0;
  for (let item of items) {
    count += 1 + countItems(item.children);
  }
  return count;
}

async function main(resume = true) {
  const navTree = JSON.parse(
    await fs.readFileSync("../data/meta/nav-tree.json", "utf8")
  );

  if (!resume) {
    fs.rmSync(rootPath, { recursive: true, force: true });
  }
  totalCount = countItems(navTree);
  // for (let item of navTree) {
  //     extractPage("/", item);
  // }

  const promises = navTree.map((item) => extractPage("/", item));
  await Promise.all(promises);
  //   console.log(navTree);
}

main(true);

