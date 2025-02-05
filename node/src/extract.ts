import puppeteer, { Browser, Page } from "puppeteer";
import * as fs from "fs";

const baseUrl = "http://127.0.0.1:8080/wiki.yandex.ru";
const fileUrl = "_view%3DpdfExport.html";
const rootPath = "temp/pages";

async function extractPageData(url) {
  const browser: Browser = await puppeteer.launch();
  const page: Page = await browser.newPage();
  await page.goto(url);
  await page.waitForSelector("body");
  const data = await page.evaluate(() => {
    return (window as any).__DATA__;
  });
  await browser.close();
  return data;
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
    const data = await extractPageData(url);

    fs.mkdirSync(fullFolderPath, { recursive: true });
    data.folderPath = folderPath;
    const jsonText = JSON.stringify(data);
    fs.writeFileSync(`${fullFolderPath}data.json`, jsonText, {
      encoding: "utf8",
    });
    const pageName = data.preloadedState.pages.current;
    let mdText = "";
    if (pageName !== "") {
      mdText = data.preloadedState.pages.entities[pageName].content;
    }

    fs.writeFileSync(mdPath, mdText, { encoding: "utf8" });
  }

  for (let child of item.children) {
    await extractPage(folderPath, child);
  }
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
  for (let item of navTree) {
    await extractPage("/", item);
  }
  //   console.log(navTree);
}

main();
