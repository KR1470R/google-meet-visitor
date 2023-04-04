import { app, BrowserWindow } from "electron";
import Visitor from "./Visitor";
import Config from "./Config";
import { exec } from "child_process";
import { Events } from "./Util";
import * as path from "node:path";
import RecordManager from "./RecordManager";

class MainApp {
  private mainWindow!: BrowserWindow;
  private visitor: Visitor;
  private recordManager: RecordManager;

  constructor() {
    // @TODO Remove this and make exit from session properly
    // killing all google chrome instances
    exec("pkill -9 -f google-chrome");

    Config.init();

    const target_link = Config.get_param("TARGET_CALL_LINK")!;

    this.visitor = new Visitor(target_link);
    this.recordManager = new RecordManager();
  }

  private async start() {
    this.mainWindow = new BrowserWindow({
      width: 700,
      height: 500,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
      },
    });

    await this.mainWindow.loadFile("index.html");

    await this.visitor.init_driver();

    await this.recordManager.init(
      await this.visitor.getTabTitle(),
      this.mainWindow
    );

    this.visitor.start();
  }

  public listenEvents() {
    app.on("ready", this.start.bind(this));
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        Events.emitCheckable("on_exit");
        setImmediate(app.quit);
      }
    });
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) this.start.bind(this)();
    });

    Events.on(
      "visitor_start",
      this.recordManager?.startRecord.bind(this.recordManager)
    );
    Events.on(
      "visitor_stop",
      this.recordManager?.stopRecord.bind(this.recordManager)
    );
  }
}

const mainApp = new MainApp();
mainApp.listenEvents();
