import * as fs from "fs";

function replaceImagesWithPlaceholder(markdownContent) {
  const imageRegex = /!\[.*?\]\(.*?\)/g;
  return markdownContent.replace(imageRegex, "*missing image*");
}

function replaceAngleBrackets(inputString) {
  // Regular expression to match strings starting with <http and ending with >
  const regex = /<http(s)?:\/\/[^>]+>/g;

  // Replace the matched strings by removing the angle brackets
  const result = inputString.replace(regex, (match) => {
    // Remove the first and last character (the angle brackets)
    return match.slice(1, -1);
  });

  return result;
}

function prepareText(value, title, data) {
  value =
    `---
title: ${title} 
source: ${data.preloadedState.global.yfmSettings.pluginOptions.wikiPath}
---
` + value;

  // https://disk.yandex.ru/client/disk/DataFabric/WikiFiles/

  const linkRegex = /{%\s*[^%]*\s*%}/g;
  const matches = value.match(linkRegex);
  let result = value;
  if (matches) {
    matches.forEach((linkMatch, index) => {
      // console.log(linkMatch);
      const linkPropRegex = /src="([^"]+)"\s+name="([^"]+)"/;
      const match = linkMatch.match(linkPropRegex);
    
      const src = match[1];
      const title = match[2];
      const name = filesDict[src]; 

      const baseUrl =  "https://disk.yandex.ru/client/disk/DataFabric/WikiFiles/"

      const mdLink =  `[${title}](${baseUrl}${encodeURI(name)})`;
      // console.log("src:", src);
      // console.log("name:", name);
   
      result = result.replace(
        linkMatch,
        mdLink
      );
    });
  }

  return result;
  // result = replaceImagesWithPlaceholder(result);
  // result =  replaceAngleBrackets(result);
  // result =  result.replace(/{/g, " ").replace(/}/g, " ")
  // return result;
}

function clearName(input, index, data) {
  const positionIndex =
    positions[data.preloadedState.global.yfmSettings.pluginOptions.wikiPath];
  // Use a regular expression to match only spaces, Latin, and Cyrillic characters
  const regex = /[\p{L}\p{N}]+/gu;

  // Use the match method to extract the allowed characters
  let words = input.match(regex);

  let length = 0;
  const selectedWords = [];
  for (let word of words) {
    length += word.length;
    selectedWords.push(word);
    if (length > 7) {
      break;
    }
  }
  let result = selectedWords.join("-");
  if (result.length > 15) {
    result = result.substring(0, 14);
  }
  result = positionIndex.toString().padStart(3, "0") + "-" + result;
  return result;
}
function convertPage(title, sourcePath, targetParentPath, index) {
  console.log(sourcePath);
  const childFolders = fs
    .readdirSync(sourcePath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const dataText = fs.readFileSync(sourcePath + "/data.json", "utf8");
  const data = JSON.parse(dataText);

  let targetTitle = clearName(title, index, data);
  let fileName: string = targetTitle + ".md";
  let folderPath: string = targetParentPath;
  let childrenFolderPath = targetParentPath + "/" + targetTitle;

  if (fs.existsSync(childrenFolderPath)) {
    // TODO исправить применение индекса в имени
    throw Error("Дубликат");
  }
  fs.mkdirSync(childrenFolderPath, { recursive: true });
  let filePath = folderPath + "/" + fileName;
  // const dataFilePath = childrenFolderPath + "/data.json";
  let content = fs.readFileSync(sourcePath + "/page.md", "utf8");
  content = prepareText(content, title, data);

  fs.writeFileSync(filePath, content, "utf8");
  // fs.writeFileSync(dataFilePath, dataText, "utf8");
  let childIndex = 1;
  for (let folder of childFolders) {
    convertPage(
      folder,
      sourcePath + "/" + folder,
      targetParentPath + "/" + targetTitle,
      childIndex
    );
    childIndex++;
  }
}

const sourcePath = "temp/pages";
const targetPath = "temp/gitlab";

function getLevelPositions(items, positions) {
  let i = 0;
  for (let item of items) {
    i++;
    positions[item.pageUrl] = i;
    getLevelPositions(item.children, positions);
  }
}

function getPositions() {
  const positions = {};
  const navTree = JSON.parse(
    fs.readFileSync("../data/meta/nav-tree.json", "utf8")
  );
  getLevelPositions(navTree, positions);
  return positions;
}

let positions = {};

function getFilesDict() {
  const data = fs.readFileSync("../data/meta/attachments-mappings.txt", "utf8");
  const lines = data.split("\n");
  const dict = {};
  lines.forEach((line) => {
    const parts = line.split("=");
    if (parts.length != 2) {
      throw Error();
    }
    const [key, value] = parts;
    dict[key.trim()] = value.trim();
  });

   return dict;
}

let filesDict = {};

function main() {
  positions = getPositions();
  filesDict =  getFilesDict();
  const folders = fs
    .readdirSync(sourcePath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
  fs.rmSync(targetPath, { recursive: true, force: true });
  let index = 1;
  for (let folder of folders) {
    convertPage(folder, sourcePath + "/" + folder, targetPath, index);
    index++;
  }
}

function test() {
  positions = getPositions();
  filesDict =  getFilesDict();
  fs.rmSync(targetPath + "/017-База-знаний/001-ГОСТ-Р-серии", {
    recursive: true,
    force: true,
  });
  convertPage(
    "ГОСТ Р серии 58651",
    sourcePath + "/" + "База знаний/ГОСТ Р серии 58651",
    targetPath + "/017-База-знаний",
    1
  );
}

// main();

test();
