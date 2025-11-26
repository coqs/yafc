import * as fs from "fs";
import cors from 'cors';
import express from 'express';
import { fileURLToPath } from 'url';
import { basename, dirname, parse } from 'path';
import path from 'path';

// function Imports
import { saveToSessions, getCurrentSessionNumber, createSession, modifySessionData, getSessionData, deleteSession } from "./sessions.js";
import { getFileSize, getFolderFiles, getFileName, extractZIP, getFolderRoots } from "./fileSystem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sessionsPATH = path.join(__dirname, "database", "sessions.json");
const tempFilesPATH = path.join(__dirname, "temp_files");

const app = express();
const PORT = 3125;
app.use(express.json({ limit: '200mb' }));
app.use(cors());

// requests ------------------

//sessions

app.post("/saveToSessions", async (req, res) => {
    let object = req.body.object
    await saveToSessions(object)

    res.status(200);
    res.send("saved");
});

app.post("/getCurrentSessionNumber", async (req, res) => {
    let sessionNumber = await getCurrentSessionNumber()
    res.status(200);
    res.send(JSON.stringify(sessionNumber));
});

app.post("/createSession", async (req, res) => {

    let folderPath = req.body.folderPath
    let sessionResult = await createSession(folderPath)

    res.status(200);
    res.send(JSON.stringify(sessionResult));
});

app.post("/modifySessionData", async (req, res) => {

    let object = req.body.object
    let sessionNumber = req.body.sessionNumber

    await modifySessionData(object, sessionNumber)

    res.status(200);
    res.send("modified");
});

app.post("/getSessionData", async (req, res) => {

    let sessionNumber = req.body.sessionNumber

    let data = await getSessionData(sessionNumber)

    res.status(200);
    res.send(JSON.stringify(data));
});

app.post("/deleteSession", async (req, res) => {

    let sessionNumber = req.body.sessionNumber

    await deleteSession(sessionNumber)

    res.status(200);
    res.send("session deleted");
});

//files
app.post("/getFileSize", async (req, res) => {
    let filePath = req.body.filePath;
    let size = await getFileSize(filePath)
    res.status(200);
    res.send(JSON.stringify(size));
});

app.post("/deleteFile", (req, res) => {
    let filePath = req.body.filePath;
    try {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            // Delete directory recursively
            fs.rmSync(filePath, { recursive: true, force: true });
        } else {
            // Delete file
            fs.unlinkSync(filePath);
        }
        res.status(200);
        res.send("deleted successfully");
    } catch (err) {
        res.status(500);
        res.send("error deleting: " + err.message);
    }
});

app.post("/keepFile", (req, res) => {
    let filePath = req.body.filePath;
    res.status(200);
    res.send("did nothing successfully");
});

app.get("/file", (req, res) => {
    let filePath = req.query.filePath;
    res.status(200);
    res.sendFile(filePath);
});

app.post("/getFiles", async (req, res) => {
    console.log('got a request!');
    let folderPath = req.body.folderPath;
    let files = await getFolderFiles(folderPath);
    res.send(files);
});

app.post("/getZIPcontainments", async (req, res) => {
    let filePath = req.body.filePath;
    let nameThingy = getFileName(filePath);
    let newPath = path.join(tempFilesPATH, nameThingy);
    
    await extractZIP(filePath, newPath);
    let ALLfiles = await getFolderRoots(newPath);

    res.send(ALLfiles);

});

app.post("/getFolderRoots", async (req, res) => {
    let filesANDfolders = await getFolderRoots(req.body.folderPath);
    res.send(filesANDfolders);
})

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
