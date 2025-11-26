import * as fs from "fs";
import { fileURLToPath } from 'url';
import { basename, dirname, parse } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sessionsPATH = path.join(__dirname, "database", "sessions.json");
const tempFilesPATH = path.join(__dirname, "temp_files");

export const saveToSessions = async (object) => {
    let unparsed = await fs.promises.readFile(sessionsPATH);
    let parsed = JSON.parse(unparsed);

    parsed.push(object);

    await fs.promises.writeFile(sessionsPATH, JSON.stringify(parsed, null, 2));
};

export const getCurrentSessionNumber = async () => {
    let unparsed = await fs.promises.readFile(sessionsPATH);
    let parsed = JSON.parse(unparsed);
    return parsed.length;
};

export const createSession = async (path) => {
    let currentSessionNumber = await getCurrentSessionNumber();
    
    let object = {
        sessionNumber: currentSessionNumber,
        path: path,
        deletedFiles: [],
        keptFiles: [],
        filesLeft: [],
        lastFilePathLeftOn: ""
    };

    await saveToSessions(object);
    return currentSessionNumber;
};

export const modifySessionData = async (object, sessionNumber) => {
    let unparsed = await fs.promises.readFile(sessionsPATH);
    let parsed = JSON.parse(unparsed);
    
    parsed[sessionNumber] = object;
    await fs.promises.writeFile(sessionsPATH, JSON.stringify(parsed, null, 2));
}

export const getSessionData = async (sessionNumber) => {

    let unparsed = await fs.promises.readFile(sessionsPATH);
    let parsed = JSON.parse(unparsed);

    return parsed[sessionNumber]

}

export const deleteSession = async (sessionNumber) => {
    let unparsed = await fs.promises.readFile(sessionsPATH);
    let parsed = JSON.parse(unparsed);

    parsed.splice(sessionNumber, 1)
    await fs.promises.writeFile(sessionsPATH, JSON.stringify(parsed, null, 2));
}