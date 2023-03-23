import { Builder, WebDriver, Key } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import Config from "./Config";
import { Events, getRandomInt, minutesToMs, timer } from "./Util";
import Logger from "./Logger";
import CustomOptions from "./CustomOptions";
import Parser from "./Parser";

export default class Visitor {
  public target_url: string;
  private driver!: WebDriver;
  private service!: chrome.ServiceBuilder;
  private options!: CustomOptions;
  private parser!: Parser;

  constructor(target_url: string) {
    this.target_url = target_url;

    Events.on("on_exit", (error: string) => this.shutdown(error));
  }

  public async init() {
    this.service = new chrome.ServiceBuilder("./src/drivers/chromedriver");
    this.options = new CustomOptions();
    this.driver = await new Builder()
      .forBrowser("chrome")
      .setChromeService(this.service)
      .setChromeOptions(this.options)
      .build();
    this.parser = new Parser(this.driver);

    await this.start_call();
    Logger.printSuccess("successfully!");
    // await this.driver.manage().deleteAllCookies();
  }

  public async start_call() {
    Logger.printHeader("[start_call]", this.target_url);
    await this.driver.sleep(2000);
    await this.driver.get(this.target_url);
    await this.disableMediaDevices();
    await this.join();
    await this.driver.sleep(2000);
    await this.stayAtCallWhile();
  }

  public async stayAtCallWhile() {
    Logger.printHeader("[stayAtCallWhile]");

    const minutes = parseInt(Config.get_param("CALL_TIMER"));
    if (Number.isNaN(minutes)) {
      Events.emit(
        "on_exit",
        `Failed in parsing timer input: '${minutes}' is not a number!`
      );
    }

    let ms = minutesToMs(minutes);
    const timer_offset_ms = 1000;

    const leave_button = await this.parser.getElementByInnerText(
      "button[role=button]",
      "call_check"
    );

    while (ms >= 0) {
      await timer(timer_offset_ms);
      ms -= timer_offset_ms;
      await this.driver
        .actions()
        .move({
          duration: getRandomInt(100, 600),
          origin: leave_button,
        })
        .perform();
    }
  }

  private async join() {
    Logger.printHeader("[join]");
    await (
      await this.parser.getElementByInnerText("button", "Join now")
    )?.click();
  }

  private async disableMediaDevices() {
    Logger.printHeader("[disableMediaDevices]");

    Logger.printInfo("disabling camera...");
    await this.driver
      .actions()
      .keyDown(Key.CONTROL)
      .sendKeys("e")
      .keyUp(Key.CONTROL)
      .perform();

    await this.driver.sleep(1000);

    Logger.printInfo("disabling microphone...");
    await this.driver
      .actions()
      .keyDown(Key.CONTROL)
      .sendKeys("d")
      .keyUp(Key.CONTROL)
      .perform();
  }

  public async chooseFirstAccount() {
    Logger.printHeader("[chooseFirstAccount]");
    try {
      await this.driver.sleep(2000);
      await this.parser.getElementByTagName("div[data-authuser]").click();
    } catch (err) {
      Logger.printWarning((err as Error).message);
      return Promise.resolve();
    }
  }

  public async shutdown(error?: string) {
    let exitCode = 0;
    if (error) {
      Logger.printError(error);
      exitCode = 1;
    }
    Logger.printHeader("[shutdown]");
    await this.driver.quit();
    process.exit(exitCode);
  }
}
