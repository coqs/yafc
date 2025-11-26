import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3125',
});

  // Retrieve immediate children of a folder
export const getFolderFiles = (folderPath) =>
  api.post('/getFiles', { folderPath }).then((res) => res.data);

// Keep the old name for backward compatibility
export const getFiles = getFolderFiles;

export const deleteFile = (filePath) =>
  api.post('/deleteFile', { filePath });

export const keepFile = (filePath) =>
  api.post('/keepFile', { filePath });

export const getFileSize = (filePath) =>
  api.post('/getFileSize', { filePath }).then((res) => res.data);

// Recursively retrieve all files & folders inside a directory
export const getFolderRoots = (folderPath) =>
  api.post('/getFolderRoots', { folderPath }).then((res) => res.data);

export const getZipContents = (filePath) =>
  api.post('/getZIPcontainments', { filePath }).then((res) => res.data);

export const fetchFile = (filePath) =>
  api.get('/file', { params: { filePath }, responseType: 'blob' }).then((res) => res.data);

// Sessions
export const saveToSessions = (object) =>
  api.post('/saveToSessions', { object }).then((res) => res.data);

export const getCurrentSessionNumber = () =>
  api.post('/getCurrentSessionNumber').then((res) => res.data);

export const createSession = (folderPath) =>
  api.post('/createSession', { folderPath }).then((res) => res.data);

export const modifySessionData = (object, sessionNumber) =>
  api.post('/modifySessionData', { object, sessionNumber }).then((res) => res.data);

export const getSessionData = (sessionNumber) =>
  api.post('/getSessionData', { sessionNumber }).then((res) => res.data);

export const deleteSession = (sessionNumber) =>
  api.post('/deleteSession', { sessionNumber }).then((res) => res.data);

export default api;
