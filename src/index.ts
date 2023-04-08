import Visitor from "./visitor/Visitor";
import Config from "./configs/DotEnvConfig";
import { exec } from "child_process";
import { Events } from "./utils/Util";
import RecordManager from "./recorder/RecordManager";
import Logger from "./utils/Logger";
import WebDriverManager from "./drivers/WebDriverManager";
import RendererManager from "./renderer/RendererManager";
import { EVENTS } from "models/Models";

class MainApp {
  private webDriverManager: WebDriverManager;
  private rendererManager: RendererManager;
  private recordManager: RecordManager;
  private visitor: Visitor;

  constructor() {
    // @TODO Remove this and make exit from session properly
    // killing all google chrome instances
    exec("pkill -9 -f google-chrome");

    Config.init();

    const target_link = Config.get_param("TARGET_CALL_LINK")!;

    this.webDriverManager = new WebDriverManager();
    this.rendererManager = new RendererManager();
    this.recordManager = new RecordManager();
    this.visitor = new Visitor(target_link);

    this.rendererManager.onready = this.start.bind(this);
    this.rendererManager.onactivate = () => {
      if (this.rendererManager.isOpenedAnyWindow()) return;
      this.start.bind(this);
    };
  }

  private async start() {
    await this.webDriverManager.downloadChromeDriver();
    await this.rendererManager.init();
    await this.visitor.init_driver(this.webDriverManager.chromedriver_path);
    await this.recordManager.init(
      await this.visitor.getTabTitle(),
      this.rendererManager.mainWindow!
    );

    this.visitor.start();
  }

  public listenEvents() {
    this.rendererManager.bindEvents();
    Events.on(
      EVENTS.visitor_start,
      this.recordManager?.startRecord.bind(this.recordManager)
    );
    Events.on(
      EVENTS.visitor_stop,
      this.recordManager?.stopRecord.bind(this.recordManager)
    );
    Events.on(EVENTS.exit, async (error?: string) => {
      let exitCode = 0;
      if (error) {
        Logger.printError(error);
        exitCode = 1;
      } else await this.recordManager.awaitFileSaving();

      await this.visitor?.shutdown.call(this.visitor);

      process.exit(exitCode);
    });
  }
}

const mainApp = new MainApp();
mainApp.listenEvents();
