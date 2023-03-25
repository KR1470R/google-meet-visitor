import { Builder, WebDriver, Key } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import Config from "./Config";
import { Events, minutesToMs, timer } from "./Util";
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

    Events.on("on_exit", (error?: string) => this.shutdown(error));
  }

  public async init() {
    this.service = new chrome.ServiceBuilder("./src/drivers/chromedriver");
    this.options = new CustomOptions();
    this.driver = await new Builder()
      .forBrowser("chrome")
      .setChromeService(this.service)
      .setChromeOptions(this.options)
      .build();
    if (Config.get_param("MINIMIZED") === "true")
      await this.driver.manage().window().minimize();

    this.parser = new Parser(this.driver);

    await this.start_call();
    Logger.printSuccess("successfully!");
  }

  public async start_call() {
    Logger.printHeader("[start_call]", this.target_url);
    await this.driver.sleep(2000);
    await this.driver.get(this.target_url);
    await this.disableMediaDevices();
    await this.driver.sleep(2000);
    await this.join();
    await this.driver.sleep(2000);
    await this.stayAtCallWhile();
    await this.driver.sleep(1000);
    Events.emitCheckable("on_exit");
  }

  public async stayAtCallWhile() {
    const minutes = parseInt(Config.get_param("CALL_TIMER_MINUTES"));
    if (Number.isNaN(minutes)) {
      Events.emit(
        "on_exit",
        `Failed in parsing timer input: '${minutes}' is not a number!`
      );
    }

    Logger.printHeader("[stayAtCallWhile]", `${minutes} minutes`);

    let ms = minutesToMs(minutes);
    const timer_offset_ms = 1000;
    const timer_for_stay_call = 1200000;

    while (ms >= 0) {
      if (ms >= timer_for_stay_call) {
        Logger.printWarning("waiting for 'stay in the call' button...");
        const timer_start = performance.now();
        const target_el = await this.parser.waitFor(
          "//*[contains(text(), 'Stay in the call')]/parent::button",
          timer_for_stay_call,
          true
        );
        const timer_end = performance.now();
        Logger.printInfo(`button appeared after ${timer_end - timer_start} ms`);
        await this.driver.sleep(2000);
        await target_el?.click();
        ms -= timer_end - timer_start;
      } else {
        await timer(timer_offset_ms);
        ms -= timer_offset_ms;
      }
    }

    Logger.printInfo("done. leaving...");
    const leave_button = await this.parser.getElementByTagName(
      "button[aria-label='Leave call'][role=button]"
    );
    await this.driver.sleep(2000);
    await leave_button?.click();
  }

  private async join() {
    Logger.printHeader("[join]");
    const ask_to_join = await this.parser.waitFor(
      "//*[contains(text(), 'Ask to join')]/parent::button",
      120000,
      false
    );

    if (ask_to_join) {
      Events.emit("on_exit", "You cannot join this call due need to ask.");
      this.driver.sleep(2000);
    } else {
      const button_join = await this.parser.waitFor(
        "//*[contains(text(), 'Join now')]/parent::button",
        300000,
        true
      );
      await this.driver.sleep(2000);
      await button_join?.click();
    }
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
      const account_button = await this.parser.getElementByTagName(
        "div[data-authuser]"
      );
      if (account_button) await account_button.click();
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
