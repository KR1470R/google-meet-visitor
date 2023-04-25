/* eslint-disable @typescript-eslint/no-var-requires */
import { Builder, WebDriver, Key, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import {
  Events,
  minutesToMs,
  predictFinishDate,
  Socket,
  Config,
  timeoutWhileCondition,
} from "../utils/Util";
import Logger from "../utils/Logger";
import CustomOptions from "./CustomOptions";
import Parser from "./Parser";
import { EVENTS } from "../models/Models";
import { setTimeout } from "node:timers/promises";

/**
 * Visitor that performs such actions:
 *  - ask to join if required
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

  private log_header = "Visitor";

  constructor(target_url: string) {
    this.target_url = target_url;

    this.options = new CustomOptions();
  }

  /**
   * Init driver and configure all neccessary components.
   */
  public async init_driver(webdriver_path: string) {
    try {
      this.service = new chrome.ServiceBuilder(webdriver_path);
      this.driver = await new Builder()
        .forBrowser("chrome")
        .setChromeService(this.service)
        .setChromeOptions(this.options)
        .build();

      this.alive = true;

      this.parser = new Parser(this.driver);

      await this.provideLoginIsRequred();

      await this.driver.get(this.target_url);

      await this.canIJoinCall();

      await this.provideSocketPort();
    } catch (err) {
      throw err;
    }
  }

  /**
   * Start work.
   */
  public async start() {
    await this.driver.sleep(2000);

    await this.driver.manage().window().setRect({
      width: 800,
      height: 1000,
    });

    if (
      Config.get_param("MINIMIZED", false) === "true" &&
      Config.get_param("RECORD_TAB", false) !== "true"
    )
      await this.driver.manage().window().minimize();

    await this.start_call();

    this.driver.sleep(1000);

    Logger.printInfo(this.log_header, "Finished task successfully!");
    this.driver.sleep(2000);
  }

  /**
   * Recognize is login require, if so, avait till user perform login (timeout 5min).
   */
  public async provideLoginIsRequred() {
    Logger.printInfo(
      this.log_header,
      "Checking is google account login is required..."
    );

    await this.driver.get("https://apps.google.com/intl/en/meet/");

    const sigin_btn = await this.parser.waitForElementWithInnerText(
      "a",
      "Sign in",
      5000,
      false
    );

    if (!sigin_btn) {
      Logger.printInfo(this.log_header, "Already logined.");
      return Promise.resolve();
    }

    Logger.printInfo(
      this.log_header,
      "Sign in required, waiting for 5 minutes untill the user perform login..."
    );

    await sigin_btn.click();

    await timeoutWhileCondition(
      (async () =>
        (
          await this.driver.getCurrentUrl()
        ).includes("https://meet.google.com/")).bind(this),
      300000
    );

    Logger.printInfo(this.log_header, "Logined.");
  }

  /**
   * Check for window "You cannot join this call" or other else if call is blocked for user.
   * If user have no access - stop visitor and throw error to logs.
   */
  private async canIJoinCall() {
    Logger.printInfo(this.log_header, "Checking can i join call...");
    const returnToCall = await this.parser.waitFor(
      {
        xpath: "//*[contains(text(), 'Return to home screen')]/parent::button",
      },
      5000,
      false
    );
    if (returnToCall) {
      Events.emitCheckable(
        EVENTS.exit,
        "I cannot join this call!",
        this.log_header
      );
      await this.driver.sleep(2000);
    } else return Promise.resolve();
  }

  /**
   * Disable user micro and videocam for call.
   */
  private async disableMediaDevices() {
    Logger.printInfo(this.log_header, "Disabling media devices at call...");

    Logger.printInfo(this.log_header, "Disabling camera...");
    await this.driver
      .actions()
      .keyDown(Key.CONTROL)
      .sendKeys("e")
      .keyUp(Key.CONTROL)
      .perform();

    await this.driver.sleep(1000);

    Logger.printInfo(this.log_header, "Disabling microphone...");
    await this.driver
      .actions()
      .keyDown(Key.CONTROL)
      .sendKeys("d")
      .keyUp(Key.CONTROL)
      .perform();
  }

  /**
   * Makes all user actions to perfom join call.
   */
  private async start_call() {
    Logger.printInfo(this.log_header, `Starting call at ${this.target_url}...`);
    await this.disableMediaDevices();
    await this.driver.sleep(2000);
    await this.joinCall();
    await this.driver.sleep(2000);
    await this.stayAtCallWhile();
    await this.driver.sleep(2000);
  }

  /**
   * Stay at call for specified time.
   * Prevents windows like "Are you here?" to stay at call.
   */
  private async stayAtCallWhile() {
    const minutes = parseInt(Config.get_param("CALL_TIMER_MINUTES")!);
    if (Number.isNaN(minutes)) {
      Events.emitCheckable(
        EVENTS.exit,
        `Failed in parsing timer input: '${minutes}' is not a number!`,
        this.log_header
      );
    }

    Logger.printInfo(
      this.log_header,
      `Staying at call till ${predictFinishDate(
        minutesToMs(minutes)
      )}(${minutes} minute${minutes > 1 ? "s" : ""})`
    );

    let ms = minutesToMs(minutes);
    const timer_offset_ms = 1000;
    const timer_for_stay_call = 60000;

    while (ms >= 0) {
      if (ms >= timer_for_stay_call) {
        const timer_start = performance.now();
        const target_el = await this.parser.waitFor(
          {
            xpath: "//*[contains(text(), 'Stay in the call')]/parent::button",
          },
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
        await setTimeout(timer_offset_ms);
        ms -= timer_offset_ms;
      }
    }

    return Promise.resolve();
  }

  /**
   * Checks should user ask for join, if so - await till user get join access, otherwise join call.
   */
  private async joinCall() {
    Logger.printInfo(this.log_header, "Joining call...");

    const button_join = await this.parser.waitFor(
      {
        xpath: "//*[contains(text(), 'Join now')]/parent::button",
      },
      5000,
      false
    );

    if (button_join) {
      await this.driver.sleep(2000);
      await button_join?.click();
      Logger.printInfo(this.log_header, "Joined!");
    } else {
      Logger.printError(this.log_header, "Couldn't find join button!");
      Logger.printWarning(
        this.log_header,
        "Checking is user has permissions to join..."
      );
      await this.askToJoin();
    }
  }

  private async askToJoin() {
    const ask_to_join = await this.parser.waitFor(
      {
        xpath: "//*[contains(text(), 'Ask to join')]/parent::button",
      },
      2000,
      false
    );

    if (ask_to_join) {
      Logger.printWarning(
        this.log_header,
        "Asked for join call. Waiting for 10 minutes."
      );
      await ask_to_join.click();
      const leave_button = await this.parser.waitFor(
        {
          tagname: "button[aria-label='Leave call'][role=button]",
        },
        600000,
        false
      );
      if (!leave_button) {
        Events.emitCheckable(
          EVENTS.exit,
          "Host didn't accepted your request to join call!",
          this.log_header
        );
        this.driver.sleep(2000);
      } else Logger.printInfo(this.log_header, "Joined!");
    } else {
      Events.emitCheckable(
        EVENTS.exit,
        "Uknown error to join this call",
        this.log_header
      );
      this.driver.sleep(2000);
    }
  }

  /**
   * Simple leveaving call.
   */
  public async leaveCall() {
    Logger.printInfo(this.log_header, "Leaving call...");
    const leave_button = await this.parser.getElementByTagName(
      "button[aria-label='Leave call'][role=button]"
    );
    await this.driver.sleep(2000);
    await leave_button?.click();
  }

  public getTabTitle() {
    return this.driver.getTitle();
  }

  /**
   * Send socket port to localstorage of current page.
   */
  private async provideSocketPort() {
    const server_port = Socket.getAddressKey("port");

    if (server_port) {
      Logger.printInfo(this.log_header, "Sending server port to extension");
      await this.driver.executeScript(
        `
        localStorage.setItem("recorder_port", ${String(server_port)});
        `
      );
    } else Logger.printWarning(this.log_header, "Server port is null");
  }

  /**
   * Stop visitor work.
   */
  public async shutdown() {
    if (!this.alive || this.pending_shutdown) return;

    this.pending_shutdown = true;

    Logger.printInfo(this.log_header, "Shutdown.");

    await this.driver.quit();
  }
}
