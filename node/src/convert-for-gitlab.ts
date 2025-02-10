import * as fs from "fs";

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function fixLinks(result: any) {
  const linkRegex = /{%\s*[^%]*\s*%}/g;
  const matches = result.match(linkRegex);

  if (matches) {
    matches.forEach((linkMatch, index) => {
      // console.log(linkMatch);
      const linkPropRegex = /src="([^"]+)"\s+name="([^"]+)"/;
      const propMatch = linkMatch.match(linkPropRegex);
      if (propMatch) {
        const src = propMatch[1];
        const title = propMatch[2];
        const name = filesDict[src];

        const baseUrl =
          "https://disk.yandex.ru/client/disk/DataFabric/WikiFiles/";

        const mdLink = `[${title}](${baseUrl}${encodeURI(name)})`;
        // console.log("src:", src);
        // console.log("name:", name);
        result = result.replace(linkMatch, mdLink);
      }
    });
  }
  return result;
}

function fixTables(value: string, filePath: string): string {
  const pattern = /#\|.*?\|#/gs;
  const matches = value.match(pattern);
  if (matches) {
    for (let table of matches) {
      let rows = table.replace("#|", "").replace("|#", "").split(`||`);
      rows = rows.map((it) => it.trim()).filter((it) => it);
      const newRows = [];
      rows.forEach((row, index) => {
        row = row.replace("||", "");
        const cells = row.split("|");
        const newCells = [];
        for (let cell of cells) {
          // if (filePath.indexOf("060-Реестр-площадок") > 0) {
          //   var x = table;
          // }
          cell = cell.trim().replace(/\n/g, "<br>").replace(/\r/g, "<br>");

          while (cell.indexOf("<br><br>") > -1) {
            cell = cell.replace("<br><br>", "<br>");
          }

          newCells.push(cell);
        }
        const newRow = "|" + newCells.join("|") + "|";
        newRows.push(newRow);
        // console.log(newRow);
        if (index == 0) {
          newRows.push("|" + newCells.map(() => "---").join("|") + "|");
        }
      });
      const newTable = newRows.join("\n");
      value = value.replace(table, newTable);
    }
    console.log(filePath);
  }

  return value;
}

function prepareText(value, title, data, filePath) {
  let user = "-";
  let modified = "-";
  for (let key in data.preloadedState?.users?.entities || {}) {
    user = data.preloadedState.users?.entities[key].display_name;
  }

  for (let key in data.preloadedState?.pages?.entities || {}) {
    modified = data.preloadedState?.pages?.entities[key].attributes.modified_at;
    modified = formatDate(modified);
  }

  value =
    `---
title: ${title} 
source: ${data.preloadedState.global.yfmSettings.pluginOptions.wikiPath}
---
` +
    `<small>Изменено в Yandex Wiki: **${user}, ${modified}**</small>

` +
    value;

  // https://disk.yandex.ru/client/disk/DataFabric/WikiFiles/

  let result = value;

  result = fixLinks(result);
  result = fixTables(result, filePath);

  return result;
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
  result = (positionIndex * 10).toString().padStart(3, "0") + "-" + result;
  return result;
}
function convertPage(title, sourcePath, targetParentPath, index) {
  // console.log(sourcePath);
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
  content = prepareText(content, title, data, filePath);

  fs.writeFileSync(filePath, content, "utf8");
  // if (filePath.indexOf("060-Реестр-площадок") > 0) {
  //   var x = 0;
  // }
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
  filesDict = getFilesDict();
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
  filesDict = getFilesDict();
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

main();

// test();
