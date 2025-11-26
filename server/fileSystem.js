import * as fs from "fs";
import { fileURLToPath } from 'url';
import { basename, dirname, parse } from 'path';
import path from 'path';
import extract from "extract-zip";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sessionsPATH = path.join(__dirname, "database", "sessions.json");
const tempFilesPATH = path.join(__dirname, "temp_files");

export const getFileSize = async (filePath) => {
    const stats = await fs.promises.stat(filePath);
    return stats.size;   
};

export const getFolderFiles = async (folderPath) => {
    let files = [];
    let fileNames = fs.readdirSync(folderPath);

    for (const name of fileNames) {
        console.log('going through file ' + name);
        let isDirectory;
        let filePath = path.join(folderPath, name);
        let fileSize = await getFileSize(filePath);

        let fileboingboing = fs.statSync(filePath);
        isDirectory = fileboingboing.isDirectory();

        files.push({"filePath": filePath, "fileSize": fileSize, "isDirectory": isDirectory});
    }

    return files;
};

export const getFileName = (filePath) => {
    let name = basename(filePath);
    let base = name.split("-")[0];
    return base;
};

export const extractZIP = async (filePath, outputPath) => {
    try {
        await extract(filePath, {dir: outputPath});
        console.log("finished extracting");
    } catch(err) {
        console.log(`extractzip error: ${err}`);
    }
};

export const getFolderRoots = async (folderPath) => {

    let bigJSONROOTED = [];

    let didHaveFolder = false;
    let foldersPaths = [];

    let stufforiginal = await getFolderFiles(folderPath)
    for (let t=0; t<stufforiginal.length; t++) {
        if (stufforiginal[t].isDirectory) {

            foldersPaths.push(stufforiginal[t].filePath)
            didHaveFolder = true;
            bigJSONROOTED.push(stufforiginal[t])

        }
        else {
            bigJSONROOTED.push(stufforiginal[t])
        }
    }

    while (didHaveFolder) {

            didHaveFolder = false;
            let newFolders = [];

            outer1: for (let i=0; i < foldersPaths.length; i++) {

                let stuff = await getFolderFiles(foldersPaths[i])

                outer2: for (let j=0; j < stuff.length; j++) {

                    if (stuff[j].isDirectory) {

                        console.log("folder")

                        newFolders.push(stuff[j].filePath)
                        didHaveFolder = true;
                        
                        bigJSONROOTED.push(stuff[j])

                    } else {
                        console.log("not a folder")

                        bigJSONROOTED.push(stuff[j])
                    }
                }
            }
            
            foldersPaths = newFolders
        
        }

        return bigJSONROOTED;
}