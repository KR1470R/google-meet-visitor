import { contextBridge, ipcRenderer } from "electron";
import { RecordOptions } from "../Models";
import { writeFile } from "node:fs";
import * as bin from "buffer";

contextBridge.exposeInMainWorld("electronAPI", {
  runHandle: (callback: () => void) => ipcRenderer.on("run", callback),
  getRecorderOptions: () =>
    ipcRenderer.invoke("fetchRecordOptions") as Promise<RecordOptions>,
  writeFile,
  BufferFrom: bin.Buffer.from,
  startRecordHandle: (callback: () => void) =>
    ipcRenderer.on("onStartRecord", callback),
  stopRecordHandle: (callback: () => void) =>
    ipcRenderer.on("onStopRecord", callback),
  onError: (error: string) => ipcRenderer.send("onError", error),
  fileSaved: () => ipcRenderer.invoke("fileSaved"),
});
