import { BrowserWindow, desktopCapturer, ipcMain } from "electron";
import Config from "./Config";
import { checkAccessToPath, Events, splitDate } from "./Util";
import { RecordOptions } from "./Models";
import path from "node:path";
import Logger from "./Logger";

export default class RecordManager {
  public activated: boolean;
  private path: string;
  private current_tab_source?: Electron.DesktopCapturerSource;
  private mainWindow?: BrowserWindow;

  constructor() {
    this.activated = Config.get_param("RECORD_TAB", false) === "true";
    const user_path = Config.get_param("OUTPUT_RECORD_TAB", false);
    const current_date = splitDate();
    const filename = `\
/records/output_video_\
${current_date.day}_\
${current_date.month}_\
${current_date.year}_\
${current_date.h}_\
${current_date.m}_\
${current_date.s}.mp4`;
    this.path =
      user_path && checkAccessToPath(user_path)
        ? user_path
        : path.join(__dirname, filename);
  }

  public async init(target_tab_name: string, mainWindow: BrowserWindow) {
    if (!this.activated) return;

    this.mainWindow = mainWindow;

    const media_sources = await desktopCapturer.getSources({
      types: ["window", "screen"],
    });
    this.current_tab_source = media_sources.find((tab) =>
      tab.name.includes(target_tab_name)
    );

    if (!this.current_tab_source) {
      Events.emit(
        "on_exit",
        `Couldn't find target window with title: ${target_tab_name}`
      );
      return;
    }

    ipcMain.handle("fetchRecordOptions", () => {
      return {
        isActive: this.activated,
        isMuted: false,
        targetWindowSource: this.current_tab_source,
        filePath: this.path,
      } as RecordOptions;
    });

    ipcMain.on("onError", (event, error) => {
      Events.emitCheckable("on_exit", error);
    });

    this.mainWindow.webContents.send("run");
  }

  public startRecord() {
    if (!this.activated) return;

    if (!this.mainWindow) {
      Events.emitCheckable(
        "on_exit",
        "RECORD_ERROR: Main window was not specified!"
      );
      return;
    }
    this.mainWindow.webContents.send("onStartRecord");
    Logger.printHeader("RecordManager", "Started recording...");
  }

  public stopRecord() {
    if (!this.activated) return;

    if (!this.mainWindow) {
      Events.emitCheckable(
        "on_exit",
        "RECORD_ERROR: Main window was not specified!"
      );
      return;
    }

    this.mainWindow.webContents.send("onStopRecord");

    ipcMain.handle("fileSaved", () => {
      Logger.printHeader(
        "RecordManager",
        `Your video record saved successfully in ${this.path}`
      );
      Events.emitCheckable("fileSaved");
    });
  }
}
