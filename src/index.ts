import Visitor from "./visitor/Visitor";
import { exec } from "child_process";
import { Events, timer, Recorder, Config } from "./utils/Util";
import Logger from "./utils/Logger";
import WebDriverManager from "./drivers/WebDriverManager";
import { EVENTS } from "models/Models";

/**
 * The root of the program.
 * Runs all necessary components and services.
 */
class MainApp {
  private webDriverManager: WebDriverManager;
  private visitor: Visitor;

  constructor() {
    // @TODO Remove this and make exit from session properly
    // killing all google chrome instances
    exec("pkill -9 -f google-chrome");

    const target_link = Config.get_param("TARGET_CALL_LINK")!;

    this.webDriverManager = new WebDriverManager();
    this.visitor = new Visitor(target_link);
  }

  public async start() {
    try {
      await this.webDriverManager.downloadChromeDriver();
      await Recorder.init();
      await this.visitor.init_driver(this.webDriverManager.chromedriver_path);
      await Recorder.awaitForSocketReady();
      await Recorder.chooseStream();
      await Recorder.startRecord();
      await timer(10000);
      await Recorder.stopRecord();
      // this.visitor.start();
    } catch (err) {
      Events.emit(
        EVENTS.exit,
        `Failed to start: ${(err as Error).message || err}`
      );
    }
  }

  public listenEvents() {
    Events.on(EVENTS.exit, async (error?: string) => {
      let exitCode = 0;
      if (error) {
        Logger.printError(error);
        exitCode = 1;
      }

      await this.visitor?.shutdown.call(this.visitor);

      process.exit(exitCode);
    });
  }
}

const mainApp = new MainApp();
mainApp.listenEvents();
mainApp.start();
