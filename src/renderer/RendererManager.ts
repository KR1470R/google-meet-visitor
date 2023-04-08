import { app, BrowserWindow } from "electron";
import * as path from "node:path";
import { Events } from "../utils/Util";
import { EVENTS } from "../models/Models";

export default class RendererManager {
  public mainWindow?: BrowserWindow;
  private windowOptions = {
    width: 0,
    height: 0,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  };

  public onready?: (...args: any) => void;
  public onactivate?: (...args: any) => void;

  public async init() {
    this.mainWindow = new BrowserWindow(this.windowOptions);
    await this.mainWindow.loadFile("index.html");
  }

  public bindEvents() {
    if (!this.onready || !this.onactivate)
      throw Error(
        "RenderManagerError: ensure you passed onready and onactivate callbacks."
      );
    app.on("ready", this.onready);
    app.on("activate", this.onactivate);
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") this.exit();
    });
  }

  public isOpenedAnyWindow() {
    return BrowserWindow.getAllWindows().length >= 1;
  }

  public exit() {
    Events.emitCheckable(EVENTS.exit);
    setImmediate(app.quit);
  }
}
