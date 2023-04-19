/* eslint-disable @typescript-eslint/no-var-requires */
import { Builder, WebDriver, Key, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import {
  Events,
  minutesToMs,
  timer,
  predictFinishDate,
  Socket,
  Config,
  timeoutWhileCondition,
  Recorder,
} from "../utils/Util";
import Logger from "../utils/Logger";
import CustomOptions from "./CustomOptions";
import Parser from "./Parser";
import { EVENTS } from "../models/Models";

/**
 * Visitor that performs such actions:
 *  - join call;
 *  - mute all media devices if user specified such options;
 *  - visit call;
 *  - stay at call for a time specified by user.
 */
export default class Visitor {
  public target_url: string;
  private driver!: WebDriver;
  private service!: chrome.ServiceBuilder;
  private options!: CustomOptions;
  private parser!: Parser;

  private pending_shutdown = false;
  private alive = false;

  constructor(target_url: string) {
    this.target_url = target_url;

    this.options = new CustomOptions();
  }

  public async init_driver(webdriver_path: string) {
    try {
      const server_port = Socket.getAddressKey("port");

      this.service = new chrome.ServiceBuilder(webdriver_path);
      this.driver = await new Builder()
        .forBrowser("chrome")
        .setChromeService(this.service)
        .setChromeOptions(this.options)
        .build();

      this.alive = true;

      this.parser = new Parser(this.driver);

      await this.driver.get(this.target_url);

      await this.provideLoginIsRequred();

      await this.isICanJoinCall();

      if (server_port)
        await this.driver.executeScript(
          `
          localStorage.setItem("recorder_port", ${String(server_port)});
          `
        );
    } catch (err) {
      throw err;
    }
  }

  public async start() {
    await Recorder.startRecord();

    await this.driver.sleep(2000);

    Events.emit(EVENTS.visitor_start);

    await this.driver.manage().window().setRect({
      width: 800,
      height: 1000,
      x: -1000,
      y: -1000,
    });

    if (
      Config.get_param("MINIMIZED", false) === "true" &&
      Config.get_param("RECORD_TAB", false) !== "true"
    )
      await this.driver.manage().window().minimize();

    await this.start_call();

    this.driver.sleep(1000);

    await Recorder.stopRecord();

    Logger.printSuccess("successfully!");
    this.driver.sleep(2000);

    await this.shutdown();
  }

  private async start_call() {
    Logger.printHeader("[Visitor]", `Starting call at ${this.target_url}...`);
    await this.disableMediaDevices();
    await this.driver.sleep(2000);
    await this.join();
    await this.driver.sleep(2000);
    await this.stayAtCallWhile();
    await this.driver.sleep(2000);
    Events.emit(EVENTS.visitor_stop);
  }

  private async stayAtCallWhile() {
    const minutes = parseInt(Config.get_param("CALL_TIMER_MINUTES")!);
    if (Number.isNaN(minutes)) {
      Events.emit(
        EVENTS.exit,
        `Failed in parsing timer input: '${minutes}' is not a number!`
      );
    }

    Logger.printHeader(
      "[Visitor]",
      `Staying at call till ${predictFinishDate(
        minutesToMs(minutes)
      )}(${minutes} minutes)`
    );

    let ms = minutesToMs(minutes);
    const timer_offset_ms = 1000;
    const timer_for_stay_call = 60000;

    while (ms >= 0) {
      if (ms >= timer_for_stay_call) {
        const timer_start = performance.now();
        const target_el = await this.parser.waitFor(
          "//*[contains(text(), 'Stay in the call')]/parent::button",
          timer_for_stay_call,
          false
        );
        if (target_el && until.stalenessOf(target_el)) {
          await this.driver.sleep(2000);
          await target_el?.click();
        }
        const timer_end = performance.now();
        ms -= timer_end - timer_start;
      } else {
        await timer(timer_offset_ms);
        ms -= timer_offset_ms;
      }
    }

    Logger.printHeader("[Visitor]", "Done! Leaving...");
    const leave_button = await this.parser.getElementByTagName(
      "button[aria-label='Leave call'][role=button]"
    );
    await this.driver.sleep(2000);
    await leave_button?.click();
  }

  private async join() {
    Logger.printHeader("[Visitor]", "Joining call...");

    const button_join = await this.parser.waitFor(
      "//*[contains(text(), 'Join now')]/parent::button",
      60000,
      false
    );

    if (button_join) {
      await this.driver.sleep(2000);
      await button_join?.click();
      Logger.printHeader("[Visitor]", "Joined!");
    } else {
      Logger.printError("Couldn't find join button!");
      Logger.printWarning("checking is user has permissions to join...");
      const ask_to_join = await this.parser.waitFor(
        "//*[contains(text(), 'Ask to join')]/parent::button",
        2000,
        false
      );

      if (ask_to_join)
        Events.emit(
          EVENTS.exit,
          "You cannot join this call, because you need to ask."
        );
      else Events.emit(EVENTS.exit, "Uknown error to join this call");

      this.driver.sleep(2000);
    }
  }

  private async disableMediaDevices() {
    Logger.printHeader("[Visitor]", "Disabling media devices at call...");

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

  /**
   * deprecated.
   * @returns
   */
  private async chooseFirstAccount() {
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

  private async isICanJoinCall() {
    Logger.printHeader("[Visitor]", "Checking can i join call...");
    const returnToCall = await this.parser.waitFor(
      "//*[contains(text(), 'Return to home screen')]/parent::button",
      5000,
      false
    );
    if (returnToCall) {
      Events.emit(EVENTS.exit, "I cannot join this call!");
      await this.driver.sleep(2000);
    } else return Promise.resolve();
  }

  public async shutdown() {
    if (!this.alive || this.pending_shutdown) return;

    this.pending_shutdown = true;

    Logger.printHeader("[Visitor]", "Shutdown.");

    await this.driver.quit();
  }

  public getTabTitle() {
    return this.driver.getTitle();
  }

  public async provideLoginIsRequred() {
    Logger.printHeader(
      "[Visitor]",
      "Checking is google account login is required..."
    );
    const sigin_label = await this.parser.waitForElementWithInnerText(
      "button",
      "Next",
      5000,
      false
    );

    if (!sigin_label) {
      Logger.printHeader("[Visitor]", "Already logined.");
      // await this.driver.sleep(60000);
      return Promise.resolve();
    }

    Logger.printHeader(
      "[Visitor]",
      "Sign in required, waiting for 5 minutes untill the user perform login..."
    );

    await timeoutWhileCondition(
      (async () =>
        (await this.driver.getCurrentUrl()) === this.target_url).bind(this),
      300000
    );
  }
}
