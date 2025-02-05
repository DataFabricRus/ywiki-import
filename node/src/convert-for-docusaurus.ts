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

function prepareText(value) {
  const regex = /{%\s*[^%]*\s*%}/g;
  const matches = value.match(regex);
  let result = value;
  if (matches) {
    matches.forEach((match, index) => {
      console.log(match);
      result = result.replace(
        match,
        match.replace(/{%/g, " ").replace(/%}/g, " ")
      );
    });
  }
  result = replaceImagesWithPlaceholder(result);
  result =  replaceAngleBrackets(result);
  result =  result.replace(/{/g, " ").replace(/}/g, " ")
  return result;
}
function clearName(value: string) {
  value = value.replace(/\[/g, "(").replace(/\]/g, ")").replace(/#/g, " ");
  return value;
}
function convertPage(title, sourcePath, targetParentPath) {
  // console.log(sourcePath);
  const childFolders = fs
    .readdirSync(sourcePath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  let fileName: string = title + ".md";
  let folderPath: string = targetParentPath;
  if (childFolders.length) {
    folderPath = targetParentPath + "/" + title;
    fileName = "index.md";

    fs.mkdirSync(clearName(folderPath), { recursive: true });
  }
  let filePath = folderPath + "/" + fileName;

  let content = fs.readFileSync(sourcePath + "/page.md", {
    encoding: "utf8",
  });
  content = prepareText(content);
  fs.writeFileSync(clearName(filePath), content, {
    encoding: "utf8",
  });

  for (let folder of childFolders) {
    convertPage(
      folder,
      sourcePath + "/" + folder,
      targetParentPath + "/" + title
    );
  }
}

const sourcePath = "temp/pages";
const targetPath = "temp/docusaurus";
function main() {
  const folders = fs
    .readdirSync(sourcePath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
  fs.rmSync(targetPath, { recursive: true, force: true });
  for (let folder of folders) {
    convertPage(folder, sourcePath + "/" + folder, targetPath);
  }
}

main();
