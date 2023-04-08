import { contextBridge, ipcRenderer } from "electron";
import { RecordOptions, EVENTS } from "../../models/Models";
import { writeFile } from "node:fs";
import * as bin from "buffer";

contextBridge.exposeInMainWorld("electronAPI", {
  runHandle: (callback: () => void) =>
    ipcRenderer.on(EVENTS.ipc_run_cmd, callback),
  getRecorderOptions: () =>
    ipcRenderer.invoke(
      EVENTS.ipc_fetch_record_options
    ) as Promise<RecordOptions>,
  writeFile,
  BufferFrom: bin.Buffer.from,
  startRecordHandle: (callback: () => void) =>
    ipcRenderer.on(EVENTS.ipc_start_record, callback),
  stopRecordHandle: (callback: () => void) =>
    ipcRenderer.on(EVENTS.ipc_stop_record, callback),
  onError: (error: string) => ipcRenderer.send(EVENTS.ipc_error, error),
  fileSaved: () => ipcRenderer.invoke(EVENTS.record_file_saved),
});
