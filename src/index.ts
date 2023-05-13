import Visitor from "./visitor/Visitor";
import { Events, Recorder, Config, Socket } from "./utils/Util";
import Logger from "./utils/Logger";
import WebDriverManager from "./drivers/WebDriverManager";
import { EVENTS } from "models/Models";
import SignalManager from "utils/SignalManager";

/**
 * The root of the program.
 * Runs all necessary components and services.
 */
class MainApp {
  private readonly log_header = "index";
  private webDriverManager: WebDriverManager;
  private visitor: Visitor;
  private signalManager: SignalManager;

  constructor() {
    const target_link = Config.get_param("TARGET_CALL_LINK")!;

    this.webDriverManager = new WebDriverManager();
    this.visitor = new Visitor(target_link);
    this.signalManager = new SignalManager();

    this.signalManager.addCallback(async () => {
      await this.visitor.leaveCall.call(this.visitor);
      this.visitor.freeze.call(this.visitor);
      await Recorder.stopRecord.call(Recorder);
      this.visitor.unfreeze.call(this.visitor);
      await this.visitor.shutdown.call(this.visitor);
    });

    Events.on(EVENTS.exit, async (error?: string) => {
      if (this.signalManager.already_catched) return;

      let exitCode = 0;
      if (error) {
        Logger.printFatal(this.log_header, error);
        exitCode = 1;
      }

      await Recorder.stopRecord();
      await this.visitor?.shutdown.call(this.visitor);

      process.exit(exitCode);
    });

    this.signalManager.listenEvents(false);
  }

  public async start() {
    try {
      // Init all components.
      await this.webDriverManager.init();
      await this.webDriverManager.provideChromeDriver();
      await Socket.init();
      await Recorder.init();
      await this.visitor.init_driver(this.webDriverManager.chromedriver_path);
      await Recorder.awaitForSocketReady();
      await this.visitor.maximize();
      await Recorder.chooseStream();
      await this.visitor.minimize();

      // Start work.
      await Recorder.startRecord();
      await this.visitor.start();
      await Recorder.stopRecord();

      // Exit after work finished.
      await this.visitor.shutdown();
    } catch (err) {
      Events.emitCheckable(
        EVENTS.exit,
        `Failed to start: ${(err as Error).message || err}`,
        this.log_header
      );
    }
  }
}

const mainApp = new MainApp();
mainApp.start();
